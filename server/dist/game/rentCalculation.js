/**
 * RENT CALCULATION
 *
 * Calculates rent for a given property color based on the
 * centralized property config registry.
 */
import { PROPERTY_CONFIGS, HOUSE_BONUS, HOTEL_BONUS } from './cards/propertyConfig.js';
export { HOUSE_BONUS, HOTEL_BONUS };
// Re-export RENT_TABLES for backwards compatibility with any code that reads it directly
export const RENT_TABLES = Object.fromEntries(Object.values(PROPERTY_CONFIGS).map(config => [config.color, config.rentProgression]));
export function calculateRent(player, setId, multiplier = 1) {
    const set = player.properties.find(s => s.setId === setId);
    if (!set || set.cards.length === 0) {
        return 0;
    }
    const color = set.color;
    const config = PROPERTY_CONFIGS[color];
    if (!config) {
        return 0; // Should not happen
    }
    // Calculate base rent based on number of properties
    let propertyCount = 0;
    for (const card of set.cards) {
        if (card.type === 'property' || card.type === 'wildcard') {
            propertyCount += 1;
        }
    }
    // Max out property count to the size of the rent table to avoid out of bounds
    const effectiveCount = Math.min(propertyCount, config.rentProgression.length);
    // Array is 0-indexed, so count of 1 is index 0
    let baseRent = config.rentProgression[effectiveCount - 1] ?? 0;
    // Add house/hotel bonuses
    if (set.houseCard) {
        baseRent += HOUSE_BONUS;
    }
    if (set.hotelCard) {
        baseRent += HOTEL_BONUS;
    }
    return baseRent * multiplier;
}
