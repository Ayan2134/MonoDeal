/**
 * ACTION PROCESSOR
 *
 * Atomic action processing engine that ensures consistency.
 *
 * PROCESSOR RESPONSIBILITIES:
 * 1. Validate action (version, player, turn ownership)
 * 2. Check for duplicates (deduplication)
 * 3. Apply action to game state (call appropriate handler)
 * 4. Increment version atomically
 * 5. Create snapshot
 * 6. Send acknowledgement to client
 * 7. Broadcast to all clients
 *
 * ATOMICITY:
 * - Version increment happens AFTER state change completes
 * - No partial state + old version combinations
 * - No way for client to see inconsistent state
 *
 * ERROR HANDLING:
 * - Validation errors are returned to client
 * - State unchanged if validation fails
 * - Version unchanged if action fails
 *
 * CONCURRENCY:
 * - Actions processed sequentially via action queue
 * - Single processor per room (managed by RoomManager)
 * - No parallel processing (prevents race conditions)
 */

import type { GameState } from './state.js';
import type { GameAction, ActionResult } from './action-types.js';
import { ActionType, isActionVersionValid } from './action-types.js';
import { checkAndRecordAction } from './deduplication.js';
import { createGameStateSnapshot, createSuccessAcknowledgement, createFailureAcknowledgement, type ActionAcknowledgement } from './synchronization.js';
import { endTurn, startTurn, type GameStateResult } from './turn.js';
import { playCard, type PlayCardResult } from './playCard.js';
import { respondWithJustSayNo } from './stack.js';
import { resolveInteraction } from './interactions/resolution.js';
import { rearrangeProperties } from './rearrange.js';

/**
 * Action processor configuration
 */
type ProcessorConfig = {
  // How many versions behind can a client be (due to network lag)
  versionTolerance: number;
};

/**
 * Result of processing an action
 */
export type ProcessingResult = {
  // Whether processing was successful
  success: boolean;
  // Updated game state (if successful)
  gameState?: GameState;
  // Acknowledgement to send to client
  acknowledgement: ActionAcknowledgement;
  // Sequence number for ordering
  sequence?: number;
  // Error details for logging
  error?: {
    code: string;
    message: string;
  };
};

/**
 * Create an action processor for a room
 */
export class ActionProcessor {
  private readonly config: ProcessorConfig;

  constructor(config: Partial<ProcessorConfig> = {}) {
    this.config = {
      versionTolerance: config.versionTolerance ?? 2,
    };
  }

