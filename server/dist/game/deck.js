import { starterCards } from './cardData.js';
import { CardType } from './types.js';
const CARD_ID_PREFIX = {
    [CardType.Property]: 'prop',
    [CardType.Money]: 'money',
    [CardType.Action]: 'action',
    [CardType.Wildcard]: 'wild',
};
function buildCardId(type, index) {
    return `${CARD_ID_PREFIX[type]}-${index + 1}`;
}
function createCardFromSeed(seed, index) {
    const id = buildCardId(seed.type, index);
    if (seed.type === CardType.Property) {
        if (!seed.color) {
            throw new Error('Property card missing color.');
        }
        return { id, type: seed.type, name: seed.name, color: seed.color };
    }
    if (seed.type === CardType.Money) {
        if (typeof seed.value !== 'number') {
            throw new Error('Money card missing value.');
        }
        return { id, type: seed.type, name: seed.name, value: seed.value };
    }
    if (seed.type === CardType.Action) {
        if (!seed.actionId) {
            throw new Error('Action card missing actionId.');
        }
        return { id, type: seed.type, name: seed.name, actionId: seed.actionId, value: seed.value };
    }
    if (!seed.colors || seed.colors.length === 0) {
        throw new Error('Wildcard card missing colors.');
    }
    return { id, type: seed.type, name: seed.name, colors: seed.colors };
}
export function createDeck() {
    return starterCards.map((seed, index) => createCardFromSeed(seed, index));
}
export function shuffleDeck(deck, rng = Math.random) {
    // Fisher-Yates shuffle on a copy to keep the function pure.
    const shuffled = [...deck];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(rng() * (index + 1));
        const current = shuffled[index];
        const swap = shuffled[randomIndex];
        shuffled[index] = swap;
        shuffled[randomIndex] = current;
    }
    return shuffled;
}
function refillDeckIfNeeded(deck, discardPile, rng) {
    if (deck.length > 0 || discardPile.length === 0) {
        return { deck, discardPile };
    }
    return {
        deck: shuffleDeck(discardPile, rng),
        discardPile: [],
    };
}
export function drawCard(state, rng = Math.random) {
    const refilled = refillDeckIfNeeded(state.deck, state.discardPile, rng);
    if (refilled.deck.length === 0) {
        return { card: null, deck: refilled.deck, discardPile: refilled.discardPile };
    }
    const [card, ...remainingDeck] = refilled.deck;
    return { card, deck: remainingDeck, discardPile: refilled.discardPile };
}
export function drawMultipleCards(state, count, rng = Math.random) {
    let currentState = { ...state };
    const drawn = [];
    for (let i = 0; i < count; i += 1) {
        const result = drawCard(currentState, rng);
        if (!result.card) {
            break;
        }
        drawn.push(result.card);
        currentState = { deck: result.deck, discardPile: result.discardPile };
    }
    return { cards: drawn, deck: currentState.deck, discardPile: currentState.discardPile };
}
