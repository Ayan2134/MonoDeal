import type { GameState } from './state.js';
import { TurnPhase } from './state.js';
import type { PropertyColor } from './types.js';
import { appendLogToState } from './logger.js';
import { moveCardBetweenSets } from './property.js';
import type { GameStateResult } from './turn.js';
import { buildTurnUpdate } from './turn.js';

export type RearrangePropertiesInput = {
  playerId: string;
  cardId: string;
  targetColor: PropertyColor | 'wild';
  targetSetId: string | 'new';
};

export function rearrangeProperties(state: GameState, input: RearrangePropertiesInput): GameStateResult {
  if (state.currentTurnPlayerId !== input.playerId) {
    return { ok: false, error: 'It is not your turn.' };
  }

  if (state.turnPhase !== TurnPhase.Action) {
    return { ok: false, error: 'You can rearrange properties during the action phase of your turn.' };
  }

  if (state.activeInteractions.length > 0) {
    return { ok: false, error: 'Cannot rearrange properties while interactions are pending.' };
  }

  const playerIndex = state.players.findIndex(p => p.id === input.playerId);
  if (playerIndex === -1) return { ok: false, error: 'Player not found.' };

  const player = state.players[playerIndex]!;
  const result = moveCardBetweenSets(player, input.cardId, input.targetColor, input.targetSetId, state.discardPile);

  if (!result.ok) return result;

  const nextState = {
    ...state,
    players: state.players.map((p, idx) => idx === playerIndex ? result.player : p)
  };

  const card = player.properties.flatMap(s => s.cards).find(c => c.id === input.cardId);
  appendLogToState(nextState, {
    type: 'card_played',
    actorPlayerId: input.playerId,
    message: `${player.name} moved ${card?.name || 'a property'} to ${input.targetColor} set`,
    metadata: {
      cardId: input.cardId,
      targetColor: input.targetColor,
      targetSetId: input.targetSetId
    }
  });

  return {
    ok: true,
    gameState: nextState,
    turn: buildTurnUpdate(nextState)
  };
}
