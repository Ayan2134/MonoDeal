import { addBuildingToSet } from '../property.js';
import type { EffectHandler } from './types.js';
import { appendLogToState } from '../logger.js';

export const houseEffect: EffectHandler = (context) => {
  const { state, actorId, targets, card } = context;

  const setIds = targets?.propertySetIds || [];
  if (setIds.length !== 1) {
    return { ok: false, error: 'You must select exactly one property set for the house.' };
  }

  const setId = setIds[0]!;
  const player = state.players.find(p => p.id === actorId);
  if (!player) return { ok: false, error: 'Player not found.' };

  const targetSet = player.properties.find(s => s.setId === setId);
  if (!targetSet) return { ok: false, error: 'Target set not found.' };

  const result = addBuildingToSet(player, card, setId);
  if (!result.ok) return result;

  const nextState = {
    ...state,
    players: state.players.map(p => p.id === actorId ? result.player : p)
  };

  appendLogToState(nextState, {
    type: 'card_played',
    actorPlayerId: actorId,
    message: `${player.name} placed a House on ${targetSet.color} set`,
  });

  return {
    ok: true,
    state: nextState
  };
};
