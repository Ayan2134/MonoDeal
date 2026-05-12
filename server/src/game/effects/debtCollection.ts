import { randomUUID } from 'node:crypto';
import type { EffectHandler } from './types.js';

export const debtCollectionEffect: EffectHandler = (context) => {
  const { state, actorId, targets } = context;
  
  if (!targets?.playerIds || targets.playerIds.length === 0) {
    return { ok: false, error: 'Debt collector requires a target player' };
  }

  const targetPlayerId = targets.playerIds[0]!;

  const newInteraction = {
    interactionId: randomUUID(),
    interactionType: 'payment' as const,
    initiatorPlayerId: actorId,
    targetPlayerIds: [targetPlayerId],
    amountDue: 5,
    requiredResponseType: 'payment' as const,
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
