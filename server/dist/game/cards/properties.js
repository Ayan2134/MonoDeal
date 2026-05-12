/**
 * PROPERTY CARD SEEDS (28 cards)
 *
 * Official Monopoly Deal property distribution:
 * - Brown: 2 cards
 * - Light Blue: 3 cards
 * - Pink: 3 cards
 * - Orange: 3 cards
 * - Red: 3 cards
 * - Yellow: 3 cards
 * - Green: 3 cards
 * - Dark Blue: 2 cards
 * - Railroad: 4 cards
 * - Utility: 2 cards
 */
import { CardType, PropertyColor } from '../types.js';
import { PROPERTY_CONFIGS } from './propertyConfig.js';
/** Human-readable property names per color */
const PROPERTY_NAMES = {
    [PropertyColor.Brown]: ['Mediterranean Avenue', 'Baltic Avenue'],
    [PropertyColor.LightBlue]: ['Oriental Avenue', 'Vermont Avenue', 'Connecticut Avenue'],
    [PropertyColor.Pink]: ['St. Charles Place', 'States Avenue', 'Virginia Avenue'],
    [PropertyColor.Orange]: ['St. James Place', 'Tennessee Avenue', 'New York Avenue'],
    [PropertyColor.Red]: ['Kentucky Avenue', 'Indiana Avenue', 'Illinois Avenue'],
    [PropertyColor.Yellow]: ['Atlantic Avenue', 'Ventnor Avenue', 'Marvin Gardens'],
    [PropertyColor.Green]: ['Pacific Avenue', 'North Carolina Avenue', 'Pennsylvania Avenue'],
    [PropertyColor.DarkBlue]: ['Park Place', 'Boardwalk'],
    [PropertyColor.Rail]: ['Reading Railroad', 'Pennsylvania Railroad', 'B&O Railroad', 'Short Line'],
    [PropertyColor.Utility]: ['Electric Company', 'Water Works'],
};
function generatePropertySeeds() {
    const seeds = [];
    for (const color of Object.values(PropertyColor)) {
        const config = PROPERTY_CONFIGS[color];
        const names = PROPERTY_NAMES[color];
        for (let i = 0; i < config.setSize; i++) {
            seeds.push({
                type: CardType.Property,
                name: names[i] ?? `${color} ${i + 1}`,
                color,
                value: config.cardValue,
                seedId: `prop-${color}-${i + 1}`,
            });
        }
    }
    return seeds;
}
export const PROPERTY_SEEDS = generatePropertySeeds();
