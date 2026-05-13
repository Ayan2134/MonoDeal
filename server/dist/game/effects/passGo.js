import { drawMultipleCards } from '../deck.js';
import { appendLogToState } from '../logger.js';
export const passGoEffect = (context) => {
    const { state, actorId } = context;
    const player = state.players.find(p => p.id === actorId);
    if (!player) {
        return { ok: false, error: 'Player not found' };
    }
    // Pass Go draws 2 cards
    const drawResult = drawMultipleCards({ deck: state.deck, discardPile: state.discardPile }, 2);
    player.hand.push(...drawResult.cards);
    appendLogToState(state, {
        type: 'draw',
        actorPlayerId: actorId,
        message: `${player.name} drew 2 cards using Pass Go`,
    });
    return {
        ok: true,
        state: {
            ...state,
            deck: drawResult.deck,
            discardPile: drawResult.discardPile,
        }
    };
};
