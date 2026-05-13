import { randomUUID } from 'node:crypto';
import { appendLogToState } from '../logger.js';
export const debtCollectionEffect = (context) => {
    const { state, actorId, targets } = context;
    if (!targets?.playerIds || targets.playerIds.length === 0) {
        return { ok: false, error: 'Debt collector requires a target player' };
    }
    const targetPlayerId = targets.playerIds[0];
    const newInteraction = {
        interactionId: randomUUID(),
        interactionType: 'payment',
        initiatorPlayerId: actorId,
        targetPlayerIds: [targetPlayerId],
        amountDue: 5,
        requiredResponseType: 'payment',
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        canBeCountered: true
    };
    const nextState = {
        ...state,
        activeInteractions: [...state.activeInteractions, newInteraction]
    };
    const player = state.players.find(p => p.id === actorId);
    const target = state.players.find(p => p.id === targetPlayerId);
    appendLogToState(nextState, {
        type: 'payment',
        actorPlayerId: actorId,
        targetPlayerId: targetPlayerId,
        message: `${player?.name || 'Someone'} charged 5M from ${target?.name || 'Someone'} using Debt Collector`,
    });
    return {
        ok: true,
        state: nextState
    };
};
