/**
 * ACTION QUEUE SYSTEM
 *
 * Manages pending actions and ensures sequential processing.
 *
 * QUEUE PROPERTIES:
 * - FIFO (first-in-first-out)
 * - Single queue per room (not per player)
 * - Actions processed sequentially (one at a time)
 * - Queue survives disconnections (actions persist)
 *
 * PROCESSING:
 * - Queue doesn't execute actions (that's done by ActionProcessor)
 * - Queue just stores them in order
 * - Processor pulls from queue, validates, applies, acknowledges
 * - Multiple processors can exist but serialize access via lock
 *
 * MEMORY:
 * - Queue has max size (prevent unbounded growth)
 * - Old processed actions removed after timeout
 * - Per-room queue to keep memory bounded
 */

import type { GameAction } from './action-types.js';

/**
 * Queued action entry
 */
type QueueEntry = {
  action: GameAction;
  enqueuedAt: number;
  processed: boolean;
  processedAt?: number;
};

/**
 * Per-room action queue
 */
type RoomActionQueue = {
  entries: QueueEntry[];
  processing: boolean;
};

/**
 * Global action queue manager
 */
class ActionQueueManager {
  private queues = new Map<string, RoomActionQueue>();

  // Max actions to keep in memory per room
  private readonly MAX_QUEUE_SIZE = 1000;

  // Remove processed actions after this time
  private readonly PROCESSED_TTL_MS = 5 * 60 * 1000;

  /**
   * Add action to queue
   *
   * @returns true if enqueued, false if queue full
   */
  enqueueAction(roomId: string, action: GameAction): boolean {
    let queue = this.queues.get(roomId);

    if (!queue) {
      queue = {
        entries: [],
        processing: false,
      };
      this.queues.set(roomId, queue);
    }

    // Check queue size limit
    if (queue.entries.length >= this.MAX_QUEUE_SIZE) {
      console.warn(`[action-queue] Queue full for room ${roomId}`, {
        size: queue.entries.length,
      });
      return false;
    }

    queue.entries.push({
      action,
      enqueuedAt: Date.now(),
      processed: false,
    });

    return true;
  }

  /**
   * Get next pending action from queue
   *
   * @returns next unprocessed action or null
   */
  dequeueAction(roomId: string): GameAction | null {
    const queue = this.queues.get(roomId);

    if (!queue) {
      return null;
    }

    // Find first unprocessed action
    const entry = queue.entries.find((e) => !e.processed);

    if (!entry) {
      return null;
    }

    return entry.action;
  }

  /**
   * Mark action as processed
   */
  markProcessed(roomId: string, actionId: string): void {
    const queue = this.queues.get(roomId);

    if (!queue) {
      return;
    }

    const entry = queue.entries.find((e) => e.action.id === actionId);

    if (entry) {
      entry.processed = true;
      entry.processedAt = Date.now();
    }
  }

  /**
   * Check if processor is already running for this room
   * Used to prevent concurrent processing
   */
  isProcessing(roomId: string): boolean {
    const queue = this.queues.get(roomId);
    return queue?.processing ?? false;
  }

  /**
   * Set processing flag
   * Called when processor starts, cleared when done
   */
  setProcessing(roomId: string, processing: boolean): void {
    const queue = this.queues.get(roomId);

    if (queue) {
      queue.processing = processing;
    }
  }

  /**
   * Clean up old processed actions
   * Removes entries older than TTL to prevent memory growth
   */
  cleanupProcessedActions(roomId: string): void {
    const queue = this.queues.get(roomId);

    if (!queue) {
      return;
    }

    const now = Date.now();

    queue.entries = queue.entries.filter((entry) => {
      if (!entry.processed) {
        // Keep unprocessed actions
        return true;
      }

      if (!entry.processedAt) {
        // Shouldn't happen, but keep it
        return true;
      }

      const ageMs = now - entry.processedAt;
      return ageMs <= this.PROCESSED_TTL_MS;
    });

    // Remove empty room queue
    if (queue.entries.length === 0 && !queue.processing) {
      this.queues.delete(roomId);
    }
  }

  /**
   * Clear queue for room (when room closes)
   */
  clearRoom(roomId: string): void {
    this.queues.delete(roomId);
  }

  /**
   * Get queue size for diagnostics
   */
  getQueueSize(roomId: string): number {
    return this.queues.get(roomId)?.entries.length ?? 0;
  }

  /**
   * Get number of pending actions
   */
  getPendingCount(roomId: string): number {
    const queue = this.queues.get(roomId);

    if (!queue) {
      return 0;
    }

    return queue.entries.filter((e) => !e.processed).length;
  }
}

export const actionQueueManager = new ActionQueueManager();
