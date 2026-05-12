import { randomUUID } from 'node:crypto';
export const birthdayCollectionEffect = (context) => {
    const { state, actorId } = context;
    const targetPlayerIds = state.players.filter(p => p.id !== actorId).map(p => p.id);
    if (targetPlayerIds.length === 0) {
        return { ok: true, state };
    }
    const newInteraction = {
        interactionId: randomUUID(),
        interactionType: 'payment',
        initiatorPlayerId: actorId,
        targetPlayerIds,
        amountDue: 2, // It's My Birthday is 2M from everyone
        requiredResponseType: 'payment',
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
