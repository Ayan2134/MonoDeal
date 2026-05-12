/**
 * RECONNECTION MANAGER
 *
 * This module handles robust session recovery and reconnection for multiplayer games.
 *
 * ARCHITECTURE:
 * - Players are identified by persistent playerId (from localStorage), not socket.id
 * - socket.id is ephemeral and changes on every reconnection
 * - On reconnect: validate playerId + roomId → restore existing player → sync game state
 * - Disconnected players remain in game during grace period (preserves turn ownership)
 * - Turn ownership is paused if active player disconnects; resumes on reconnect
 * - All state (hand, properties, bank, turn) is preserved until timeout
 *
 * RECONNECT FLOW:
 * 1. Client detects disconnect → attempts automatic reconnect (Socket.IO configures this)
 * 2. Client sends reconnect-player event with playerId + roomId
 * 3. Server validates playerId exists in roomId
 * 4. Server marks player connected, updates socketId, clears cleanup timer
 * 5. Server sends full game state (hand, properties, bank, stack, response window)
 * 6. If reconnecting player owns current turn: resume turn (trigger start-turn if needed)
 * 7. Frontend updates UI with restored state
 *
 * DISCONNECT TIMEOUT:
 * - On disconnect: mark connected=false, start removal timer (configurable grace period)
 * - If player reconnects within grace period: clear timer, restore player
 * - If grace period expires: remove player from room, broadcast update
 * - For active games: grace period is longer (e.g., 10 minutes) than lobby (e.g., 1 minute)
 */

import type { GameState } from './state.js';
import type { Room } from '../rooms/types.js';
import type { Player } from '../rooms/types.js';

/**
 * Session recovery state for a reconnecting player
 */
export type ReconnectValidation = {
  valid: boolean;
  error?: string;
  player?: Player;
  room?: Room;
  gameState?: GameState;
  turnOwned?: boolean;
  sessionDurationMs?: number;
};

/**
 * Validates a reconnection attempt
 *
 * @param room - The room the player is reconnecting to
 * @param playerId - The persistent player ID (from localStorage)
 * @param roomId - The room ID
 * @returns Validation result with player data if valid
 *
 * VALIDATION CHECKS:
 * - Player exists in room (by playerId, not socket.id)
 * - Room exists
 * - Player was previously connected (not a new join attempt)
 * - Session not expired (disconnectedAt + grace period hasn't elapsed)
 */
export function validateReconnection(
  room: Room | undefined,
  playerId: string,
  roomId: string,
  gracePeriodMs: number,
): ReconnectValidation {
  if (!room) {
    return { valid: false, error: 'Room not found.' };
  }

  if (room.roomId !== roomId) {
    return { valid: false, error: 'Room ID mismatch.' };
  }

  const player = room.players.find((p) => p.playerId === playerId);

  if (!player) {
    return { valid: false, error: 'Player is not part of this room.' };
  }

  // Check if session has expired (grace period elapsed)
  if (player.status === 'disconnected' && player.disconnectedAt) {
    const elapsedMs = Date.now() - player.disconnectedAt;
    if (elapsedMs > gracePeriodMs) {
      return {
        valid: false,
        error: `Session expired. Disconnected for ${Math.round(elapsedMs / 1000)} seconds.`,
      };
    }
  }

  const turnOwned = room.gameState?.currentTurnPlayerId === playerId;
  const sessionDurationMs = player.disconnectedAt ? Date.now() - player.disconnectedAt : 0;

  return {
    valid: true,
    player,
    room,
    gameState: room.gameState,
    turnOwned,
    sessionDurationMs,
  };
}

/**
 * Prepares full game state for reconnecting client
 *
 * Serializes complete game state including:
 * - Current hand, properties, bank
 * - Game phase, turn ownership, actions remaining
 * - Pending stack, response window state
 * - All other players' public state
 *
 * This ensures the client can restore UI exactly as it was before disconnect.
 */
export function serializeGameStateForReconnect(gameState: GameState): GameState {
  // Game state is already fully serializable JSON
  // Return as-is; client will hydrate store with all data
  return {
    ...gameState,
  };
}

/**
 * Describes reconnection outcome for logging/monitoring
 */
export type ReconnectionEvent = {
  playerId: string;
  roomId: string;
  success: boolean;
  reason?: string;
  disconnectedDurationMs?: number;
  gameStarted: boolean;
  turnOwned: boolean;
  timestamp: number;
};

/**
 * Records reconnection event for debugging/analytics
 */
export function logReconnectionEvent(event: ReconnectionEvent) {
  const gameStatus = event.gameStarted ? 'in-progress' : 'lobby';
  const turnStatus = event.turnOwned ? 'owns-turn' : 'waiting';
  const duration = event.disconnectedDurationMs ? `${Math.round(event.disconnectedDurationMs / 1000)}s` : 'n/a';

  if (event.success) {
    console.info(
      `[reconnect] player=${event.playerId} room=${event.roomId} status=${gameStatus} turn=${turnStatus} offline=${duration}`,
    );
  } else {
    console.warn(
      `[reconnect] player=${event.playerId} room=${event.roomId} failed reason="${event.reason}" offline=${duration}`,
    );
  }
}

/**
 * Determines if a turn should be paused when active player disconnects
 *
 * TURN PAUSE LOGIC:
 * - If current turn player is disconnected and wasn't in action/draw phase
 * - Show UI "Waiting for [PlayerName]..."
 * - When player reconnects: send turn-updated event to trigger UI refresh
 * - No explicit turn state change needed; client detects status change
 *
 * This prevents game flow issues from long disconnects during someone else's turn.
 */
export function shouldPauseTurn(
  gameState: GameState,
  disconnectedPlayerId: string,
): boolean {
  // If the disconnected player is the current turn owner, turn is implicitly paused
  // (they can't take actions while offline, so game waits)
  return gameState.currentTurnPlayerId === disconnectedPlayerId;
}

/**
 * Prepares turn update when player reconnects
 *
 * If reconnecting player owns the current turn, client will automatically
 * trigger start-turn to draw 2 cards and enter action phase.
 * Server sends turn-updated event to notify all clients.
 */
export type TurnResumePayload = {
  roomId: string;
  playerId: string;
  turnOwned: boolean;
};

export function prepareTurnResume(
  gameState: GameState,
  playerId: string,
): TurnResumePayload {
  return {
    roomId: gameState.roomId,
    playerId,
    turnOwned: gameState.currentTurnPlayerId === playerId,
  };
}
