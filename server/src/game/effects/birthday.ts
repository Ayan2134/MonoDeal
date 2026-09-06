import { randomUUID } from 'node:crypto';
import type { EffectHandler } from './types.js';
import { appendLogToState } from '../logger.js';

export const birthdayCollectionEffect: EffectHandler = (context) => {
  const { state, actorId } = context;

  // One interaction per opponent so Just Say No only cancels that player's gift.
  const targets = state.players.filter(
    (player) => player.id !== actorId && player.status === 'connected',
  );

  if (targets.length === 0) {
    return { ok: true, state };
  }

  const interactions = targets.map((target) => ({
    interactionId: randomUUID(),
    interactionType: 'payment' as const,
    initiatorPlayerId: actorId,
    targetPlayerIds: [target.id],
    amountDue: 2,
    requiredResponseType: 'payment' as const,
    createdAt: Date.now(),
    expiresAt: null,
    canBeCountered: true,
  }));

  const nextState = {
    ...state,
    activeInteractions: [...state.activeInteractions, ...interactions],
  };

  const player = state.players.find((p) => p.id === actorId);
  appendLogToState(nextState, {
    type: 'payment',
    actorPlayerId: actorId,
    message: `${player?.name || 'Someone'} charged 2M from everyone using It's My Birthday`,
  });

  return {
    ok: true,
    state: nextState,
  };
};
