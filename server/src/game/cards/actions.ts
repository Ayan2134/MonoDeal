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
import type { CardSeed } from './registry.js';

type ActionCategory = 'payment' | 'property' | 'counter' | 'utility' | 'modifier' | 'building';

function repeatAction(
  name: string,
  actionId: string,
  category: ActionCategory,
  value: number,
  count: number,
  extra?: Partial<CardSeed>,
): CardSeed[] {
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

export const ACTION_SEEDS: CardSeed[] = [
  // Pass Go — draw 2 extra cards
  ...repeatAction('Pass Go', 'pass-go', 'utility', 1, 10, {
    metadata: {
      description: "Draw 2 extra cards.",
      rulesText: "Draw two cards from the Draw Pile. Counts as 1 action."
    }
  }),

  // Deal Breaker — steal a complete property set
  ...repeatAction('Deal Breaker', 'deal-breaker', 'property', 5, 2, {
    metadata: {
      description: "Steal a complete set of properties from any player.",
      rulesText: "Includes any Houses and Hotels on that set. You cannot steal a set if it would make you have more than the required number of cards for that set color."
    }
  }),

  // Just Say No — counter any action card
  ...repeatAction('Just Say No', 'just-say-no', 'counter', 4, 3, {
    metadata: {
      description: "Use any time an action card is played against you.",
      rulesText: "Can be played even if it is not your turn. If another player plays a 'Just Say No' against yours, you can play another 'Just Say No' to counter it!"
    }
  }),

  // Sly Deal — steal a single property from an opponent
  ...repeatAction('Sly Deal', 'sly-deal', 'property', 3, 3, {
    metadata: {
      description: "Steal a property from any player.",
      rulesText: "Cannot be used to steal a card from a COMPLETED set. Counts as 1 action."
    }
  }),

  // Forced Deal — swap one of your properties for one of theirs
  ...repeatAction('Forced Deal', 'forced-deal', 'property', 3, 4, {
    metadata: {
      description: "Swap any property with another player.",
      rulesText: "You give one of your properties to another player and take one of theirs. Cannot be used on a card in a COMPLETED set. Counts as 1 action."
    }
  }),

  // Debt Collector — charge one player 5M
  ...repeatAction('Debt Collector', 'debt-collector', 'payment', 3, 3, {
    metadata: {
      description: "Force any player to pay you 5M.",
      rulesText: "Target player must pay using cards from their bank or properties from their board. Change is not given. Counts as 1 action."
    }
  }),

  // It's My Birthday — charge all players 2M
  ...repeatAction("It's My Birthday", 'birthday', 'payment', 2, 3, {
    metadata: {
      description: "All players give you 2M.",
      rulesText: "Every opponent must pay you 2M. Counts as 1 action."
    }
  }),

  // House — place on a complete set for +3M rent
  ...repeatAction('House', 'house', 'building', 3, 3, { 
    attachable: true,
    metadata: {
      description: "Add to any completed set to add 3M to the rent.",
      rulesText: "Can only be played on a COMPLETED set. Only one House per set. Cannot be played on Railroads or Utilities."
    }
  }),

  // Hotel — place on a complete set that already has a house for +4M rent
  ...repeatAction('Hotel', 'hotel', 'building', 4, 3, { 
    attachable: true,
    metadata: {
      description: "Add to any completed set that already has a House to add 4M to the rent.",
      rulesText: "Can only be played on a set that already has a House. Only one Hotel per set."
    }
  }),

  // Double The Rent — play with a rent card to double the amount (costs 1 extra action)
  ...repeatAction('Double The Rent', 'double-the-rent', 'modifier', 2, 2, { 
    modifierTarget: 'rent',
    metadata: {
      description: "Double the rent amount of a Rent card.",
      rulesText: "Must be played with a Rent card. Doubles the total rent for that action. Multiple Double The Rent cards can be played together!"
    }
  }),
];
