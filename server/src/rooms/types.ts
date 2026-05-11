export type PlayerConnectionStatus = 'connected' | 'disconnected';

export type RoomStatus = 'waiting' | 'started';

export type Player = {
  playerId: string;
  name: string;
  isHost: boolean;
  status: PlayerConnectionStatus;
  socketId?: string;
  disconnectedAt?: number;
};

export type Room = {
  roomId: string;
  roomCode: string;
  maxPlayers: number;
  hostId: string;
  status: RoomStatus;
  players: Player[];
  createdAt: number;
  updatedAt: number;
};

export type PublicPlayer = {
  playerId: string;
  name: string;
  isHost: boolean;
  status: PlayerConnectionStatus;
};

export type PublicRoom = {
  roomId: string;
  roomCode: string;
  invitePath: string;
  maxPlayers: number;
  hostId: string;
  status: RoomStatus;
  players: PublicPlayer[];
};

export type RoomResult =
  | {
      ok: true;
      room: PublicRoom;
    }
  | {
      ok: false;
      error: string;
    };

export type CreateRoomPayload = {
  playerId: string;
  playerName: string;
  maxPlayers: number;
};

export type JoinRoomPayload = {
  playerId: string;
  playerName: string;
  roomCode?: string;
  roomId?: string;
};

export type ReconnectPlayerPayload = {
  playerId: string;
  roomId: string;
};

export type LeaveRoomPayload = {
  playerId: string;
  roomId: string;
};

export type StartGamePayload = {
  playerId: string;
  roomId: string;
};
