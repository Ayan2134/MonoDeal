import { create } from 'zustand';
import { getCurrentRoom, getPlayerId, saveCurrentRoom, savePlayerName, clearCurrentRoom } from '../session/playerSession';
import { socket, type RoomResult, type RoomSummary } from '../socket/socket';
import { useGameStore } from './gameStore';
import type { TurnUpdate } from '../game/types';

type CreateRoomInput = {
  playerName: string;
  maxPlayers: number;
};

type JoinRoomInput = {
  playerName: string;
  roomCode?: string;
};

type LobbyState = {
  room: RoomSummary | null;
  error: string;
  isLoading: boolean;
  isListening: boolean;
  setInitialRoom: (room: RoomSummary | null) => void;
  clearError: () => void;
  setError: (message: string) => void;
  listenForRoomUpdates: () => void;
  createRoom: (input: CreateRoomInput) => Promise<RoomResult>;
  joinRoom: (input: JoinRoomInput) => Promise<RoomResult>;
  reconnectPlayer: (roomId: string) => Promise<RoomResult>;
  recoverPlayerSession: () => Promise<RoomResult | null>;
  leaveRoom: (roomId: string) => Promise<void>;
  startGame: (roomId: string) => Promise<RoomResult>;
};

function emitWithResult<EventPayload>(
  eventName: 'create-room' | 'join-room' | 'reconnect-player' | 'start-game' | 'leave-room',
  payload: EventPayload,
  options?: { timeoutMs?: number; timeoutError?: string; logLabel?: string },
) {
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const timeoutError = options?.timeoutError ?? 'Request timed out. Please try again.';
  return new Promise<RoomResult>((resolve) => {
    let resolved = false;
    const timeoutId = window.setTimeout(() => {
      if (resolved) {
        return;
      }
      resolved = true;
      console.warn('[socket] timeout', { eventName, label: options?.logLabel });
      resolve({ ok: false, error: timeoutError });
    }, timeoutMs);

    socket.emit(eventName, payload as never, (result: RoomResult) => {
      if (resolved) {
        return;
      }
      resolved = true;
      window.clearTimeout(timeoutId);
      resolve(result);
    });
  });
}

