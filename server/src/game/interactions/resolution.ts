import type { GameState } from '../state.js';
import type { PendingInteraction, InteractionResolutionPayload, PaymentResolution, PropertySelectionResolution } from './types.js';
import { validatePayment, applyPayment } from './payment.js';
import { recomputePropertySets, createNewSet } from '../property.js';

export function resolveInteraction(
  state: GameState,
  interaction: PendingInteraction,
  playerId: string,
  resolution: InteractionResolutionPayload
): { ok: true; state: GameState } | { ok: false; error: string } {
  let expectedResponderId = interaction.targetPlayerIds[0];
  if (interaction.counterStack && interaction.counterStack.stackState === 'active') {
    expectedResponderId = interaction.counterStack.currentResponderPlayerId;
  }

  if (playerId !== expectedResponderId) {
    return { ok: false, error: 'You are not the active responder for this interaction.' };
  }

  let nextState = { ...state };

  if ('action' in resolution && resolution.action === 'just-say-no') {
    if (!interaction.canBeCountered) {
      return { ok: false, error: 'This interaction cannot be countered.' };
    }
    const player = nextState.players.find(p => p.id === playerId);
    if (!player) return { ok: false, error: 'Player not found' };

    const cardIndex = player.hand.findIndex(c => c.id === resolution.cardId);
    if (cardIndex === -1 || (player.hand[cardIndex] as any).actionId !== 'just-say-no') {
      return { ok: false, error: 'Invalid Just Say No card.' };
    }

    const card = player.hand[cardIndex]!;
    player.hand.splice(cardIndex, 1);
    nextState.discardPile.push(card);

    let counterStack = interaction.counterStack;
    if (!counterStack) {
      counterStack = {
        stackId: `stack-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        rootAction: interaction.interactionId,
        targetModifierCardId: (resolution as any).targetModifierCardId,
        counterActions: [],
        currentResponderPlayerId: interaction.initiatorPlayerId,
        responseDeadline: Date.now() + 60000,
        stackState: 'active'
      };
    } else {
      counterStack = { ...counterStack };
      const originalTargetId = interaction.targetPlayerIds[0]!;
      counterStack.currentResponderPlayerId = (playerId === originalTargetId) 
        ? interaction.initiatorPlayerId 
        : originalTargetId;
    }

    counterStack.counterActions = [
      ...counterStack.counterActions,
      {
        actionId: 'just-say-no',
        playerId,
        cardId: resolution.cardId,
        timestamp: Date.now()
      }
    ];

    const updatedInteraction = {
      ...interaction,
      counterStack
    };

    nextState.activeInteractions = nextState.activeInteractions.map(i =>
      i.interactionId === interaction.interactionId ? updatedInteraction : i
    );

    return { ok: true, state: nextState };
  }

  if ('action' in resolution && resolution.action === 'accept-counter') {
    if (!interaction.counterStack) {
      return { ok: false, error: 'No counter stack to accept.' };
    }

    const depth = interaction.counterStack.counterActions.length;
    
    if (depth % 2 === 1) {
      // Initiator is accepting Target's JSN.
      if (interaction.counterStack.targetModifierCardId) {
        // Only the modifier is cancelled!
        const targetModifierId = interaction.counterStack.targetModifierCardId;
        const remainingModifiers = (interaction.activeModifiers || []).filter(m => m.cardId !== targetModifierId);
        const baseAmount = interaction.baseAmount || interaction.amountDue || 0;
        const totalMultiplier = Math.pow(2, remainingModifiers.length);

        const updatedInteraction = {
          ...interaction,
          activeModifiers: remainingModifiers,
          amountDue: baseAmount * totalMultiplier,
          counterStack: undefined
        };

        nextState.activeInteractions = nextState.activeInteractions.map(i =>
          i.interactionId === interaction.interactionId ? updatedInteraction : i
        );
        return { ok: true, state: nextState };
      } else {
        // The entire original action is cancelled.
        nextState.activeInteractions = nextState.activeInteractions.filter(i => i.interactionId !== interaction.interactionId);
        return { ok: true, state: nextState };
      }
    } else {
      // Target is accepting Initiator's JSN. The Target's JSN is cancelled.
      // The original action succeeds. The stack is resolved.
      // Target must now fulfill the interaction.
      const updatedInteraction = {
        ...interaction,
        counterStack: {
          ...interaction.counterStack,
          stackState: 'resolved' as const
        }
      };
      
      nextState.activeInteractions = nextState.activeInteractions.map(i =>
        i.interactionId === interaction.interactionId ? updatedInteraction : i
      );
      
      return { ok: true, state: nextState };
    }
  }

  if (interaction.interactionType === 'payment') {
    if (!interaction.amountDue) {
      return { ok: false, error: 'Invalid payment interaction: missing amountDue' };
    }
    
    if (!('action' in resolution) || resolution.action !== 'payment') {
      return { ok: false, error: 'Invalid resolution action for payment' };
    }

    const paymentRes = resolution;
    if (!paymentRes.cardIds) {
      return { ok: false, error: 'Invalid resolution format for payment' };
    }

    const validation = validatePayment(nextState, playerId, interaction.amountDue, paymentRes);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }

    // Apply the payment
    nextState = applyPayment(nextState, playerId, interaction.initiatorPlayerId, validation.cards);

    // Remove the player from targetPlayerIds
    const updatedInteraction = {
      ...interaction,
      targetPlayerIds: interaction.targetPlayerIds.filter(id => id !== playerId)
    };

    if (updatedInteraction.targetPlayerIds.length === 0) {
      // Interaction is fully resolved, remove it
      nextState.activeInteractions = nextState.activeInteractions.filter(i => i.interactionId !== interaction.interactionId);
    } else {
      // Replace with updated interaction
      nextState.activeInteractions = nextState.activeInteractions.map(i => 
        i.interactionId === interaction.interactionId ? updatedInteraction : i
      );
    }

    return { ok: true, state: nextState };
  }
  
  if (interaction.interactionType === 'deal-breaker') {
    if (!('action' in resolution) || resolution.action !== 'accept') {
      return { ok: false, error: 'Invalid resolution for deal breaker' };
    }

    const setId = interaction.targetPropertySetId;
    if (!setId) return { ok: false, error: 'Target set ID missing from interaction.' };

    const targetPlayer = nextState.players.find(p => p.id === expectedResponderId);
    if (!targetPlayer) return { ok: false, error: 'Target player not found.' };

    const setIndex = targetPlayer.properties.findIndex(s => s.setId === setId);
    if (setIndex < 0) return { ok: false, error: 'Target property set not found.' };

    const [stolenSet] = targetPlayer.properties.splice(setIndex, 1);
    
    // Add set to initiator
    const initiator = nextState.players.find(p => p.id === interaction.initiatorPlayerId);
    if (!initiator) return { ok: false, error: 'Initiator not found.' };

    initiator.properties.push(stolenSet!);

    // Remove interaction
    nextState.activeInteractions = nextState.activeInteractions.filter(i => i.interactionId !== interaction.interactionId);
    return { ok: true, state: nextState };
  }
  
  if (interaction.interactionType === 'steal-property') {
    if (!('action' in resolution) || resolution.action !== 'accept') {
      return { ok: false, error: 'Invalid resolution for steal property' };
    }

    const cardId = interaction.targetPropertyCardId;
    if (!cardId) return { ok: false, error: 'Target card ID missing from interaction.' };

    const targetPlayer = nextState.players.find(p => p.id === expectedResponderId);
    const initiator = nextState.players.find(p => p.id === interaction.initiatorPlayerId);
    if (!targetPlayer || !initiator) return { ok: false, error: 'Player not found.' };

    // Find and remove card from target
    let stolenCard: any;
    let found = false;
    for (const set of targetPlayer.properties) {
      const idx = set.cards.findIndex(c => c.id === cardId);
      if (idx !== -1) {
        if (set.isComplete) return { ok: false, error: 'Cannot steal from a complete set.' };
        [stolenCard] = set.cards.splice(idx, 1);
        found = true;
        // Recalculate completeness
        set.isComplete = false; // Obviously false now as it was incomplete before and we removed a card
        // Wait, if it was complete before we wouldn't be here. 
        // If it was incomplete, it stays incomplete.
        // We should cleanup empty sets
        targetPlayer.properties = targetPlayer.properties.filter(s => s.cards.length > 0);
        break;
      }
    }

    if (!found) return { ok: false, error: 'Target card not found in collections.' };

    // Add to initiator
    // For simplicity, add to a new or existing set of the same color
    const color = stolenCard.color || (stolenCard.type === 'wildcard' ? stolenCard.colors[0] : 'wild');
    // Note: Monopoly deal cards usually stay in their assigned color group.
    // If it's a wildcard, it keeps its current assigned color if possible.
    
    // Check if initiator already has a set of this color
    let initiatorSet = initiator.properties.find(s => s.color === color && !s.isComplete);
    if (!initiatorSet) {
      const { setId } = createNewSet(color as any);
      initiatorSet = { setId, color: color as any, cards: [], isComplete: false };
      initiator.properties.push(initiatorSet);
    }
    initiatorSet.cards.push(stolenCard);
    
    // Recalculate initiator and target sets
    nextState.players = nextState.players.map(p => {
      if (p.id === initiator.id) return recomputePropertySets(p, nextState.discardPile);
      if (p.id === targetPlayer.id) return recomputePropertySets(p, nextState.discardPile);
      return p;
    });

    nextState.activeInteractions = nextState.activeInteractions.filter(i => i.interactionId !== interaction.interactionId);
    return { ok: true, state: nextState };
  }

  if (interaction.interactionType === 'forced-swap') {
    if (!('action' in resolution) || resolution.action !== 'accept') {
      return { ok: false, error: 'Invalid resolution for forced swap' };
    }

    const targetCardId = interaction.targetPropertyCardId;
    const initiatorCardId = interaction.initiatorPropertyCardId;
    if (!targetCardId || !initiatorCardId) return { ok: false, error: 'Card IDs missing from interaction.' };

    const targetPlayer = nextState.players.find(p => p.id === expectedResponderId);
    const initiator = nextState.players.find(p => p.id === interaction.initiatorPlayerId);
    if (!targetPlayer || !initiator) return { ok: false, error: 'Player not found.' };

    let targetCard: any;
    let initiatorCard: any;

    // Remove from target
    let foundTarget = false;
    for (const set of targetPlayer.properties) {
      const idx = set.cards.findIndex(c => c.id === targetCardId);
      if (idx !== -1) {
        if (set.isComplete) return { ok: false, error: 'Cannot take from a complete set.' };
        [targetCard] = set.cards.splice(idx, 1);
        foundTarget = true;
        set.isComplete = false;
        break;
      }
    }
    targetPlayer.properties = targetPlayer.properties.filter(s => s.cards.length > 0);

    // Remove from initiator
    let foundInitiator = false;
    for (const set of initiator.properties) {
      const idx = set.cards.findIndex(c => c.id === initiatorCardId);
      if (idx !== -1) {
        if (set.isComplete) return { ok: false, error: 'Cannot give from a complete set.' };
        [initiatorCard] = set.cards.splice(idx, 1);
        foundInitiator = true;
        set.isComplete = false;
        break;
      }
    }
    initiator.properties = initiator.properties.filter(s => s.cards.length > 0);

    if (!foundTarget || !foundInitiator) return { ok: false, error: 'Cards not found in collections.' };

    // Swap ownership
    // Add initiator's card to target
    const targetColor = (initiatorCard as any).color || 'wild';
    let targetSet = targetPlayer.properties.find(s => s.color === targetColor && !s.isComplete);
    if (!targetSet) {
      const { setId } = createNewSet(targetColor as any);
      targetSet = { setId, color: targetColor as any, cards: [], isComplete: false };
      targetPlayer.properties.push(targetSet);
    }
    targetSet.cards.push(initiatorCard);

    // Add target's card to initiator
    const initiatorColor = (targetCard as any).color || 'wild';
    let initiatorSet = initiator.properties.find(s => s.color === initiatorColor && !s.isComplete);
    if (!initiatorSet) {
      const { setId } = createNewSet(initiatorColor as any);
      initiatorSet = { setId, color: initiatorColor as any, cards: [], isComplete: false };
      initiator.properties.push(initiatorSet);
    }
    initiatorSet.cards.push(targetCard);

    // Recalculate initiator and target sets
    nextState.players = nextState.players.map(p => {
      if (p.id === initiator.id) return recomputePropertySets(p);
      if (p.id === targetPlayer.id) return recomputePropertySets(p);
      return p;
    });

    nextState.activeInteractions = nextState.activeInteractions.filter(i => i.interactionId !== interaction.interactionId);
    return { ok: true, state: nextState };
  }

  if (interaction.interactionType === 'property-selection' || interaction.interactionType === 'property-swap') {
    // For now just remove the interaction to allow testing
    nextState.activeInteractions = nextState.activeInteractions.filter(i => i.interactionId !== interaction.interactionId);
    return { ok: true, state: nextState };
  }

  return { ok: false, error: `Unsupported interaction type: ${interaction.interactionType}` };
}
