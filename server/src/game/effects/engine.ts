import type { ActionCard } from '../types.js';
import type { GameState } from '../state.js';
import { getEffectHandler } from './registry.js';
import { normalizeTargets, validateTargets } from './targets.js';
import type { EffectId, EffectResult, EffectTargetSelection } from './types.js';

const ACTION_ID_TO_EFFECT: Record<string, EffectId> = {
  rent: 'rent',
  'rent-multiplier': 'rent-multiplier',
  'steal-property': 'steal-property',
  'sly-deal': 'steal-property',
  'forced-deal': 'forced-swap',
  'forced-swap': 'forced-swap',
  'deal-breaker': 'deal-breaker',
  'debt-collector': 'debt-collection',
  'double-the-rent': 'rent-multiplier',
  house: 'house',
  hotel: 'hotel',
  'just-say-no': 'just-say-no',
  birthday: 'birthday-collection',
  'pass-go': 'pass-go',
};

export function resolveActionEffect(
  state: GameState,
  actorId: string,
  card: ActionCard,
  targets?: EffectTargetSelection,
): EffectResult {
  const effectId = ACTION_ID_TO_EFFECT[card.actionId];

  if (!effectId) {
    // Unknown action cards are treated as no-op until a handler is registered.
    return { ok: true, state };
  }

  const handler = getEffectHandler(effectId);
  if (!handler) {
    return { ok: true, state };
  }

  const normalizedTargets = normalizeTargets(targets);
  const validation = validateTargets(state, normalizedTargets);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  return handler({
    roomId: state.roomId,
    actorId,
    card,
    state,
    targets: normalizedTargets,
  });
}
