import { Room } from '../rooms/types.js';
import { GameLogEntry } from './state.js';
import { saveRoomSnapshot } from '../rooms/persistence.js';

/**
 * Appends a semantic gameplay event to the authoritative game log.
 * Logs are stored in GameState and persisted to the database.
 */
export function appendGameLog(
  room: Room,
  log: Omit<GameLogEntry, 'id' | 'timestamp'>
): void {
  if (!room.gameState) return;

  const entry: GameLogEntry = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
  };

  room.gameState.gameLogs.push(entry);

  // Maintain a fixed buffer size to prevent state bloat
  // 200 logs is plenty for a single game history
  if (room.gameState.gameLogs.length > 200) {
    room.gameState.gameLogs = room.gameState.gameLogs.slice(-200);
  }

  // Authoritative logs must be persisted immediately
  void saveRoomSnapshot(room);
}

/**
 * Appends a log entry directly to the GameState.
 * Use this in pure game logic where the Room object is not available.
 */
export function appendLogToState(
  state: any, // Use any to avoid circular deps if needed, but GameState is preferred
  log: Omit<GameLogEntry, 'id' | 'timestamp'>
): void {
  if (!state.gameLogs) state.gameLogs = [];

  const entry: GameLogEntry = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
  };

  state.gameLogs.push(entry);

  if (state.gameLogs.length > 200) {
    state.gameLogs = state.gameLogs.slice(-200);
  }
}
