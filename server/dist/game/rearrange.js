import { moveCardBetweenSets } from './property.js';
import { buildTurnUpdate } from './turn.js';
export function rearrangeProperties(state, input) {
    if (state.currentTurnPlayerId !== input.playerId) {
        return { ok: false, error: 'It is not your turn.' };
    }
    if (state.activeInteractions.length > 0) {
        return { ok: false, error: 'Cannot rearrange properties while interactions are pending.' };
    }
    const playerIndex = state.players.findIndex(p => p.id === input.playerId);
    if (playerIndex === -1)
        return { ok: false, error: 'Player not found.' };
    const player = state.players[playerIndex];
    const result = moveCardBetweenSets(player, input.cardId, input.targetColor, input.targetSetId, state.discardPile);
    if (!result.ok)
        return result;
    const nextState = {
        ...state,
        players: state.players.map((p, idx) => idx === playerIndex ? result.player : p)
    };
    return {
        ok: true,
        gameState: nextState,
        turn: buildTurnUpdate(nextState)
    };
}
