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
import { ActionType, createAction } from './action-types.js';
import { ActionProcessor } from './action-processor.js';
import { buildTurnUpdate } from './turn.js';
/**
 * Action processor per room
 * Created on first action, cleaned up when room closes
 */
const processorsByRoom = new Map();
/**
 * Get or create processor for a room
 */
function getProcessor(roomId) {
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
export function cleanupProcessor(roomId) {
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
export function processPlayCard(payload) {
    const gameState = roomManager.getGameState(payload.roomId);
    if (!gameState) {
        return {
            ok: false,
            error: 'Game state not found',
        };
    }
    // Create action object
    const action = createAction(ActionType.PlayCard, payload.playerId, payload.roomId, payload.clientVersion, {
        cardId: payload.cardId,
        destination: payload.destination,
        propertySetColor: payload.propertySetColor,
        targetSetId: payload.targetSetId,
        targets: payload.targets,
    });
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
export function processRespondToAction(payload) {
    const gameState = roomManager.getGameState(payload.roomId);
    if (!gameState) {
        return {
            ok: false,
            error: 'Game state not found',
        };
    }
    const action = createAction(ActionType.RespondToAction, payload.playerId, payload.roomId, payload.clientVersion, {
        cardId: payload.cardId,
        targetStackEntryId: payload.targetStackEntryId,
    });
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
export function processStartTurn(payload) {
    const gameState = roomManager.getGameState(payload.roomId);
    if (!gameState) {
        return {
            ok: false,
            error: 'Game state not found',
        };
    }
    const action = createAction(ActionType.StartTurn, payload.playerId, payload.roomId, payload.clientVersion, {});
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
export function processEndTurn(payload) {
    const gameState = roomManager.getGameState(payload.roomId);
    if (!gameState) {
        return {
            ok: false,
            error: 'Game state not found',
        };
    }
    const action = createAction(ActionType.EndTurn, payload.playerId, payload.roomId, payload.clientVersion, {
        discardCardIds: payload.discardCardIds,
    });
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
export function processResolveInteraction(payload) {
    const gameState = roomManager.getGameState(payload.roomId);
    if (!gameState) {
        return {
            ok: false,
            error: 'Game state not found',
        };
    }
    const action = createAction(ActionType.ResolveInteraction, payload.playerId, payload.roomId, payload.clientVersion, {
        interactionId: payload.interactionId,
        resolution: payload.resolution,
    });
    const processor = getProcessor(payload.roomId);
    const result = processor.processAction(action, gameState);
    if (result.success && result.gameState) {
        const interaction = gameState.activeInteractions.find(i => i.interactionId === payload.interactionId);
        roomManager.updateGameState(payload.roomId, result.gameState);
        if (payload.resolution.action === 'payment' && interaction) {
            const actor = result.gameState.players.find(p => p.id === payload.playerId);
            const target = result.gameState.players.find(p => p.id === interaction.initiatorPlayerId);
            roomManager.appendLog(payload.roomId, {
                type: 'payment',
                actorPlayerId: payload.playerId,
                targetPlayerId: interaction.initiatorPlayerId,
                message: `${actor?.name || 'Someone'} paid ${interaction.amountDue || 0}M to ${target?.name || 'Someone'}`,
                metadata: {
                    amount: interaction.amountDue,
                    interactionId: payload.interactionId
                }
            });
        }
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
export function processRearrangeProperties(payload) {
    const gameState = roomManager.getGameState(payload.roomId);
    if (!gameState) {
        return {
            ok: false,
            error: 'Game state not found',
        };
    }
    const action = createAction(ActionType.RearrangeProperties, payload.playerId, payload.roomId, payload.clientVersion, {
        cardId: payload.cardId,
        targetColor: payload.targetColor,
        targetSetId: payload.targetSetId,
    });
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
