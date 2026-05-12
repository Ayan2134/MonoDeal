import type { EffectHandler } from './types.js';
import { calculateRent } from '../rentCalculation.js';
import { PropertyColor } from '../types.js';

export const rentEffect: EffectHandler = (context) => {
  const { state, actorId, card, targets } = context;

  const player = state.players.find(p => p.id === actorId);
  if (!player) return { ok: false, error: 'Player not found' };

  if (card.type !== 'action' || card.actionId !== 'rent') {
    return { ok: false, error: 'Invalid card for rent effect' };
  }

  // A rent card requires exactly one target property set
  const targetSetIds = targets?.propertySetIds || [];
  if (targetSetIds.length !== 1) {
    return { ok: false, error: 'You must select exactly one property set to charge rent for.' };
  }

  const selectedSetId = targetSetIds[0]!;
  const propertySet = player.properties.find(set => set.setId === selectedSetId);
  if (!propertySet || propertySet.cards.length === 0) {
    return { ok: false, error: 'Target property set not found or empty.' };
  }

  const selectedColor = propertySet.color;
  if (selectedColor === 'wild') {
    return { ok: false, error: 'Cannot charge rent for a generic "wild" set. Reassign its color first.' };
  }

  // Validate the selected color is supported by the rent card
  if (!card.wildcardRent) {
    if (!card.supportedColors || !card.supportedColors.includes(selectedColor as PropertyColor)) {
      return { ok: false, error: 'This rent card cannot be used for the selected color.' };
    }
  }

  const baseRent = calculateRent(player, selectedSetId, 1);
  if (baseRent <= 0) {
    return { ok: false, error: 'Rent amount is zero.' };
  }

  const modifierCardIds = targets?.modifierCardIds || [];
  const activeModifiers = modifierCardIds.map(id => ({
    cardId: id,
    actionId: 'double-the-rent',
    multiplier: 2
  }));

  const totalMultiplier = Math.pow(2, activeModifiers.length);
  const finalRentAmount = baseRent * totalMultiplier;

  let nextState = { ...state };
  let interactions = [...nextState.activeInteractions];

  const commonProps = {
    interactionType: 'payment' as const,
    initiatorPlayerId: actorId,
    amountDue: finalRentAmount,
    baseAmount: baseRent,
    activeModifiers: activeModifiers,
    requiredResponseType: 'payment' as const,
    canBeCountered: true,
    createdAt: Date.now(),
    expiresAt: Date.now() + 60000,
  };

  if (card.affectsAllPlayers) {
    for (const otherPlayer of state.players) {
      if (otherPlayer.id !== actorId && otherPlayer.status === 'connected') {
        interactions.push({
          ...commonProps,
          interactionId: `rent-${Date.now()}-${otherPlayer.id}`,
          targetPlayerIds: [otherPlayer.id],
        });
      }
    }
  } else {
    // Wildcard rent: requires exact player target
    const targetPlayers = targets?.playerIds || [];
    if (targetPlayers.length !== 1) {
      return { ok: false, error: 'Wildcard rent requires exactly one target player.' };
    }

    const targetPlayerId = targetPlayers[0]!;
    if (targetPlayerId === actorId) {
      return { ok: false, error: 'You cannot charge yourself rent.' };
    }

    const targetPlayer = state.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) {
      return { ok: false, error: 'Target player not found.' };
    }

    interactions.push({
      ...commonProps,
      interactionId: `rent-${Date.now()}-${targetPlayerId}`,
      targetPlayerIds: [targetPlayerId],
    });
  }

  nextState.activeInteractions = interactions;

  return { ok: true, state: nextState };
};
