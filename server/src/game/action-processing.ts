/**
 * ACTION PROCESSING INTEGRATION
 *
 * Integrates action processor with room manager and socket events.
 *
 * RESPONSIBILITIES:
 * - Convert socket payloads to Action objects
 * - Process actions through action processor
 * - Handle acknowledgements and broadcasting
 * - Manage action processor lifecycle per room
 *
 * This module bridges the gap between socket events and game logic.
 */

import { roomManager } from '../rooms/roomManager.js';
import type { GameState } from './state.js';
import { ActionType, createAction, type PlayCardAction, type RespondToActionAction, type StartTurnAction, type EndTurnAction, type ResolveInteractionAction, type RearrangePropertiesAction } from './action-types.js';
import { ActionProcessor } from './action-processor.js';
import type { PlayCardPayload, RespondToActionPayload, StartTurnPayload, EndTurnPayload, ResolveInteractionPayload, RearrangePropertiesPayload } from '../rooms/types.js';
import type { GameStateResult } from './turn.js';
import { buildTurnUpdate } from './turn.js';

/**
 * Action processor per room
 * Created on first action, cleaned up when room closes
 */
const processorsByRoom = new Map<string, ActionProcessor>();

/**
 * Get or create processor for a room
 */
function getProcessor(roomId: string): ActionProcessor {
  let processor = processorsByRoom.get(roomId);

  if (!processor) {
    processor = new ActionProcessor();
    processorsByRoom.set(roomId, processor);
  }

  return processor;
}

/**
 * Clean up processor for room
 */
export function cleanupProcessor(roomId: string): void {
  processorsByRoom.delete(roomId);
}

/**
 * Process a play-card action
 *
 * PIPELINE:
 * 1. Get current game state
 * 2. Create action object from payload
 * 3. Process through action processor
 * 4. Update room with new state
 * 5. Return result to caller
 */
export function processPlayCard(payload: PlayCardPayload): GameStateResult {
  const gameState = roomManager.getGameState(payload.roomId);

  if (!gameState) {
    return {
      ok: false,
      error: 'Game state not found',
    };
  }

  // Create action object
  const action = createAction<PlayCardAction>(
    ActionType.PlayCard,
    payload.playerId,
    payload.roomId,
    payload.clientVersion,
    {
      cardId: payload.cardId,
      destination: payload.destination,
      propertySetColor: payload.propertySetColor,
      targetSetId: payload.targetSetId,
      targets: payload.targets,
    },
  );

  // Process through action processor
  const processor = getProcessor(payload.roomId);
  const result = processor.processAction(action, gameState);

  // Convert ProcessingResult to GameStateResult
  if (result.success && result.gameState) {
    // Update room with new state
    roomManager.updateGameState(payload.roomId, result.gameState);
    
    return {
      ok: true,
      gameState: result.gameState,
      turn: buildTurnUpdate(result.gameState),
    };
  }

  return {
    ok: false,
    error: result.acknowledgement.error ?? 'Action processing failed',
  };
}

/**
 * Process a respond-to-action action
 */
export function processRespondToAction(payload: RespondToActionPayload): GameStateResult {
  const gameState = roomManager.getGameState(payload.roomId);

  if (!gameState) {
    return {
      ok: false,
      error: 'Game state not found',
    };
  }

  const action = createAction<RespondToActionAction>(
    ActionType.RespondToAction,
    payload.playerId,
    payload.roomId,
    payload.clientVersion,
    {
      cardId: payload.cardId,
      targetStackEntryId: payload.targetStackEntryId,
    },
  );

  const processor = getProcessor(payload.roomId);
  const result = processor.processAction(action, gameState);

  if (result.success && result.gameState) {
    roomManager.updateGameState(payload.roomId, result.gameState);
    
    return {
      ok: true,
      gameState: result.gameState,
      turn: buildTurnUpdate(result.gameState),
    };
  }

  return {
    ok: false,
    error: result.acknowledgement.error ?? 'Action processing failed',
  };
}

