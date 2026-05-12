import { drawMultipleCards } from '../deck.js';
export const passGoEffect = (context) => {
    const { state, actorId } = context;
    const player = state.players.find(p => p.id === actorId);
    if (!player) {
        return { ok: false, error: 'Player not found' };
    }
    // Pass Go draws 2 cards
    const drawResult = drawMultipleCards({ deck: state.deck, discardPile: state.discardPile }, 2);
    player.hand.push(...drawResult.cards);
    return {
        ok: true,
        state: {
            ...state,
            deck: drawResult.deck,
            discardPile: drawResult.discardPile,
        }
    };
};
