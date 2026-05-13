/**
 * DECK BUILDER
 *
 * Creates runtime Card instances from the card seed registry.
 * Handles shuffling, drawing, and deck refilling from the discard pile.
 */
import { ALL_CARD_SEEDS } from './cards/registry.js';
import { CardType } from './types.js';
function createCardFromSeed(seed) {
    const id = seed.seedId;
    const metadata = seed.metadata;
    if (seed.type === CardType.Property) {
        if (!seed.color)
            throw new Error(`Property card "${seed.name}" missing color.`);
        if (seed.value === undefined)
            throw new Error(`Property card "${seed.name}" missing value.`);
        return { id, type: seed.type, name: seed.name, color: seed.color, value: seed.value, metadata };
    }
    if (seed.type === CardType.Money) {
        if (typeof seed.value !== 'number')
            throw new Error(`Money card "${seed.name}" missing value.`);
        return { id, type: seed.type, name: seed.name, value: seed.value, metadata };
    }
    if (seed.type === CardType.Action) {
        if (!seed.actionId)
            throw new Error(`Action card "${seed.name}" missing actionId.`);
        if (seed.value === undefined)
            throw new Error(`Action card "${seed.name}" missing value.`);
        return {
            id,
            type: seed.type,
            name: seed.name,
            actionId: seed.actionId,
            value: seed.value,
            actionCategory: seed.actionCategory,
            supportedColors: seed.supportedColors,
            affectsAllPlayers: seed.affectsAllPlayers,
            wildcardRent: seed.wildcardRent,
            attachable: seed.attachable,
            modifierTarget: seed.modifierTarget,
            metadata,
        };
    }
    // Wildcard
    if (!seed.colors || seed.colors.length === 0)
        throw new Error(`Wildcard card "${seed.name}" missing colors.`);
    if (seed.value === undefined)
        throw new Error(`Wildcard card "${seed.name}" missing value.`);
    return { id, type: seed.type, name: seed.name, colors: seed.colors, value: seed.value, metadata };
}
export function createDeck() {
    return ALL_CARD_SEEDS.map(createCardFromSeed);
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
