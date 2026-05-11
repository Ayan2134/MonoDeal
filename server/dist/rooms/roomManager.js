import { randomUUID } from 'node:crypto';
import { normalizePlayerName, normalizeRoomCode, validateCreateRoomPayload, validateJoinRoomPayload, validateReconnectPayload, validateStartGamePayload, validateTurnPayload, } from './validation.js';
import { initializeGameState } from '../game/initialize.js';
import { endTurn, startTurn } from '../game/turn.js';
import { DISCONNECT_GRACE_MS } from './constants.js';
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export class RoomManager {
    roomsById = new Map();
    roomIdByCode = new Map();
    roomIdByPlayerId = new Map();
    cleanupTimers = new Map();
    createRoom(payload, socketId) {
        const validationError = validateCreateRoomPayload(payload);
        if (validationError) {
            return { ok: false, error: validationError };
        }
        // A browser session can host only one active room at a time. Creating a new
        // room moves that player out of any previous in-memory room first.
        this.leaveCurrentRoom(payload.playerId);
        const now = Date.now();
        const roomId = randomUUID();
        const roomCode = this.createUniqueRoomCode();
        const host = {
            playerId: payload.playerId,
            name: normalizePlayerName(payload.playerName),
            isHost: true,
            status: 'connected',
            socketId,
        };
        const room = {
            roomId,
            roomCode,
            maxPlayers: payload.maxPlayers,
            hostId: payload.playerId,
            status: 'waiting',
            players: [host],
            createdAt: now,
            updatedAt: now,
        };
        this.roomsById.set(roomId, room);
        this.roomIdByCode.set(roomCode, roomId);
        this.roomIdByPlayerId.set(payload.playerId, roomId);
        return { ok: true, room: this.toPublicRoom(room) };
    }
    joinRoom(payload, socketId) {
        const validationError = validateJoinRoomPayload(payload);
        if (validationError) {
            return { ok: false, error: validationError };
        }
        const room = this.findRoom(payload);
        if (!room) {
            return { ok: false, error: 'Room not found.' };
        }
        const existingPlayer = room.players.find((player) => player.playerId === payload.playerId);
        if (existingPlayer) {
            // Existing players are allowed back in even if the room is now full or
            // the game has already started. The durable playerId means this is a
            // seat recovery, not a new join request.
            this.connectExistingPlayer(room, existingPlayer, socketId, payload.playerName);
            return { ok: true, room: this.toPublicRoom(room) };
        }
        if (room.status !== 'waiting') {
            return { ok: false, error: 'This game has already started.' };
        }
        if (room.players.length >= room.maxPlayers) {
            return { ok: false, error: 'Room is full.' };
        }
        this.leaveCurrentRoom(payload.playerId);
        room.players.push({
            playerId: payload.playerId,
            name: normalizePlayerName(payload.playerName),
            isHost: false,
            status: 'connected',
            socketId,
        });
        room.updatedAt = Date.now();
        this.roomIdByPlayerId.set(payload.playerId, room.roomId);
        return { ok: true, room: this.toPublicRoom(room) };
    }
    reconnectPlayer(payload, socketId) {
        const validationError = validateReconnectPayload(payload);
        if (validationError) {
            return { ok: false, error: validationError };
        }
        const room = this.roomsById.get(payload.roomId);
        const existingPlayer = room?.players.find((player) => player.playerId === payload.playerId);
        if (!room || !existingPlayer) {
            return { ok: false, error: 'Player is not part of this room.' };
        }
        // The browser's durable playerId is the authority here, not socket.id.
        // Socket.IO intentionally gives a new socket.id after reconnects, so we
        // bind the new transport connection back to the existing player record.
        this.connectExistingPlayer(room, existingPlayer, socketId);
        return { ok: true, room: this.toPublicRoom(room) };
    }
    leaveRoom(payload) {
        const room = this.roomsById.get(payload.roomId);
        if (!room) {
            return null;
        }
        this.removePlayer(room, payload.playerId);
        return this.roomsById.has(room.roomId) ? this.toPublicRoom(room) : null;
    }
    startGame(payload) {
        const validationError = validateStartGamePayload(payload);
        if (validationError) {
            return { ok: false, error: validationError };
        }
        const room = this.roomsById.get(payload.roomId);
        if (!room) {
            return { ok: false, error: 'Room not found.' };
        }
        if (room.hostId !== payload.playerId) {
            return { ok: false, error: 'Only the host can start the game.' };
        }
        if (room.players.length < 2) {
            return { ok: false, error: 'At least two players are required to start.' };
        }
        room.status = 'started';
        room.gameState = initializeGameState(room);
        room.updatedAt = Date.now();
        return { ok: true, room: this.toPublicRoom(room) };
    }
    startTurn(payload) {
        const validationError = validateTurnPayload(payload);
        if (validationError) {
            return { ok: false, error: validationError };
        }
        const room = this.roomsById.get(payload.roomId);
        if (!room || !room.gameState) {
            return { ok: false, error: 'Game state not found.' };
        }
        const player = room.players.find((currentPlayer) => currentPlayer.playerId === payload.playerId);
        if (!player || player.status !== 'connected') {
            return { ok: false, error: 'Player is not connected.' };
        }
        const result = startTurn(room.gameState, payload.playerId);
        if (result.ok) {
            room.gameState = result.gameState;
            room.updatedAt = Date.now();
        }
        return result;
    }
    endTurn(payload) {
        const validationError = validateTurnPayload(payload);
        if (validationError) {
            return { ok: false, error: validationError };
        }
        const room = this.roomsById.get(payload.roomId);
        if (!room || !room.gameState) {
            return { ok: false, error: 'Game state not found.' };
        }
        const player = room.players.find((currentPlayer) => currentPlayer.playerId === payload.playerId);
        if (!player || player.status !== 'connected') {
            return { ok: false, error: 'Player is not connected.' };
        }
        const result = endTurn(room.gameState, payload.playerId);
        if (result.ok) {
            room.gameState = result.gameState;
            room.updatedAt = Date.now();
        }
        return result;
    }
    getGameState(roomId) {
        return this.roomsById.get(roomId)?.gameState ?? null;
    }
    markDisconnected(socketId, onExpire) {
        const updatedRooms = [];
        for (const room of this.roomsById.values()) {
            const player = room.players.find((currentPlayer) => currentPlayer.socketId === socketId);
            if (!player) {
                continue;
            }
            // The player stays in the room during the grace period so refreshes and
            // short network drops can reclaim the same seat by sending reconnect-player
            // with the persistent playerId. This avoids duplicate players because the
            // old room slot is updated instead of appending a new player.
            player.status = 'disconnected';
            player.socketId = undefined;
            player.disconnectedAt = Date.now();
            room.updatedAt = Date.now();
            updatedRooms.push(this.toPublicRoom(room));
            this.scheduleDisconnectedPlayerRemoval(room.roomId, player.playerId, onExpire);
        }
        return updatedRooms;
    }
    getRoom(roomId) {
        const room = this.roomsById.get(roomId);
        return room ? this.toPublicRoom(room) : null;
    }
    findRoom(payload) {
        if (payload.roomId) {
            return this.roomsById.get(payload.roomId);
        }
        if (!payload.roomCode) {
            return null;
        }
        const roomId = this.roomIdByCode.get(normalizeRoomCode(payload.roomCode));
        return roomId ? this.roomsById.get(roomId) : null;
    }
    connectExistingPlayer(room, player, socketId, playerName) {
        // A successful reconnect cancels the pending removal timer and replaces the
        // stale socket.id. The stable identity remains player.playerId, which is
        // generated in the browser and stored in localStorage.
        this.clearCleanupTimer(player.playerId);
        player.name = playerName ? normalizePlayerName(playerName) : player.name;
        player.status = 'connected';
        player.socketId = socketId;
        player.disconnectedAt = undefined;
        room.updatedAt = Date.now();
        this.roomIdByPlayerId.set(player.playerId, room.roomId);
    }
    leaveCurrentRoom(playerId) {
        const currentRoomId = this.roomIdByPlayerId.get(playerId);
        if (!currentRoomId) {
            return;
        }
        const currentRoom = this.roomsById.get(currentRoomId);
        if (currentRoom) {
            this.removePlayer(currentRoom, playerId);
        }
    }
    removePlayer(room, playerId) {
        room.players = room.players.filter((player) => player.playerId !== playerId);
        this.roomIdByPlayerId.delete(playerId);
        this.clearCleanupTimer(playerId);
        if (room.players.length === 0) {
            this.roomsById.delete(room.roomId);
            this.roomIdByCode.delete(room.roomCode);
            return;
        }
        if (room.hostId === playerId) {
            const nextHost = room.players[0];
            if (nextHost) {
                nextHost.isHost = true;
                room.hostId = nextHost.playerId;
            }
        }
        room.updatedAt = Date.now();
    }
    scheduleDisconnectedPlayerRemoval(roomId, playerId, onExpire) {
        this.clearCleanupTimer(playerId);
        const timer = setTimeout(() => {
            const room = this.roomsById.get(roomId);
            const player = room?.players.find((currentPlayer) => currentPlayer.playerId === playerId);
            if (!room || !player || player.status === 'connected') {
                return;
            }
            this.removePlayer(room, playerId);
            onExpire(this.roomsById.has(roomId) ? this.toPublicRoom(room) : null);
        }, DISCONNECT_GRACE_MS);
        this.cleanupTimers.set(playerId, timer);
    }
    clearCleanupTimer(playerId) {
        const timer = this.cleanupTimers.get(playerId);
        if (timer) {
            clearTimeout(timer);
            this.cleanupTimers.delete(playerId);
        }
    }
    createUniqueRoomCode() {
        let code = '';
        for (let index = 0; index < 6; index += 1) {
            code += ROOM_CODE_ALPHABET.charAt(Math.floor(Math.random() * ROOM_CODE_ALPHABET.length));
        }
        return this.roomIdByCode.has(code) ? this.createUniqueRoomCode() : code;
    }
    toPublicRoom(room) {
        return {
            roomId: room.roomId,
            roomCode: room.roomCode,
            // Invite links use the human-shareable room code so hosts can paste a
            // short URL like /room/ABCD12. The server still keeps roomId internally
            // for stable storage and reconnect bookkeeping.
            invitePath: `/room/${room.roomCode}`,
            maxPlayers: room.maxPlayers,
            hostId: room.hostId,
            status: room.status,
            players: room.players.map(({ playerId, name, isHost, status }) => ({
                playerId,
                name,
                isHost,
                status,
            })),
        };
    }
}
export const roomManager = new RoomManager();
