import { addBuildingToSet } from '../property.js';
import type { EffectHandler } from './types.js';

export const houseEffect: EffectHandler = (context) => {
  const { state, actorId, targets, card } = context;

  const colors = targets?.propertySetColors || [];
  if (colors.length !== 1) {
    return { ok: false, error: 'You must select exactly one property set for the house.' };
  }

  const color = colors[0] as any;
  const player = state.players.find(p => p.id === actorId);
  if (!player) return { ok: false, error: 'Player not found.' };

  const result = addBuildingToSet(player, card, color);
  if (!result.ok) return result;

  return {
    ok: true,
    state: {
      ...state,
      players: state.players.map(p => p.id === actorId ? result.player : p)
    }
  };
};
