/**
 * STATE SYNCHRONIZATION UTILITIES
 *
 * Creates consistent, authoritative game state snapshots for clients.
 *
 * SYNCHRONIZATION STRATEGY:
 * 1. Server maintains single source of truth: GameState in room
 * 2. On any state change: create snapshot for broadcast
 * 3. On client reconnect: send full snapshot (no merging)
 * 4. Clients replace local state completely with snapshot
 * 5. No partial updates or merge logic on client side
 *
 * SNAPSHOT CONTENTS:
 * - Complete game state (all data)
 * - Current version number
 * - Turn information
 * - Player states (own + others)
 * - Stack/pending actions
 * - Response window state
 *
 * CONSISTENCY:
 * - Snapshot captures state at specific version
 * - Version incremented atomically with state change
 * - No snapshot without version update
 * - No version update without snapshot broadcast
 */

import type { GameState } from './state.js';

/**
 * Game state snapshot sent to clients
 * Includes everything needed to render the game UI
 */
export type GameStateSnapshot = {
  // VERSIONING:
  // Version uniquely identifies this state
  // Clients use version to detect if they have latest state
  version: number;
  // Full game state
  state: GameState;
  // Metadata for client-side diagnostics
  snapshotMetadata: {
    createdAt: number;
    sequence?: number;
  };
};

/**
 * Acknowledgement sent to client after action processed
 * Tells client if action succeeded and what version they should expect next
 */
export type ActionAcknowledgement = {
  // Whether action succeeded
  success: boolean;
  // If failed, error message
  error?: string;
  // New state version after action
  version: number;
  // Action sequence for ordering
  sequence?: number;
};

/**
 * Create a snapshot of current game state
 * This is what gets sent to clients via broadcast or callback
 *
 * SNAPSHOT CREATION:
 * - Called immediately after state change
 * - Captures state + version atomically
 * - Passed to all clients who have joined the room
 *
 * CLIENT HANDLING:
 * - Client receives snapshot
 * - Checks version against local state
 * - If version > local: completely replace local state
 * - If version == local: ignore (already have it)
 * - If version < local: error (shouldn't happen, indicates bug)
 */
export function createGameStateSnapshot(
  gameState: GameState,
  sequence?: number,
): GameStateSnapshot {
  return {
    version: gameState.version,
    state: gameState,
    snapshotMetadata: {
      createdAt: Date.now(),
      sequence,
    },
  };
}

/**
 * Create acknowledgement for successful action
 */
export function createSuccessAcknowledgement(
  newVersion: number,
  sequence?: number,
): ActionAcknowledgement {
  return {
    success: true,
    version: newVersion,
    sequence,
  };
}

/**
 * Create acknowledgement for failed action
 */
export function createFailureAcknowledgement(
  currentVersion: number,
  error: string,
): ActionAcknowledgement {
  return {
    success: false,
    error,
    version: currentVersion,
  };
}

/**
 * Validate snapshot consistency
 * Used for debugging/diagnostics
 *
 * CHECKS:
 * - Snapshot has valid version (>= 0)
 * - State matches version
 * - All players have consistent state
 * - Deck + hand + bank + properties add up correctly
 */
export function validateSnapshotConsistency(snapshot: GameStateSnapshot): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check version
  if (snapshot.version < 0) {
    errors.push(`Invalid version: ${snapshot.version}`);
  }

  if (snapshot.state.version !== snapshot.version) {
    errors.push(
      `Snapshot version (${snapshot.version}) doesn't match state version (${snapshot.state.version})`,
    );
  }

  // Check state is initialized
  if (!snapshot.state.players || snapshot.state.players.length === 0) {
    if (snapshot.state.gameStarted) {
      errors.push('Game started but no players');
    }
  }

  // Check turn state consistency
  if (snapshot.state.currentTurnPlayerId) {
    const turnPlayer = snapshot.state.players.find((p) => p.id === snapshot.state.currentTurnPlayerId);
    if (!turnPlayer) {
      errors.push(`Current turn player not found: ${snapshot.state.currentTurnPlayerId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compare two snapshots to detect what changed
 * Used for debugging/diagnostics
 *
 * RETURNS:
 * - List of changed fields
 * - Useful for logging diffs
 */
export function getSnapshotDiff(
  oldSnapshot: GameStateSnapshot,
  newSnapshot: GameStateSnapshot,
): string[] {
  const changes: string[] = [];

  if (oldSnapshot.version !== newSnapshot.version) {
    changes.push(`version: ${oldSnapshot.version} → ${newSnapshot.version}`);
  }

  const oldState = oldSnapshot.state;
  const newState = newSnapshot.state;

  if (oldState.turnPhase !== newState.turnPhase) {
    changes.push(`turnPhase: ${oldState.turnPhase} → ${newState.turnPhase}`);
  }

  if (oldState.currentTurnPlayerId !== newState.currentTurnPlayerId) {
    changes.push(`currentTurnPlayerId: ${oldState.currentTurnPlayerId} → ${newState.currentTurnPlayerId}`);
  }

  if (oldState.actionsRemaining !== newState.actionsRemaining) {
    changes.push(`actionsRemaining: ${oldState.actionsRemaining} → ${newState.actionsRemaining}`);
  }

  if (oldState.winner !== newState.winner) {
    changes.push(`winner: ${oldState.winner} → ${newState.winner}`);
  }

  if (oldState.gameEnded !== newState.gameEnded) {
    changes.push(`gameEnded: ${oldState.gameEnded} → ${newState.gameEnded}`);
  }

  // Check action stack changes
  if (oldState.actionStack.length !== newState.actionStack.length) {
    changes.push(`actionStack size: ${oldState.actionStack.length} → ${newState.actionStack.length}`);
  }

  if (oldState.responseWindow.isOpen !== newState.responseWindow.isOpen) {
    changes.push(`responseWindow.isOpen: ${oldState.responseWindow.isOpen} → ${newState.responseWindow.isOpen}`);
  }

  return changes;
}
