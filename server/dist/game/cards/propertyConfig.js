/**
 * PROPERTY CONFIG REGISTRY
 *
 * Single source of truth for all property set metadata in Monopoly Deal.
 * Used by:
 * - Card seed generation (properties.ts)
 * - Rent calculation (rentCalculation.ts)
 * - Set completion validation
 */
import { PropertyColor } from '../types.js';
export const HOUSE_BONUS = 3;
export const HOTEL_BONUS = 4;
export const PROPERTY_CONFIGS = {
    [PropertyColor.Brown]: {
        color: PropertyColor.Brown,
        setSize: 2,
        rentProgression: [1, 2],
        cardValue: 1,
        houseBonusEligible: true,
    },
    [PropertyColor.LightBlue]: {
        color: PropertyColor.LightBlue,
        setSize: 3,
        rentProgression: [1, 2, 3],
        cardValue: 1,
        houseBonusEligible: true,
    },
    [PropertyColor.Pink]: {
        color: PropertyColor.Pink,
        setSize: 3,
        rentProgression: [1, 2, 4],
        cardValue: 2,
        houseBonusEligible: true,
    },
    [PropertyColor.Orange]: {
        color: PropertyColor.Orange,
        setSize: 3,
        rentProgression: [1, 3, 5],
        cardValue: 2,
        houseBonusEligible: true,
    },
    [PropertyColor.Red]: {
        color: PropertyColor.Red,
        setSize: 3,
        rentProgression: [2, 3, 6],
        cardValue: 3,
        houseBonusEligible: true,
    },
    [PropertyColor.Yellow]: {
        color: PropertyColor.Yellow,
        setSize: 3,
        rentProgression: [2, 4, 6],
        cardValue: 3,
        houseBonusEligible: true,
    },
    [PropertyColor.Green]: {
        color: PropertyColor.Green,
        setSize: 3,
        rentProgression: [2, 4, 7],
        cardValue: 4,
        houseBonusEligible: true,
    },
    [PropertyColor.DarkBlue]: {
        color: PropertyColor.DarkBlue,
        setSize: 2,
        rentProgression: [3, 8],
        cardValue: 4,
        houseBonusEligible: true,
    },
    [PropertyColor.Rail]: {
        color: PropertyColor.Rail,
        setSize: 4,
        rentProgression: [1, 2, 3, 4],
        cardValue: 2,
        houseBonusEligible: false,
    },
    [PropertyColor.Utility]: {
        color: PropertyColor.Utility,
        setSize: 2,
        rentProgression: [1, 2],
        cardValue: 2,
        houseBonusEligible: false,
    },
};
/** Get the set size for a given property color */
export function getSetSize(color) {
    return PROPERTY_CONFIGS[color].setSize;
}
/** Get the rent for a given property color at a given count */
export function getRentForCount(color, count) {
    const config = PROPERTY_CONFIGS[color];
    const effectiveCount = Math.min(count, config.rentProgression.length);
    return config.rentProgression[effectiveCount - 1] ?? 0;
}
