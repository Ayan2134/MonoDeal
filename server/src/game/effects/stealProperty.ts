import { randomUUID } from 'node:crypto';
import type { EffectHandler } from './types.js';

export const stealPropertyEffect: EffectHandler = (context) => {
  const { state, actorId, targets } = context;

  const targetPlayerIds = targets?.playerIds || [];
  if (targetPlayerIds.length !== 1) {
    return { ok: false, error: 'Sly Deal requires exactly one target player.' };
  }

  const targetPlayerId = targetPlayerIds[0]!;
  if (targetPlayerId === actorId) {
    return { ok: false, error: 'You cannot target yourself.' };
  }

  const targetPlayer = state.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { ok: false, error: 'Target player not found.' };
  }

  const targetCardIds = targets?.propertyCardIds || [];
  if (targetCardIds.length !== 1) {
    return { ok: false, error: 'You must select exactly one property card to steal.' };
  }

  const targetCardId = targetCardIds[0]!;

  // Find the property card and check if it's in an incomplete set
  let cardFound = false;
  for (const set of targetPlayer.properties) {
    const card = set.cards.find(c => c.id === targetCardId);
    if (card) {
      cardFound = true;
      if (set.isComplete) {
        return { ok: false, error: 'You cannot steal a card from a complete set.' };
      }
      break;
    }
  }

  if (!cardFound) {
    return { ok: false, error: 'Selected property card not found in target player\'s collection.' };
  }

  const newInteraction = {
    interactionId: randomUUID(),
    interactionType: 'steal-property' as const,
    initiatorPlayerId: actorId,
    targetPlayerIds: [targetPlayerId],
    targetPropertyCardId: targetCardId,
    requiredResponseType: 'none' as const,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60000,
    canBeCountered: true
  };

  return {
    ok: true,
    state: {
      ...state,
      activeInteractions: [...state.activeInteractions, newInteraction]
    }
  };
};
