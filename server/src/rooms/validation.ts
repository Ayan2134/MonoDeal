import type {
  CreateRoomPayload,
  EndTurnPayload,
  JoinRoomPayload,
  PlayCardPayload,
  RespondToActionPayload,
  ReconnectPlayerPayload,
  StartGamePayload,
  StartTurnPayload,
} from './types.js';

const ROOM_CODE_PATTERN = /^[A-Z2-9]{6}$/;
const PLAYER_ID_PATTERN = /^[a-zA-Z0-9:_-]{8,80}$/;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

export function normalizePlayerName(playerName: string) {
  return playerName.trim().slice(0, 24) || 'Player';
}

export function normalizeRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase();
}

export function validatePlayerId(playerId: string) {
  return PLAYER_ID_PATTERN.test(playerId);
}

export function validateCreateRoomPayload(payload: CreateRoomPayload) {
  if (!validatePlayerId(payload.playerId)) {
    return 'Invalid player session. Refresh and try again.';
  }

  if (!Number.isInteger(payload.maxPlayers) || payload.maxPlayers < MIN_PLAYERS || payload.maxPlayers > MAX_PLAYERS) {
    return `Room size must be between ${MIN_PLAYERS} and ${MAX_PLAYERS} players.`;
  }

  return null;
}

export function validateJoinRoomPayload(payload: JoinRoomPayload) {
  if (!validatePlayerId(payload.playerId)) {
    return 'Invalid player session. Refresh and try again.';
  }

  if (!payload.roomId && !payload.roomCode) {
    return 'Enter a room code or use an invite link.';
  }

  if (payload.roomCode && !ROOM_CODE_PATTERN.test(normalizeRoomCode(payload.roomCode))) {
    return 'Room code must be six characters.';
  }

  return null;
}

export function validateReconnectPayload(payload: ReconnectPlayerPayload) {
  if (!validatePlayerId(payload.playerId)) {
    return 'Invalid player session. Refresh and try again.';
  }

  if (!payload.roomId.trim()) {
    return 'Missing room id.';
  }

  return null;
}

export function validateStartGamePayload(payload: StartGamePayload) {
  if (!validatePlayerId(payload.playerId)) {
    return 'Invalid player session. Refresh and try again.';
  }

  if (!payload.roomId.trim()) {
    return 'Missing room id.';
  }

  return null;
}

export function validateTurnPayload(payload: StartTurnPayload | EndTurnPayload) {
  if (!validatePlayerId(payload.playerId)) {
    return 'Invalid player session. Refresh and try again.';
  }

  if (!payload.roomId.trim()) {
    return 'Missing room id.';
  }

  return null;
}

export function validatePlayCardPayload(payload: PlayCardPayload) {
  if (!validatePlayerId(payload.playerId)) {
    return 'Invalid player session. Refresh and try again.';
  }

  if (!payload.roomId.trim()) {
    return 'Missing room id.';
  }

  if (!payload.cardId.trim()) {
    return 'Missing card id.';
  }

  return null;
}

export function validateRespondToActionPayload(payload: RespondToActionPayload) {
  if (!validatePlayerId(payload.playerId)) {
    return 'Invalid player session. Refresh and try again.';
  }

  if (!payload.roomId.trim()) {
    return 'Missing room id.';
  }

  if (!payload.cardId.trim()) {
    return 'Missing counter card id.';
  }

  return null;
}
