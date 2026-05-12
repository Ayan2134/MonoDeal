import type { GameState } from '../game/state.js';
import type { PropertySet } from '../game/state.js';
import type { CardDestination } from '../game/playCard.js';
import type { EffectTargetSelection } from '../game/effects/types.js';
import type { InteractionResolutionPayload } from '../game/interactions/types.js';

export type PlayerConnectionStatus = 'connected' | 'disconnected';

export type RoomStatus = 'waiting' | 'started';

export type Player = {
  // PERSISTENT IDENTITY - Stored in browser localStorage, survives reconnects
  playerId: string;
  // EPHEMERAL TRANSPORT - Changes on every Socket.IO reconnection
  socketId?: string;
  // PLAYER INFO
  name: string;
  isHost: boolean;
  // CONNECTION STATE
  status: PlayerConnectionStatus;
  // SESSION TRACKING - Timestamps for disconnect timeout
  // lastSeen: when player was last active (connection, action, etc.)
  // disconnectedAt: when player first disconnected (triggers grace period timeout)
  lastSeen?: number;
  disconnectedAt?: number;
};

export type Room = {
  roomId: string;
  roomCode: string;
  maxPlayers: number;
  hostId: string;
  status: RoomStatus;
  players: Player[];
  gameState?: GameState;
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

export type StartTurnPayload = {
  playerId: string;
  roomId: string;
  // CLIENT STATE VERSION:
  // Version of game state client has when submitting action
  // Server uses this to reject stale actions
  clientVersion: number;
};

export type EndTurnPayload = {
  playerId: string;
  roomId: string;
  clientVersion: number;
  discardCardIds?: string[];
};

export type PlayCardPayload = {
  playerId: string;
  roomId: string;
  cardId: string;
  destination: CardDestination;
  propertySetColor?: PropertySet['color'];
  targetSetId?: string;
  targets?: EffectTargetSelection;
  clientVersion: number;
};

export type RearrangePropertiesPayload = {
  playerId: string;
  roomId: string;
  cardId: string;
  targetColor: string;
  targetSetId: string;
  clientVersion: number;
};

export type RespondToActionPayload = {
  playerId: string;
  roomId: string;
  cardId: string;
  targetStackEntryId?: string;
  clientVersion: number;
};

export type ResolveInteractionPayload = {
  playerId: string;
  roomId: string;
  interactionId: string;
  resolution: InteractionResolutionPayload;
  clientVersion: number;
};
