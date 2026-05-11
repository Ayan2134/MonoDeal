import { io, type Socket } from 'socket.io-client';
import { env } from '../config/env';

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
  status: 'waiting' | 'started';
  players: PlayerSummary[];
};

export type RoomResult =
  | {
      ok: true;
      room: RoomSummary;
    }
  | {
      ok: false;
      error: string;
    };

type ServerToClientEvents = {
  'room-updated': (room: RoomSummary) => void;
  'room-error': (message: string) => void;
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
