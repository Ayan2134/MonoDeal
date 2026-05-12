import { getEffectHandler } from './registry.js';
import { normalizeTargets, validateTargets } from './targets.js';
const ACTION_ID_TO_EFFECT = {
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
export function resolveActionEffect(state, actorId, card, targets) {
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
