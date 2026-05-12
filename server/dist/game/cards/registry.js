/**
 * CARD REGISTRY
 *
 * Central module that combines all card seed modules into the complete
 * 106-card official Monopoly Deal deck. Includes a self-validating
 * utility that asserts deck correctness at import time.
 */
import { CardType } from '../types.js';
import { PROPERTY_SEEDS } from './properties.js';
import { WILDCARD_SEEDS } from './wildcards.js';
import { RENT_SEEDS } from './rents.js';
import { ACTION_SEEDS } from './actions.js';
import { MONEY_SEEDS } from './money.js';
/**
 * The complete 106-card Monopoly Deal deck.
 */
export const ALL_CARD_SEEDS = [
    ...PROPERTY_SEEDS,
    ...WILDCARD_SEEDS,
    ...RENT_SEEDS,
    ...ACTION_SEEDS,
    ...MONEY_SEEDS,
];
/**
 * Validate the deck has the correct composition.
 * Throws an error if any check fails.
 */
export function validateDeck(seeds = ALL_CARD_SEEDS) {
    // Total count
    if (seeds.length !== 106) {
        throw new Error(`Deck validation failed: expected 106 cards, got ${seeds.length}`);
    }
    // Check for duplicate seedIds
    const ids = new Set();
    for (const seed of seeds) {
        if (ids.has(seed.seedId)) {
            throw new Error(`Deck validation failed: duplicate seedId "${seed.seedId}"`);
        }
        ids.add(seed.seedId);
    }
    // Count by type
    const byCounts = {};
    for (const seed of seeds) {
        byCounts[seed.type] = (byCounts[seed.type] ?? 0) + 1;
    }
    const expected = {
        [CardType.Property]: 28,
        [CardType.Wildcard]: 11,
        [CardType.Action]: 47, // 34 actions + 13 rents (both are CardType.Action)
        [CardType.Money]: 20,
    };
    for (const [type, count] of Object.entries(expected)) {
        if ((byCounts[type] ?? 0) !== count) {
            throw new Error(`Deck validation failed: expected ${count} ${type} cards, got ${byCounts[type] ?? 0}`);
        }
    }
}
// Self-validate on module load in development
try {
    validateDeck();
}
catch (e) {
    console.error('[CardRegistry]', e.message);
}
