/**
 * ACTION CARD SEEDS (34 cards)
 *
 * Official Monopoly Deal action distribution:
 * - 10× Pass Go (value 1)
 * - 2× Deal Breaker (value 5)
 * - 3× Just Say No (value 4)
 * - 3× Sly Deal (value 3)
 * - 4× Forced Deal (value 3)
 * - 3× Debt Collector (value 3)
 * - 3× It's My Birthday (value 2)
 * - 3× House (value 3)
 * - 3× Hotel (value 4)
 * - 2× Double The Rent (value 1)
 *
 * NOTE: Rent cards (13) are in rents.ts, not here.
 */
import { CardType } from '../types.js';
function repeatAction(name, actionId, category, value, count, extra) {
    return Array.from({ length: count }, (_, i) => ({
        type: CardType.Action,
        name,
        actionId,
        actionCategory: category,
        value,
        seedId: `action-${actionId}-${i + 1}`,
        ...extra,
    }));
}
export const ACTION_SEEDS = [
    // Pass Go — draw 2 extra cards
    ...repeatAction('Pass Go', 'pass-go', 'utility', 1, 10),
    // Deal Breaker — steal a complete property set
    ...repeatAction('Deal Breaker', 'deal-breaker', 'property', 5, 2),
    // Just Say No — counter any action card
    ...repeatAction('Just Say No', 'just-say-no', 'counter', 4, 3),
    // Sly Deal — steal a single property from an opponent
    ...repeatAction('Sly Deal', 'sly-deal', 'property', 3, 3),
    // Forced Deal — swap one of your properties for one of theirs
    ...repeatAction('Forced Deal', 'forced-deal', 'property', 3, 4),
    // Debt Collector — charge one player 5M
    ...repeatAction('Debt Collector', 'debt-collector', 'payment', 3, 3),
    // It's My Birthday — charge all players 2M
    ...repeatAction("It's My Birthday", 'birthday', 'payment', 2, 3),
    // House — place on a complete set for +3M rent
    ...repeatAction('House', 'house', 'building', 3, 3, { attachable: true }),
    // Hotel — place on a complete set that already has a house for +4M rent
    ...repeatAction('Hotel', 'hotel', 'building', 4, 3, { attachable: true }),
    // Double The Rent — play with a rent card to double the amount (costs 1 extra action)
    ...repeatAction('Double The Rent', 'double-the-rent', 'modifier', 1, 2, { modifierTarget: 'rent' }),
];