/**
 * Process a start-turn action
 */
export function processStartTurn(payload: StartTurnPayload): GameStateResult {
  const gameState = roomManager.getGameState(payload.roomId);

  if (!gameState) {
    return {
      ok: false,
      error: 'Game state not found',
    };
  }

  const action = createAction<StartTurnAction>(
    ActionType.StartTurn,
    payload.playerId,
    payload.roomId,
    payload.clientVersion,
    {},
  );

  const processor = getProcessor(payload.roomId);
  const result = processor.processAction(action, gameState);

  if (result.success && result.gameState) {
    roomManager.updateGameState(payload.roomId, result.gameState);
    
    return {
      ok: true,
      gameState: result.gameState,
      turn: buildTurnUpdate(result.gameState),
    };
  }

  return {
    ok: false,
    error: result.acknowledgement.error ?? 'Action processing failed',
  };
}

/**
 * Process an end-turn action
 */
export function processEndTurn(payload: EndTurnPayload): GameStateResult {
  const gameState = roomManager.getGameState(payload.roomId);

  if (!gameState) {
    return {
      ok: false,
      error: 'Game state not found',
    };
  }

  const action = createAction<EndTurnAction>(
    ActionType.EndTurn,
    payload.playerId,
    payload.roomId,
    payload.clientVersion,
    {
      discardCardIds: payload.discardCardIds,
    },
  );

  const processor = getProcessor(payload.roomId);
  const result = processor.processAction(action, gameState);

  if (result.success && result.gameState) {
    roomManager.updateGameState(payload.roomId, result.gameState);
    
    return {
      ok: true,
      gameState: result.gameState,
      turn: buildTurnUpdate(result.gameState),
    };
  }

  return {
    ok: false,
    error: result.acknowledgement.error ?? 'Action processing failed',
  };
}

/**
 * Process a resolve-interaction action
 */
export function processResolveInteraction(payload: ResolveInteractionPayload): GameStateResult {
  const gameState = roomManager.getGameState(payload.roomId);

  if (!gameState) {
    return {
      ok: false,
      error: 'Game state not found',
    };
  }

  const action = createAction<ResolveInteractionAction>(
    ActionType.ResolveInteraction,
    payload.playerId,
    payload.roomId,
    payload.clientVersion,
    {
      interactionId: payload.interactionId,
      resolution: payload.resolution,
    },
  );

  const processor = getProcessor(payload.roomId);
  const result = processor.processAction(action, gameState);

  if (result.success && result.gameState) {
    roomManager.updateGameState(payload.roomId, result.gameState);
    
    return {
      ok: true,
      gameState: result.gameState,
      turn: buildTurnUpdate(result.gameState),
    };
  }

  return {
    ok: false,
    error: result.acknowledgement.error ?? 'Action processing failed',
  };
}

/**
 * Process a rearrange-properties action
 */
export function processRearrangeProperties(payload: RearrangePropertiesPayload): GameStateResult {
  const gameState = roomManager.getGameState(payload.roomId);

  if (!gameState) {
    return {
      ok: false,
      error: 'Game state not found',
    };
  }

  const action = createAction<RearrangePropertiesAction>(
    ActionType.RearrangeProperties,
    payload.playerId,
    payload.roomId,
    payload.clientVersion,
    {
      cardId: payload.cardId,
      targetColor: payload.targetColor as any,
      targetSetId: payload.targetSetId,
    },
  );

  const processor = getProcessor(payload.roomId);
  const result = processor.processAction(action, gameState);

  if (result.success && result.gameState) {
    roomManager.updateGameState(payload.roomId, result.gameState);
    
    return {
      ok: true,
      gameState: result.gameState,
      turn: buildTurnUpdate(result.gameState),
    };
  }

  return {
    ok: false,
    error: result.acknowledgement.error ?? 'Action processing failed',
  };
}
