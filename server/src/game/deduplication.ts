/**
 * ACTION DEDUPLICATION SYSTEM
 *
 * Prevents duplicate action processing which can occur due to:
 * 1. Network retries (client resends same action)
 * 2. Reconnection replay (reconnecting player resends actions)
 * 3. Browser refresh (cached actions resubmitted)
 *
 * STRATEGY:
 * - Track processed action IDs in a time-bounded cache
 * - Reject any action with ID already processed
 * - Cache entries expire after timeout to prevent memory leak
 * - Per-room deduplication to keep memory usage bounded
 *
 * THREAD SAFETY:
 * - Operations are synchronous (no async)
 * - Safe for single-threaded Node.js event loop
 * - No race conditions possible
 */

import type { ActionId } from './action-types.js';

/**
 * Deduplication entry
 */
type DeduplicationEntry = {
  actionId: ActionId;
  processedAt: number;
  sequence: number;
};

/**
 * Deduplication state for a room
 * Tracks all actions processed in the room
 */
type RoomDeduplicationState = {
  entries: Map<ActionId, DeduplicationEntry>;
  nextSequence: number;
  createdAt: number;
};

/**
 * Global deduplication manager
 * Tracks processed actions across all rooms
 */
class DeduplicationManager {
  private roomStates = new Map<string, RoomDeduplicationState>();

  // Cache cleanup timeout (5 minutes)
  private readonly ENTRY_TTL_MS = 5 * 60 * 1000;

  // Check for expired entries every minute
  private readonly CLEANUP_INTERVAL_MS = 60 * 1000;

  constructor() {
    // Periodically clean up expired entries
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Check if an action has already been processed
   *
   * @returns true if action has been processed, false otherwise
   */
  isActionProcessed(roomId: string, actionId: ActionId): boolean {
    const state = this.roomStates.get(roomId);
    if (!state) {
      return false;
    }

    const entry = state.entries.get(actionId);
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    const ageMs = Date.now() - entry.processedAt;
    if (ageMs > this.ENTRY_TTL_MS) {
      // Entry expired, remove it
      state.entries.delete(actionId);
      return false;
    }

    return true;
  }

  /**
   * Record that an action has been processed
   *
   * @returns sequence number of this action in the room
   */
  recordProcessedAction(roomId: string, actionId: ActionId): number {
    let state = this.roomStates.get(roomId);

    if (!state) {
      state = {
        entries: new Map(),
        nextSequence: 1,
        createdAt: Date.now(),
      };
      this.roomStates.set(roomId, state);
    }

    const sequence = state.nextSequence++;

    state.entries.set(actionId, {
      actionId,
      processedAt: Date.now(),
      sequence,
    });

    return sequence;
  }

  /**
   * Remove all tracking for a room (cleanup when room ends)
   */
  clearRoom(roomId: string): void {
    this.roomStates.delete(roomId);
  }

  /**
   * Get number of entries tracked for a room (for diagnostics)
   */
  getEntryCount(roomId: string): number {
    return this.roomStates.get(roomId)?.entries.size ?? 0;
  }

  /**
   * Clean up expired entries
   * Called periodically to prevent memory growth
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [roomId, state] of this.roomStates.entries()) {
      // Remove expired entries
      for (const [actionId, entry] of state.entries.entries()) {
        const ageMs = now - entry.processedAt;
        if (ageMs > this.ENTRY_TTL_MS) {
          state.entries.delete(actionId);
        }
      }

      // Remove room if empty and old
      const roomAgeMs = now - state.createdAt;
      if (state.entries.size === 0 && roomAgeMs > this.ENTRY_TTL_MS * 2) {
        this.roomStates.delete(roomId);
      }
    }
  }
}

export const deduplicationManager = new DeduplicationManager();

/**
 * Helper to check and record action processing atomically
 *
 * @returns object with isDuplicate flag and sequence number
 */
export function checkAndRecordAction(
  roomId: string,
  actionId: ActionId,
): {
  isDuplicate: boolean;
  sequence: number;
} {
  const isDuplicate = deduplicationManager.isActionProcessed(roomId, actionId);
  if (isDuplicate) {
    return { isDuplicate: true, sequence: -1 };
  }

  const sequence = deduplicationManager.recordProcessedAction(roomId, actionId);
  return { isDuplicate: false, sequence };
}