function logSocketEvent(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[socket] ${message}`, details);
  } else {
    console.info(`[socket] ${message}`);
  }
}

export const useLobbyStore = create<LobbyState>((set, get) => ({
  room: null,
  error: '',
  isLoading: false,
  isListening: false,

  setInitialRoom: (room) => {
    set({ room });
  },

  clearError: () => {
    set({ error: '' });
  },

  setError: (message) => {
    set({ error: message });
  },

  listenForRoomUpdates: () => {
    if (get().isListening) {
      return;
    }

    socket.on('room-updated', (nextRoom) => {
      logSocketEvent('room-updated received', { roomId: nextRoom.roomId, roomCode: nextRoom.roomCode });
      const currentRoom = get().room;

      if (!currentRoom || currentRoom.roomId === nextRoom.roomId) {
        saveCurrentRoom(nextRoom.roomId);
        set({ room: nextRoom, error: '' });
      }
    });

    socket.on('room-error', (message) => {
      logSocketEvent('room-error received', { message });
      set({ error: message });
    });

    // PLAYER CONNECTION STATUS IN LOBBY
    // Broadcast when player reconnects (auto-join room again)
    socket.on('player-reconnected', (payload) => {
      logSocketEvent('player-reconnected', { playerId: payload.playerId, playerName: payload.playerName });
    });

    // Broadcast when player disconnects in lobby
    socket.on('player-disconnected', (payload) => {
      logSocketEvent('player-disconnected', { playerId: payload.playerId, playerName: payload.playerName });
    });

    set({ isListening: true });
  },

  createRoom: async ({ playerName, maxPlayers }) => {
    set({ isLoading: true, error: '' });

    logSocketEvent('create-room request', { maxPlayers });

    const result = await emitWithResult('create-room', {
      playerId: getPlayerId(),
      playerName,
      maxPlayers,
    }, { logLabel: 'create-room' });

    logSocketEvent('create-room response', { ok: result.ok });

    if (result.ok) {
      savePlayerName(playerName);
      saveCurrentRoom(result.room.roomId);
      set({ room: result.room, isLoading: false });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },

  joinRoom: async ({ playerName, roomCode }) => {
    set({ isLoading: true, error: '' });

    logSocketEvent('join-room request', { roomCode });

    const result = await emitWithResult('join-room', {
      playerId: getPlayerId(),
      playerName,
      roomCode,
    }, { logLabel: 'join-room', timeoutError: 'Joining the room is taking longer than expected. Please try again.' });

    logSocketEvent('join-room response', { ok: result.ok, roomCode });

    if (result.ok) {
      savePlayerName(playerName);
      saveCurrentRoom(result.room.roomId);
      set({ room: result.room, isLoading: false });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },

  reconnectPlayer: async (roomId) => {
    if (!roomId) {
      return { ok: false, error: 'Missing room id.' };
    }

    set({ isLoading: true, error: '' });

    logSocketEvent('reconnect-player request', { roomId });

    // Recovery is explicit because socket.id is transport-scoped. On refresh or
    // automatic Socket.IO reconnect, the browser sends its localStorage playerId
    // so the server can attach the new socket to the existing room seat.
    const result = await emitWithResult('reconnect-player', {
      playerId: getPlayerId(),
      roomId,
    }, { logLabel: 'reconnect-player' });

    logSocketEvent('reconnect-player response', { ok: result.ok, roomId });

    if (result.ok) {
      saveCurrentRoom(result.room.roomId);
      set({ room: result.room, isLoading: false });

      // SYNC GAME STATE ON RECONNECT
      // If the reconnect response includes game state, hydrate the gameStore immediately
      // This prevents the "Waiting for someone" UI flicker on reload
      if (result.gameState) {
        const turn: TurnUpdate = {
          roomId: result.gameState.roomId,
          currentTurnPlayerId: result.gameState.currentTurnPlayerId,
          actionsRemaining: result.gameState.actionsRemaining,
          turnPhase: result.gameState.turnPhase,
        };

        useGameStore.setState({ 
          gameState: result.gameState, 
          turn,
          currentVersion: result.gameState.version,
          error: '' 
        });

        if (result.turnOwned && result.gameState.currentTurnPlayerId === getPlayerId()) {
          useGameStore.setState({ shouldAutoStartTurn: true, autoStartRoomId: result.room.roomId });
        }
      }

      return result;
    }

    clearCurrentRoom(roomId);
    set({ error: result.error, isLoading: false, room: null });
    return result;
  },

  recoverPlayerSession: async () => {
    const roomId = getCurrentRoom();

    if (!roomId) {
      return null;
    }

    return get().reconnectPlayer(roomId);
  },

  leaveRoom: async (roomId) => {
    set({ isLoading: true, error: '' });

    logSocketEvent('leave-room request', { roomId });

    const result = await emitWithResult('leave-room', { playerId: getPlayerId(), roomId }, { logLabel: 'leave-room' });

    logSocketEvent('leave-room response', { ok: result.ok, roomId });

    if (result.ok) {
      clearCurrentRoom(roomId);
      set({ room: null, isLoading: false });
      return;
    }

    set({ error: result.error, isLoading: false });
  },

  startGame: async (roomId) => {
    set({ isLoading: true, error: '' });

    logSocketEvent('start-game request', { roomId });

    const result = await emitWithResult('start-game', {
      playerId: getPlayerId(),
      roomId,
    }, { logLabel: 'start-game' });

    logSocketEvent('start-game response', { ok: result.ok, roomId });

    if (result.ok) {
      set({ room: result.room, isLoading: false });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },
}));
