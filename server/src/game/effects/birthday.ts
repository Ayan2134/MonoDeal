import { randomUUID } from 'node:crypto';
import type { EffectHandler } from './types.js';

export const birthdayCollectionEffect: EffectHandler = (context) => {
  const { state, actorId } = context;
  
  const targetPlayerIds = state.players.filter(p => p.id !== actorId).map(p => p.id);

  if (targetPlayerIds.length === 0) {
    return { ok: true, state };
  }

  const newInteraction = {
    interactionId: randomUUID(),
    interactionType: 'payment' as const,
    initiatorPlayerId: actorId,
    targetPlayerIds,
    amountDue: 2, // It's My Birthday is 2M from everyone
    requiredResponseType: 'payment' as const,
    createdAt: Date.now(),
    expiresAt: null,
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
