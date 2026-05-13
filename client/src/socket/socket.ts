import { io, type Socket } from 'socket.io-client';
import { env } from '../config/env';
import type { GameState, GameStateResult, PlayCardPayload, TurnUpdate } from '../game/types';

export type PlayerSummary = {
  playerId: string;
  name: string;
  isHost: boolean;
  status: 'connected' | 'disconnected';
};

export type RoomSummary = {
  roomId: string;
  roomCode: string;
  invitePath: string;
  maxPlayers: number;
  hostId: string;
  status: 'lobby' | 'in_progress' | 'paused' | 'finished' | 'abandoned';
  players: PlayerSummary[];
};

export type RoomResult =
  | {
      ok: true;
      room: RoomSummary;
      gameState?: GameState;
      turnOwned?: boolean;
    }
  | {
      ok: false;
      error: string;
    };

type ServerToClientEvents = {
  // ROOM LIFECYCLE
  'room-updated': (room: RoomSummary) => void;
  'room-error': (message: string) => void;
  // GAME STATE SYNC
  'game-updated': (gameState: GameState) => void;
  'turn-updated': (turn: TurnUpdate) => void;
  // SESSION RECOVERY ON RECONNECT
  // Sent when player reconnects during active game
  // Contains full game state to restore UI exactly
  'game-state-sync': (payload: { roomId: string; gameState: GameState; turnOwned: boolean }) => void;
  // PLAYER CONNECTION STATUS
  // Broadcast when player reconnects (other players see game can resume)
  'player-reconnected': (payload: { roomId: string; playerId: string; playerName: string }) => void;
  // Broadcast when player disconnects (show waiting state)
  'player-disconnected': (payload: { roomId: string; playerId: string; playerName: string }) => void;
  // GAME END
  'game-ended': (gameState: GameState) => void;
  'winner-announced': (payload: { roomId: string; winner: string }) => void;
};

type ClientToServerEvents = {
  'create-room': (
    payload: { playerId: string; playerName: string; maxPlayers: number },
    callback: (result: RoomResult) => void,
  ) => void;
  'join-room': (
    payload: { playerId: string; playerName: string; roomCode?: string; roomId?: string },
    callback: (result: RoomResult) => void,
  ) => void;
  'reconnect-player': (
    payload: { playerId: string; roomId: string },
    callback: (result: RoomResult) => void,
  ) => void;
  'leave-room': (payload: { playerId: string; roomId: string }, callback?: (result: RoomResult) => void) => void;
  'start-game': (payload: { playerId: string; roomId: string }, callback: (result: RoomResult) => void) => void;
  'start-turn': (
    payload: { playerId: string; roomId: string; clientVersion: number },
    callback: (result: GameStateResult) => void,
  ) => void;
  'end-turn': (
    payload: { playerId: string; roomId: string; clientVersion: number },
    callback: (result: GameStateResult) => void,
  ) => void;
  'play-card': (
    payload: PlayCardPayload,
    callback: (result: GameStateResult) => void,
  ) => void;
  'rearrange-properties': (
    payload: { playerId: string; roomId: string; cardId: string; targetColor: string; targetSetId: string, clientVersion: number },
    callback: (result: GameStateResult) => void,
  ) => void;
  'respond-to-action': (
    payload: { playerId: string; roomId: string; cardId: string; targetStackEntryId?: string; clientVersion: number },
    callback: (result: GameStateResult) => void,
  ) => void;
  'resolve-interaction': (
    payload: { playerId: string; roomId: string; interactionId: string; resolution: any; clientVersion: number },
    callback: (result: GameStateResult) => void,
  ) => void;
};

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(env.socketUrl, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5_000,
  timeout: 10_000,
  transports: ['websocket', 'polling'],
});
