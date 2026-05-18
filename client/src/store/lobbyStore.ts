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

export type RecoveryState = 'idle' | 'reconnecting' | 'retrying' | 'recovered' | 'failed';

type LobbyState = {
  room: RoomSummary | null;
  error: string;
  isLoading: boolean;
  isListening: boolean;
  recoveryState: RecoveryState;
  reconnectAttempts: number;
  lastRecoveryError: string;
  setInitialRoom: (room: RoomSummary | null) => void;
  clearError: () => void;
  setError: (message: string) => void;
  listenForRoomUpdates: () => void;
  createRoom: (input: CreateRoomInput) => Promise<RoomResult>;
  joinRoom: (input: JoinRoomInput) => Promise<RoomResult>;
  reconnectPlayer: (roomId: string, manualRetry?: boolean) => Promise<RoomResult>;
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
  recoveryState: 'idle',
  reconnectAttempts: 0,
  lastRecoveryError: '',

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
        // ONLY persist after successful lifecycle, but we update the in-memory room
        set({ room: nextRoom, error: '' });
      }
    });

    socket.on('room-error', (message) => {
      logSocketEvent('room-error received', { message });
      set({ error: message });
    });

    set({ isListening: true });
  },

  createRoom: async ({ playerName, maxPlayers }) => {
    set({ isLoading: true, error: '' });

    const result = await emitWithResult('create-room', {
      playerId: getPlayerId(),
      playerName,
      maxPlayers,
    }, { logLabel: 'create-room' });

    if (result.ok) {
      savePlayerName(playerName);
      saveCurrentRoom(result.room.roomId, result.room.roomCode);
      set({ room: result.room, isLoading: false, recoveryState: 'idle' });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },

  joinRoom: async ({ playerName, roomCode }) => {
    set({ isLoading: true, error: '' });

    const result = await emitWithResult('join-room', {
      playerId: getPlayerId(),
      playerName,
      roomCode,
    }, { logLabel: 'join-room' });

    if (result.ok) {
      savePlayerName(playerName);
      saveCurrentRoom(result.room.roomId, result.room.roomCode);
      set({ room: result.room, isLoading: false, recoveryState: 'idle' });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },

  reconnectPlayer: async (roomId, manualRetry = false) => {
    // PREVENT DUPLICATE RECOVERY ATTEMPTS (unless it's a manual retry)
    if (get().recoveryState === 'reconnecting' && !manualRetry) {
      logSocketEvent('reconnect-player SKIPPED (already in progress)', { roomId });
      return { ok: false, error: 'Reconnect already in progress' };
    }

    if (manualRetry) {
      set({ reconnectAttempts: 0, lastRecoveryError: '' });
    }

    const MAX_ATTEMPTS = 5;
    let currentAttempt = get().reconnectAttempts;

    const performAttempt = async (): Promise<RoomResult> => {
      set({ 
        isLoading: true, 
        error: '', 
        recoveryState: currentAttempt === 0 ? 'reconnecting' : 'retrying',
        reconnectAttempts: currentAttempt
      });

      logSocketEvent(`reconnect-player ATTEMPT ${currentAttempt + 1}`, { 
        roomId, 
        playerId: getPlayerId(),
        socketId: socket.id,
        connected: socket.connected
      });

      // auth: timeout 10s for reconnect specific
      const result = await emitWithResult('reconnect-player', {
        playerId: getPlayerId(),
        roomId,
      }, { 
        logLabel: `reconnect-player-att-${currentAttempt}`,
        timeoutMs: 10_000,
        timeoutError: 'Recovery request timed out'
      });

      if (result.ok) {
        logSocketEvent('reconnect-player SUCCESS', { roomId, roomCode: result.room.roomCode });
        saveCurrentRoom(result.room.roomId, result.room.roomCode);
        set({ 
          room: result.room, 
          isLoading: false, 
          recoveryState: 'recovered',
          reconnectAttempts: 0,
          lastRecoveryError: ''
        });

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

      // FAILURE HANDLING
      logSocketEvent('reconnect-player FAILED', { 
        ok: false, 
        error: result.error, 
        attempt: currentAttempt + 1 
      });

      const isStale = result.error?.toLowerCase().includes('not part of this room') || 
                      result.error?.toLowerCase().includes('room not found');

      if (isStale) {
        logSocketEvent('reconnect-player STALE SESSION detected', { error: result.error });
        clearCurrentRoom();
        set({ room: null, error: '', recoveryState: 'failed', isLoading: false });
        return result;
      }

      // If we have retries left and it wasn't a stale session error
      if (currentAttempt < MAX_ATTEMPTS - 1) {
        currentAttempt++;
        const delay = Math.min(Math.pow(2, currentAttempt) * 1000, 10000);
        logSocketEvent(`reconnect-player RETRYING in ${delay}ms`, { attempt: currentAttempt });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return performAttempt();
      }

      // FINAL FAILURE
      set({ 
        isLoading: false, 
        recoveryState: 'failed', 
        lastRecoveryError: result.error || 'Unknown recovery error',
        error: result.error || 'Failed to recover session after multiple attempts'
      });
      return result;
    };

    return performAttempt();
  },

  recoverPlayerSession: async () => {
    const session = getCurrentRoom();
    if (!session || !session.roomId) {
      return null;
    }

    return get().reconnectPlayer(session.roomId);
  },

  leaveRoom: async (roomId) => {
    set({ isLoading: true, error: '' });

    const result = await emitWithResult('leave-room', { playerId: getPlayerId(), roomId }, { logLabel: 'leave-room' });

    if (result.ok) {
      clearCurrentRoom();
      set({ room: null, isLoading: false, recoveryState: 'idle' });
      return;
    }

    // If leave fails because room is gone, still clear local state
    if (result.error?.toLowerCase().includes('not found')) {
      clearCurrentRoom();
      set({ room: null, isLoading: false, recoveryState: 'idle' });
      return;
    }

    set({ error: result.error, isLoading: false });
  },

  startGame: async (roomId) => {
    set({ isLoading: true, error: '' });

    const result = await emitWithResult('start-game', {
      playerId: getPlayerId(),
      roomId,
    }, { logLabel: 'start-game' });

    if (result.ok) {
      set({ room: result.room, isLoading: false });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },
}));
