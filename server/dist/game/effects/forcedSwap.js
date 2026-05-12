import { randomUUID } from 'node:crypto';
export const forcedSwapEffect = (context) => {
    const { state, actorId, targets } = context;
    const targetPlayerIds = targets?.playerIds || [];
    if (targetPlayerIds.length !== 1) {
        return { ok: false, error: 'Forced Deal requires exactly one target player.' };
    }
    const targetPlayerId = targetPlayerIds[0];
    if (targetPlayerId === actorId) {
        return { ok: false, error: 'You cannot target yourself.' };
    }
    const targetPlayer = state.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) {
        return { ok: false, error: 'Target player not found.' };
    }
    const propertyCardIds = targets?.propertyCardIds || [];
    if (propertyCardIds.length !== 2) {
        return { ok: false, error: 'Forced Deal requires exactly two property cards (one to give, one to take).' };
    }
    // We need to identify which card belongs to whom
    const initiator = state.players.find(p => p.id === actorId);
    if (!initiator)
        return { ok: false, error: 'Initiator not found.' };
    let initiatorCardId;
    let targetCardId;
    for (const cardId of propertyCardIds) {
        const isInInitiator = initiator.properties.some(s => s.cards.some(c => c.id === cardId));
        const isInTarget = targetPlayer.properties.some(s => s.cards.some(c => c.id === cardId));
        if (isInInitiator) {
            if (initiatorCardId)
                return { ok: false, error: 'You selected more than one of your own properties.' };
            initiatorCardId = cardId;
            // Check if it's in a complete set
            const set = initiator.properties.find(s => s.cards.some(c => c.id === cardId));
            if (set?.isComplete)
                return { ok: false, error: 'You cannot swap a card from a complete set.' };
        }
        else if (isInTarget) {
            if (targetCardId)
                return { ok: false, error: 'You selected more than one of the target\'s properties.' };
            targetCardId = cardId;
            // Check if it's in a complete set
            const set = targetPlayer.properties.find(s => s.cards.some(c => c.id === cardId));
            if (set?.isComplete)
                return { ok: false, error: 'You cannot take a card from a complete set.' };
        }
        else {
            return { ok: false, error: `Card ${cardId} does not belong to either player.` };
        }
    }
    if (!initiatorCardId || !targetCardId) {
        return { ok: false, error: 'You must select one of your properties and one of the target\'s properties.' };
    }
    const newInteraction = {
        interactionId: randomUUID(),
        interactionType: 'forced-swap',
        initiatorPlayerId: actorId,
        targetPlayerIds: [targetPlayerId],
        targetPropertyCardId: targetCardId,
        initiatorPropertyCardId: initiatorCardId,
        requiredResponseType: 'none',
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
