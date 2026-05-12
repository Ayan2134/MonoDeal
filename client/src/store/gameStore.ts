import { create } from 'zustand';
import { socket } from '../socket/socket';
import type { GameState, GameStateResult, PlayCardPayload, RearrangePropertiesPayload, TurnUpdate } from '../game/types';
import { getPlayerId } from '../session/playerSession';

type GameStoreState = {
  gameState: GameState | null;
  turn: TurnUpdate | null;
  winner: string | null;
  // CONNECTION STATE - For displaying UI indicators
  disconnectedPlayers: Set<string>;
  reconnectedPlayers: Set<string>;
  // VERSIONING:
  // Client's current state version
  // Sent with every action so server can validate and reject stale requests
  // Updated whenever we receive new game state
  currentVersion: number;
  // TURN RECOVERY ON RECONNECT:
  // When player reconnects and owns the turn during draw phase, automatically call startTurn()
  shouldAutoStartTurn: boolean;
  autoStartRoomId: string | null;
  error: string;
  isListening: boolean;
  isLoading: boolean;
  listenForGameUpdates: () => void;
  clearError: () => void;
  setError: (message: string) => void;
  markPlayerDisconnected: (playerId: string) => void;
  markPlayerReconnected: (playerId: string) => void;
  startTurn: (roomId: string) => Promise<GameStateResult>;
  endTurn: (roomId: string, discardCardIds?: string[]) => Promise<GameStateResult>;
  playCard: (payload: Omit<PlayCardPayload, 'playerId' | 'clientVersion'>) => Promise<GameStateResult>;
  rearrangeProperties: (payload: Omit<RearrangePropertiesPayload, 'playerId' | 'clientVersion'>) => Promise<GameStateResult>;
  resolveInteraction: (payload: { roomId: string, interactionId: string, resolution: any }) => Promise<GameStateResult>;
};