  /**
   * Process a single action
   *
   * PROCESSING PIPELINE:
   * 1. Check for duplicates (return cached result if duplicate)
   * 2. Validate version (check client isn't too far behind)
   * 3. Validate action (player exists, it's their turn, etc.)
   * 4. Apply action (execute game logic)
   * 5. Increment version
   * 6. Create snapshot
   * 7. Return acknowledgement + snapshot
   *
   * @param action - The action to process
   * @param gameState - Current game state
   * @returns Processing result with acknowledgement and updated state
   */
  processAction(action: GameAction, gameState: GameState): ProcessingResult {
    const roomId = gameState.roomId;

    // STEP 1: Check for duplicates
    const { isDuplicate, sequence } = checkAndRecordAction(roomId, action.id);

    if (isDuplicate) {
      // Action already processed, return success
      // (Deduplication means we treat re-submission as success)
      return {
        success: true,
        gameState,
        acknowledgement: createSuccessAcknowledgement(gameState.version, sequence),
        sequence,
      };
    }

    // STEP 2: Validate version
    if (!isActionVersionValid(action.clientVersion, gameState.version, this.config.versionTolerance)) {
      return {
        success: false,
        acknowledgement: createFailureAcknowledgement(
          gameState.version,
          `Version mismatch. Client: ${action.clientVersion}, Server: ${gameState.version}`,
        ),
        error: {
          code: 'VERSION_MISMATCH',
          message: `Client version ${action.clientVersion} too far behind server version ${gameState.version}`,
        },
      };
    }

    // STEP 3 & 4: Validate and apply action
    let result: GameStateResult | PlayCardResult | { ok: boolean; error?: string };

    switch (action.type) {
      case ActionType.StartTurn: {
        // Validate: must be this player's turn and in draw phase
        if (gameState.currentTurnPlayerId !== action.playerId) {
          return {
            success: false,
            acknowledgement: createFailureAcknowledgement(gameState.version, 'Not your turn'),
            error: { code: 'NOT_YOUR_TURN', message: 'It is not your turn' },
          };
        }

        result = startTurn(gameState, action.playerId);
        break;
      }

      case ActionType.EndTurn: {
        // Validate: must be this player's turn
        if (gameState.currentTurnPlayerId !== action.playerId) {
          return {
            success: false,
            acknowledgement: createFailureAcknowledgement(gameState.version, 'Not your turn'),
            error: { code: 'NOT_YOUR_TURN', message: 'It is not your turn' },
          };
        }

        result = endTurn(gameState, action.playerId, action.discardCardIds);
        break;
      }

      case ActionType.PlayCard: {
        // Validate: must be this player's turn and in action phase
        if (gameState.currentTurnPlayerId !== action.playerId) {
          return {
            success: false,
            acknowledgement: createFailureAcknowledgement(gameState.version, 'Not your turn'),
            error: { code: 'NOT_YOUR_TURN', message: 'It is not your turn' },
          };
        }

        result = playCard(gameState, {
          roomId: action.roomId,
          playerId: action.playerId,
          cardId: action.cardId,
          destination: action.destination,
          propertySetColor: action.propertySetColor,
          targetSetId: action.targetSetId,
          targets: action.targets,
        });
        break;
      }

      case ActionType.RearrangeProperties: {
        // Validate: must be this player's turn
        if (gameState.currentTurnPlayerId !== action.playerId) {
          return {
            success: false,
            acknowledgement: createFailureAcknowledgement(gameState.version, 'Not your turn'),
            error: { code: 'NOT_YOUR_TURN', message: 'It is not your turn' },
          };
        }

        result = rearrangeProperties(gameState, {
          playerId: action.playerId,
          cardId: action.cardId,
          targetColor: action.targetColor,
          targetSetId: action.targetSetId,
        });
        break;
      }

      case ActionType.RespondToAction: {
        // Validate: must be response window open and this player must be able to respond
        if (!gameState.responseWindow.isOpen) {
          return {
            success: false,
            acknowledgement: createFailureAcknowledgement(gameState.version, 'No response window open'),
            error: { code: 'NO_RESPONSE_WINDOW', message: 'Response window is not open' },
          };
        }

        result = respondWithJustSayNo(gameState, action.playerId, action.cardId, action.targetStackEntryId);
        break;
      }

      case ActionType.ResolveInteraction: {
        const interaction = gameState.activeInteractions.find((i) => i.interactionId === action.interactionId);
        if (!interaction) {
          return {
            success: false,
            acknowledgement: createFailureAcknowledgement(gameState.version, 'Interaction not found'),
            error: { code: 'INTERACTION_NOT_FOUND', message: 'Interaction not found or already resolved' },
          };
        }
        result = resolveInteraction(gameState, interaction, action.playerId, action.resolution);
        break;
      }

      case ActionType.StartGame: {
        // StartGame is handled by room manager, not action processor
        return {
          success: false,
          acknowledgement: createFailureAcknowledgement(gameState.version, 'Invalid action'),
          error: { code: 'INVALID_ACTION', message: 'StartGame should not be processed here' },
        };
      }

      default: {
        const _exhaustive: never = action;
        return {
          success: false,
          acknowledgement: createFailureAcknowledgement(gameState.version, 'Unknown action type'),
          error: { code: 'UNKNOWN_ACTION', message: `Unknown action type: ${_exhaustive}` },
        };
      }
    }

    // Check if handler succeeded
    if (!result.ok) {
      return {
        success: false,
        acknowledgement: createFailureAcknowledgement(gameState.version, result.error ?? 'Action failed'),
        error: {
          code: 'ACTION_FAILED',
          message: result.error ?? 'Action failed without error message',
        },
      };
    }

    // STEP 5: Increment version atomically
    const nextState = (result as any).gameState ?? (result as any).state;
    if (!nextState) {
      return {
        success: false,
        acknowledgement: createFailureAcknowledgement(gameState.version, 'Internal error'),
        error: { code: 'INTERNAL_ERROR', message: 'Result missing game state' },
      };
    }

    nextState.version = gameState.version + 1;

    // STEP 6: Create snapshot
    const snapshot = createGameStateSnapshot(nextState, sequence);

    // STEP 7: Return result
    return {
      success: true,
      gameState: nextState,
      acknowledgement: createSuccessAcknowledgement(nextState.version, sequence),
      sequence,
    };
  }
}

/**
 * Create a processor instance
 * Typically one per room
 */
export function createActionProcessor(config?: Partial<ProcessorConfig>): ActionProcessor {
  return new ActionProcessor(config);
}
