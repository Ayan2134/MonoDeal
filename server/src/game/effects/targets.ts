import type { EffectTargetSelection } from './types.js';
import type { GameState } from '../state.js';

export function validateTargets(state: GameState, targets: EffectTargetSelection) {
  if (targets.playerIds) {
    const missing = targets.playerIds.filter((playerId) => !state.players.some((player) => player.id === playerId));
    if (missing.length) {
      return { ok: false, error: 'Target player not found.' } as const;
    }
  }

  return { ok: true } as const;
}

export function normalizeTargets(targets?: EffectTargetSelection): EffectTargetSelection {
  return {
    playerIds: targets?.playerIds ?? [],
    propertyCardIds: targets?.propertyCardIds ?? [],
    propertySetColors: targets?.propertySetColors ?? [],
    propertySetIds: targets?.propertySetIds ?? [],
  };
}