function emitGameEvent<EventPayload>(
  eventName: 'start-turn' | 'end-turn' | 'play-card' | 'resolve-interaction' | 'rearrange-properties',
  payload: EventPayload,
  options?: { timeoutMs?: number; timeoutError?: string },
) {
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const timeoutError = options?.timeoutError ?? 'Request timed out. Please try again.';

  return new Promise<GameStateResult>((resolve) => {
    let resolved = false;
    const timeoutId = window.setTimeout(() => {
      if (resolved) {
        return;
      }
      resolved = true;
      resolve({ ok: false, error: timeoutError });
    }, timeoutMs);

    socket.emit(eventName, payload as never, (result: GameStateResult) => {
      if (resolved) {
        return;
      }
      resolved = true;
      window.clearTimeout(timeoutId);
      resolve(result);
    });
  });
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: null,
  turn: null,
  winner: null,
  disconnectedPlayers: new Set(),
  reconnectedPlayers: new Set(),
  currentVersion: 0,
  shouldAutoStartTurn: false,
  autoStartRoomId: null,
  error: '',
  isListening: false,
  isLoading: false,

  listenForGameUpdates: () => {
    if (get().isListening) {
      return;
    }

    // GAME STATE UPDATES
    socket.on('game-updated', (gameState) => {
      // Update version when we receive new state
      set({ gameState, currentVersion: gameState.version, error: '' });
    });

    socket.on('turn-updated', (turn) => {
      set({ turn });
    });

    // GAME STATE RECOVERY ON RECONNECT
    // Sent when THIS player reconnects during active game
    // Restores complete game state so UI renders correctly
    socket.on('game-state-sync', (payload) => {
      console.info('[socket] game-state-sync received', { roomId: payload.roomId, turnOwned: payload.turnOwned, version: payload.gameState.version });
      set({ gameState: payload.gameState, currentVersion: payload.gameState.version, error: '' });

      // If reconnecting player owns the turn, automatically resume it
      // Set flag so GameTable component can auto-start the turn
      if (payload.turnOwned && payload.gameState.currentTurnPlayerId === getPlayerId()) {
        console.info('[socket] reconnecting player owns turn, setting auto-start flag');
        set({ shouldAutoStartTurn: true, autoStartRoomId: payload.roomId });
      }
    });

    socket.on('player-reconnected', (payload) => {
      console.info('[socket] player-reconnected', { playerId: payload.playerId, playerName: payload.playerName });
      const reconnected = new Set(get().reconnectedPlayers);
      reconnected.add(payload.playerId);

      // Remove from disconnected set
      const disconnected = new Set(get().disconnectedPlayers);
      disconnected.delete(payload.playerId);

      set({ reconnectedPlayers: reconnected, disconnectedPlayers: disconnected });

      // Clear notification after 3 seconds
      setTimeout(() => {
        const next = new Set(get().reconnectedPlayers);
        next.delete(payload.playerId);
        set({ reconnectedPlayers: next });
      }, 3000);
    });

    socket.on('player-disconnected', (payload) => {
      console.info('[socket] player-disconnected', { playerId: payload.playerId, playerName: payload.playerName });

      const disconnected = new Set(get().disconnectedPlayers);
      disconnected.add(payload.playerId);
      set({ disconnectedPlayers: disconnected });
    });

    socket.on('game-ended', (gameState) => {
      set({ gameState, currentVersion: gameState.version, winner: gameState.winner ?? null });
    });

    socket.on('winner-announced', (payload) => {
      set({ winner: payload.winner });
    });

    set({ isListening: true });
  },

  markPlayerDisconnected: (playerId) => {
    const disconnected = new Set(get().disconnectedPlayers);
    disconnected.add(playerId);
    set({ disconnectedPlayers: disconnected });
  },

  markPlayerReconnected: (playerId) => {
    const disconnected = new Set(get().disconnectedPlayers);
    disconnected.delete(playerId);
    const reconnected = new Set(get().reconnectedPlayers);
    reconnected.add(playerId);
    set({ disconnectedPlayers: disconnected, reconnectedPlayers: reconnected });

    setTimeout(() => {
      const next = new Set(get().reconnectedPlayers);
      next.delete(playerId);
      set({ reconnectedPlayers: next });
    }, 3000);
  },

  clearError: () => set({ error: '' }),

  setError: (message) => set({ error: message }),

  startTurn: async (roomId) => {
    set({ isLoading: true, error: '' });

    const result = await emitGameEvent('start-turn', {
      playerId: getPlayerId(),
      roomId,
      clientVersion: get().currentVersion,
    });

    if (result.ok) {
      set({ gameState: result.gameState, turn: result.turn, currentVersion: result.gameState.version, isLoading: false });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },

  endTurn: async (roomId, discardCardIds) => {
    set({ isLoading: true, error: '' });

    const result = await emitGameEvent('end-turn', {
      playerId: getPlayerId(),
      roomId,
      clientVersion: get().currentVersion,
      discardCardIds,
    });

    if (result.ok) {
      set({ gameState: result.gameState, turn: result.turn, currentVersion: result.gameState.version, isLoading: false });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },

  playCard: async (payload) => {
    set({ isLoading: true, error: '' });

    const result = await emitGameEvent('play-card', {
      ...payload,
      playerId: getPlayerId(),
      clientVersion: get().currentVersion,
    });

    if (result.ok) {
      set({ gameState: result.gameState, turn: result.turn, currentVersion: result.gameState.version, isLoading: false });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },

  resolveInteraction: async (payload) => {
    set({ isLoading: true, error: '' });

    const result = await emitGameEvent('resolve-interaction', {
      ...payload,
      playerId: getPlayerId(),
      clientVersion: get().currentVersion,
    });

    if (result.ok) {
      set({ gameState: result.gameState, turn: result.turn, currentVersion: result.gameState.version, isLoading: false });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },

  rearrangeProperties: async (payload) => {
    set({ isLoading: true, error: '' });

    const result = await emitGameEvent('rearrange-properties', {
      ...payload,
      playerId: getPlayerId(),
      clientVersion: get().currentVersion,
    });

    if (result.ok) {
      set({ gameState: result.gameState, turn: result.turn, currentVersion: result.gameState.version, isLoading: false });
      return result;
    }

    set({ error: result.error, isLoading: false });
    return result;
  },
}));
