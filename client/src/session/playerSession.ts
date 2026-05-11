const PLAYER_ID_KEY = 'monodeal.playerId';
const PLAYER_NAME_KEY = 'monodeal.playerName';
const ROOM_ID_KEY = 'monodeal.roomId';

function createPlayerId() {
  if (crypto.randomUUID) {
    return `player_${crypto.randomUUID()}`;
  }

  return `player_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getPlayerId() {
  const existingPlayerId = localStorage.getItem(PLAYER_ID_KEY);

  if (existingPlayerId) {
    return existingPlayerId;
  }

  const playerId = createPlayerId();
  localStorage.setItem(PLAYER_ID_KEY, playerId);
  return playerId;
}

export function savePlayerName(playerName: string) {
  localStorage.setItem(PLAYER_NAME_KEY, playerName);
}

export function getPlayerName() {
  return localStorage.getItem(PLAYER_NAME_KEY) ?? '';
}

export function saveCurrentRoom(roomId: string) {
  localStorage.setItem(ROOM_ID_KEY, roomId);
}

export function getCurrentRoom() {
  return localStorage.getItem(ROOM_ID_KEY);
}

export function clearCurrentRoom(roomId?: string) {
  const currentRoomId = getCurrentRoom();

  if (!roomId || currentRoomId === roomId) {
    localStorage.removeItem(ROOM_ID_KEY);
  }
}
