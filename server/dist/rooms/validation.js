const ROOM_CODE_PATTERN = /^[A-Z2-9]{6}$/;
const PLAYER_ID_PATTERN = /^[a-zA-Z0-9:_-]{8,80}$/;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
export function normalizePlayerName(playerName) {
    return playerName.trim().slice(0, 24) || 'Player';
}
export function normalizeRoomCode(roomCode) {
    return roomCode.trim().toUpperCase();
}
export function validatePlayerId(playerId) {
    return PLAYER_ID_PATTERN.test(playerId);
}
export function validateCreateRoomPayload(payload) {
    if (!validatePlayerId(payload.playerId)) {
        return 'Invalid player session. Refresh and try again.';
    }
    if (!Number.isInteger(payload.maxPlayers) || payload.maxPlayers < MIN_PLAYERS || payload.maxPlayers > MAX_PLAYERS) {
        return `Room size must be between ${MIN_PLAYERS} and ${MAX_PLAYERS} players.`;
    }
    return null;
}
export function validateJoinRoomPayload(payload) {
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
export function validateReconnectPayload(payload) {
    if (!validatePlayerId(payload.playerId)) {
        return 'Invalid player session. Refresh and try again.';
    }
    if (!payload.roomId.trim()) {
        return 'Missing room id.';
    }
    return null;
}
export function validateStartGamePayload(payload) {
    if (!validatePlayerId(payload.playerId)) {
        return 'Invalid player session. Refresh and try again.';
    }
    if (!payload.roomId.trim()) {
        return 'Missing room id.';
    }
    return null;
}
export function validateTurnPayload(payload) {
    if (!validatePlayerId(payload.playerId)) {
        return 'Invalid player session. Refresh and try again.';
    }
    if (!payload.roomId.trim()) {
        return 'Missing room id.';
    }
    return null;
}
export function validatePlayCardPayload(payload) {
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
export function validateRespondToActionPayload(payload) {
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
