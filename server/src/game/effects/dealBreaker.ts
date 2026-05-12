import type { EffectHandler } from './types.js';

export const dealBreakerEffect: EffectHandler = (context) => {
  const { state, actorId, card, targets } = context;

  const player = state.players.find(p => p.id === actorId);
  if (!player) return { ok: false, error: 'Player not found' };

  if (card.type !== 'action' || card.actionId !== 'deal-breaker') {
    return { ok: false, error: 'Invalid card for deal breaker effect' };
  }

  const targetPlayers = targets?.playerIds || [];
  if (targetPlayers.length !== 1) {
    return { ok: false, error: 'Deal Breaker requires exactly one target player.' };
  }

  const targetPlayerId = targetPlayers[0]!;
  if (targetPlayerId === actorId) {
    return { ok: false, error: 'You cannot target yourself.' };
  }

  const targetPlayer = state.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { ok: false, error: 'Target player not found.' };
  }

  const targetSetIds = targets?.propertySetIds || [];
  if (targetSetIds.length !== 1) {
    return { ok: false, error: 'You must select exactly one property set to steal.' };
  }

  const selectedSetId = targetSetIds[0]!;
  
  const targetSet = targetPlayer.properties.find(set => set.setId === selectedSetId);
  if (!targetSet) {
    return { ok: false, error: 'Target property set not found.' };
  }

  if (!targetSet.isComplete) {
    return { ok: false, error: 'Deal Breaker can only steal complete property sets.' };
  }

  let nextState = { ...state };
  
  nextState.activeInteractions = [
    ...nextState.activeInteractions,
    {
      interactionId: `deal-breaker-${Date.now()}-${targetPlayerId}`,
      interactionType: 'deal-breaker',
      initiatorPlayerId: actorId,
      targetPlayerIds: [targetPlayerId],
      targetPropertySetId: selectedSetId,
      requiredResponseType: 'none',
      canBeCountered: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
    }
  ];

  return { ok: true, state: nextState };
};
