import { roomManager } from '../rooms/roomManager.js';
function logSocketEvent(message, details) {
    if (details) {
        console.info(`[socket] ${message}`, details);
    }
    else {
        console.info(`[socket] ${message}`);
    }
}
function logSocketError(message, error, details) {
    const payload = {
        ...details,
        error: error instanceof Error ? error.message : String(error),
    };
    console.error(`[socket] ${message}`, payload);
}
function broadcastRoom(io, room) {
    logSocketEvent('emit room-updated', { roomId: room.roomId, roomCode: room.roomCode });
    io.to(room.roomId).emit('room-updated', room);
}
function emitRoomResult(socket, result) {
    if (!result.ok) {
        logSocketEvent('emit room-error', { socketId: socket.id, message: result.error });
        socket.emit('room-error', result.error);
    }
}
function handleUnexpectedError(socket, callback, error) {
    logSocketError('handler error', error, { socketId: socket.id });
    const result = { ok: false, error: 'Unexpected server error. Please try again.' };
    callback?.(result);
    emitRoomResult(socket, result);
}
export function registerSocketHandlers(io, socket) {
    // Debugging flow: log inbound events, validate, emit acknowledgements, then
    // broadcast room updates so the client can see every step in the lifecycle.
    logSocketEvent('client connected', { socketId: socket.id, recovered: socket.recovered });
    socket.on('create-room', (payload, callback) => {
        try {
            logSocketEvent('create-room', { socketId: socket.id, playerId: payload.playerId });
            // The socket carries the network connection, while payload.playerId carries
            // the durable browser identity. The server trusts only validated payloads
            // and decides what room state is created.
            const result = roomManager.createRoom(payload, socket.id);
            if (result.ok) {
                socket.join(result.room.roomId);
                logSocketEvent('room joined', { socketId: socket.id, roomId: result.room.roomId, roomCode: result.room.roomCode });
                callback(result);
                broadcastRoom(io, result.room);
                return;
            }
            logSocketEvent('create-room failed', { socketId: socket.id, error: result.error });
            callback(result);
            emitRoomResult(socket, result);
        }
        catch (error) {
            handleUnexpectedError(socket, callback, error);
        }
    });
    socket.on('join-room', (payload, callback) => {
        try {
            logSocketEvent('join-room', { socketId: socket.id, playerId: payload.playerId, roomCode: payload.roomCode, roomId: payload.roomId });
            // A join may arrive from a typed room code or an invite link roomId. Both
            // paths go through the same authoritative validation and capacity checks.
            const result = roomManager.joinRoom(payload, socket.id);
            if (result.ok) {
                socket.join(result.room.roomId);
                logSocketEvent('room joined', { socketId: socket.id, roomId: result.room.roomId, roomCode: result.room.roomCode });
                callback(result);
                broadcastRoom(io, result.room);
                return;
            }
            logSocketEvent('join-room failed', { socketId: socket.id, error: result.error });
            callback(result);
            emitRoomResult(socket, result);
        }
        catch (error) {
            handleUnexpectedError(socket, callback, error);
        }
    });
    socket.on('reconnect-player', (payload, callback) => {
        try {
            logSocketEvent('reconnect-player', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId });
            // Refreshing the browser creates a new socket.id. This event binds that new
            // socket back to the existing playerId before the cleanup timeout expires.
            const result = roomManager.reconnectPlayer(payload, socket.id);
            if (result.ok) {
                socket.join(result.room.roomId);
                logSocketEvent('room joined', { socketId: socket.id, roomId: result.room.roomId, roomCode: result.room.roomCode });
                callback(result);
                broadcastRoom(io, result.room);
                return;
            }
            logSocketEvent('reconnect-player failed', { socketId: socket.id, error: result.error });
            callback(result);
            emitRoomResult(socket, result);
        }
        catch (error) {
            handleUnexpectedError(socket, callback, error);
        }
    });
    socket.on('leave-room', (payload, callback) => {
        try {
            logSocketEvent('leave-room', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId });
            socket.leave(payload.roomId);
            const updatedRoom = roomManager.leaveRoom(payload);
            if (updatedRoom) {
                broadcastRoom(io, updatedRoom);
                callback?.({ ok: true, room: updatedRoom });
                return;
            }
            logSocketEvent('leave-room failed', { socketId: socket.id, error: 'Room closed.' });
            callback?.({ ok: false, error: 'Room closed.' });
        }
        catch (error) {
            handleUnexpectedError(socket, callback, error);
        }
    });
    socket.on('start-game', (payload, callback) => {
        try {
            logSocketEvent('start-game', { socketId: socket.id, playerId: payload.playerId, roomId: payload.roomId });
            // No game logic starts here yet. The only state change is moving the room
            // from waiting to started after host and player-count validation.
            const result = roomManager.startGame(payload);
            if (result.ok) {
                callback(result);
                broadcastRoom(io, result.room);
                return;
            }
            logSocketEvent('start-game failed', { socketId: socket.id, error: result.error });
            callback(result);
            emitRoomResult(socket, result);
        }
        catch (error) {
            handleUnexpectedError(socket, callback, error);
        }
    });
    socket.on('disconnect', (reason) => {
        try {
            logSocketEvent('client disconnected', { socketId: socket.id, reason });
            const updatedRooms = roomManager.markDisconnected(socket.id, (room) => {
                if (room) {
                    broadcastRoom(io, room);
                }
            });
            for (const room of updatedRooms) {
                broadcastRoom(io, room);
            }
        }
        catch (error) {
            handleUnexpectedError(socket, undefined, error);
        }
    });
    socket.on('error', (error) => {
        logSocketError('socket error', error, { socketId: socket.id });
    });
}
