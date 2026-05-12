import { drawMultipleCards } from './deck.js';
import { TurnPhase } from './state.js';
const DRAW_CARDS_PER_TURN = 2;
const MAX_ACTIONS_PER_TURN = 3;
function buildTurnUpdate(state) {
    return {
        roomId: state.roomId,
        currentTurnPlayerId: state.currentTurnPlayerId,
        actionsRemaining: state.actionsRemaining,
        turnPhase: state.turnPhase,
    };
}
export { buildTurnUpdate };
function findNextTurnPlayerId(state) {
    if (!state.currentTurnPlayerId) {
        return state.players[0]?.id ?? null;
    }
    const currentIndex = state.players.findIndex((player) => player.id === state.currentTurnPlayerId);
    if (currentIndex < 0) {
        return state.players[0]?.id ?? null;
    }
    for (let offset = 1; offset <= state.players.length; offset += 1) {
        const index = (currentIndex + offset) % state.players.length;
        const candidate = state.players[index];
        if (candidate?.status === 'connected') {
            return candidate.id;
        }
    }
    return state.players[currentIndex]?.id ?? null;
}
// Draw phase: current player draws two cards and moves into action phase.
export function startTurn(state, playerId) {
    if (!state.gameStarted) {
        return { ok: false, error: 'Game has not started.' };
    }
    if (state.gameEnded) {
        return { ok: false, error: 'Game has ended.' };
    }
    if (state.responseWindow.isOpen) {
        return { ok: false, error: 'Wait for the response window to resolve.' };
    }
    if (state.currentTurnPlayerId !== playerId) {
        return { ok: false, error: 'It is not your turn.' };
    }
    if (state.turnPhase !== TurnPhase.Draw) {
        return { ok: false, error: 'Turn is already in progress.' };
    }
    const drawResult = drawMultipleCards({ deck: state.deck, discardPile: state.discardPile }, DRAW_CARDS_PER_TURN);
    const updatedPlayers = state.players.map((player) => {
        if (player.id !== playerId) {
            return player;
        }
        return {
            ...player,
            hand: [...player.hand, ...drawResult.cards],
        };
    });
    const nextState = {
        ...state,
        players: updatedPlayers,
        deck: drawResult.deck,
        discardPile: drawResult.discardPile,
        actionsRemaining: MAX_ACTIONS_PER_TURN,
        turnPhase: TurnPhase.Action,
    };
    return { ok: true, gameState: nextState, turn: buildTurnUpdate(nextState) };
}
// End phase: current player ends turn and advances to the next player.
export function endTurn(state, playerId, discardCardIds) {
    if (!state.gameStarted) {
        return { ok: false, error: 'Game has not started.' };
    }
    if (state.gameEnded) {
        return { ok: false, error: 'Game has ended.' };
    }
    if (state.responseWindow.isOpen) {
        return { ok: false, error: 'Wait for the response window to resolve.' };
    }
    if (state.currentTurnPlayerId !== playerId) {
        return { ok: false, error: 'It is not your turn.' };
    }
    if (state.turnPhase === TurnPhase.Draw) {
        return { ok: false, error: 'Draw phase must complete before ending turn.' };
    }
    const player = state.players.find(p => p.id === playerId);
    if (!player) {
        return { ok: false, error: 'Player not found.' };
    }
    const maxHandSize = 7;
    const currentHandSize = player.hand.length;
    if (currentHandSize > maxHandSize) {
        const excessCount = currentHandSize - maxHandSize;
        if (!discardCardIds || discardCardIds.length !== excessCount) {
            return { ok: false, error: `You must discard exactly ${excessCount} cards to end your turn.` };
        }
        // Validate that the player owns all discarded cards
        const ownsAll = discardCardIds.every(id => player.hand.some(c => c.id === id));
        if (!ownsAll) {
            return { ok: false, error: 'You do not own all the cards you are trying to discard.' };
        }
        // Apply discards
        const updatedHand = player.hand.filter(c => !discardCardIds.includes(c.id));
        const discardedCards = player.hand.filter(c => discardCardIds.includes(c.id));
        state.players = state.players.map(p => {
            if (p.id === playerId) {
                return { ...p, hand: updatedHand };
            }
            return p;
        });
        state.discardPile.push(...discardedCards);
    }
    else if (discardCardIds && discardCardIds.length > 0) {
        return { ok: false, error: 'You cannot discard cards unless you exceed the hand limit.' };
    }
    const nextPlayerId = findNextTurnPlayerId(state);
    const nextState = {
        ...state,
        currentTurnPlayerId: nextPlayerId,
        actionsRemaining: MAX_ACTIONS_PER_TURN,
        turnPhase: TurnPhase.Draw,
    };
    return { ok: true, gameState: nextState, turn: buildTurnUpdate(nextState) };
}
// Action tracking helper for future card effects and validation.
export function consumeAction(state, playerId, count = 1) {
    if (!state.gameStarted) {
        return { ok: false, error: 'Game has not started.' };
    }
    if (state.gameEnded) {
        return { ok: false, error: 'Game has ended.' };
    }
    if (state.currentTurnPlayerId !== playerId) {
        return { ok: false, error: 'It is not your turn.' };
    }
    if (state.turnPhase !== TurnPhase.Action) {
        return { ok: false, error: 'Actions are only allowed during the action phase.' };
    }
    if (state.actionsRemaining < count) {
        return { ok: false, error: 'No actions remaining.' };
    }
    const nextState = {
        ...state,
        actionsRemaining: state.actionsRemaining - count,
    };
    return { ok: true, gameState: nextState, turn: buildTurnUpdate(nextState) };
}
