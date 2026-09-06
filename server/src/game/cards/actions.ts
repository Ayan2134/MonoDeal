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
  ...repeatAction('PASS GO', 'pass-go', 'utility', 1, 10, {
    metadata: {
      description: "Draw 2 cards.",
      instructions: "Play into center to use.",
      gameplayDescription: "Use this card to refill your hand. It's often best played at the start of your turn to maximize your options.",
      rulesText: "Draw two cards from the Draw Pile. Counts as 1 action.",
      officialRulesText: "Play this card to draw 2 extra cards from the draw pile. This counts as 1 of your 3 plays. You can play more than one Pass Go card per turn."
    }
  }),

  // Deal Breaker — steal a complete property set
  ...repeatAction('DEAL BREAKER', 'deal-breaker', 'property', 5, 2, {
    metadata: {
      description: "Steal a complete set of properties from any player. (Includes any buildings.)",
      instructions: "Play into center to use.",
      gameplayDescription: "The most powerful card in the game. Target an opponent's completed property set and move it entirely to your board.",
      rulesText: "Includes any Houses and Hotels on that set. You cannot steal a set if it would make you have more than the required number of cards for that set color.",
      officialRulesText: "Steal a complete set of properties from any player. (Includes any buildings). Play into the center to use."
    }
  }),

  // Just Say No — counter any action card
  ...repeatAction('JUST SAY NO', 'just-say-no', 'counter', 4, 3, {
    metadata: {
      description: "Use anytime when an Action card is played against you. Say NO!",
      instructions: "Play into center to use.",
      gameplayDescription: "Your primary defense against Deal Breakers, Sly Deals, and Rent. Keep one handy!",
      rulesText: "Can be played even if it is not your turn. If another player plays a 'Just Say No' against yours, you can play another 'Just Say No' to counter it!",
      officialRulesText: "Use this card at any time to cancel the effect when another player plays any Action card against you. If that player has another Just Say No card, they can use it to cancel yours... sorry!"
    }
  }),

  // Sly Deal — steal a single property from an opponent
  ...repeatAction('SLY DEAL', 'sly-deal', 'property', 3, 3, {
    metadata: {
      description: "Steal a property from any player. Cannot steal from a complete set.",
      instructions: "Play into center to use.",
      gameplayDescription: "Target a single property card. Great for breaking up almost-complete sets or completing your own.",
      rulesText: "Cannot be used to steal a card from a COMPLETED set. Counts as 1 action.",
      officialRulesText: "Steal a property from any other player and add it to your property collection. You cannot steal a card from a full set of properties."
    }
  }),

  // Forced Deal — swap one of your properties for one of theirs
  ...repeatAction('FORCED DEAL', 'forced-deal', 'property', 3, 4, {
    metadata: {
      description: "Swap a property you own for any property another player owns. Cannot swap from a complete set.",
      instructions: "Play into center to use.",
      gameplayDescription: "Trade one of your less valuable properties for a piece you desperately need.",
      rulesText: "You give one of your properties to another player and take one of theirs. Cannot be used on a card in a COMPLETED set. Counts as 1 action.",
      officialRulesText: "Swap any property card with another player. Cannot be used to swap cards from a full set of properties."
    }
  }),

  // Debt Collector — charge one player 5M
  ...repeatAction('DEBT COLLECTOR', 'debt-collector', 'payment', 3, 3, {
    metadata: {
      description: "Force 1 player to pay you 5M.",
      instructions: "Play into center to use.",
      gameplayDescription: "Target a single player to pay up. They must pay with bank money or properties from their board.",
      rulesText: "Target player must pay using cards from their bank or properties from their board. Change is not given. Counts as 1 action.",
      officialRulesText: "Force any one player to pay you 5M. Play into the center to use."
    }
  }),

  // It's My Birthday — charge all players 2M
  ...repeatAction("IT'S MY BIRTHDAY", 'birthday', 'payment', 2, 3, {
    metadata: {
      description: "All players give you 2M as a gift.",
      instructions: "Play into center to use.",
      gameplayDescription: "Everyone owes you a gift! Can be devastating if played when opponents have low cash.",
      rulesText: "Every opponent must pay you 2M. Counts as 1 action.",
      officialRulesText: "All players must give you 2M as a 'gift'. Play into the center to use."
    }
  }),

  // House — place on a complete set for +3M rent
  ...repeatAction('HOUSE', 'house', 'building', 3, 3, { 
    attachable: true,
    metadata: {
      description: "Add onto any complete property set you own to add 3M to the rent value.",
      instructions: "Play onto your property set.",
      gameplayDescription: "A massive boost to your rent potential. Must be played on a complete property set.",
      rulesText: "Can only be played on a COMPLETED set. Only one House per set. Cannot be played on Railroads or Utilities.",
      officialRulesText: "Add onto any full set you own to add 3M to the rent value. (Except Railroads and Utilities).",
      attachmentInfo: "Provides a +3M rent bonus. Requires a complete property set."
    }
  }),

  // Hotel — place on a complete set that already has a house for +4M rent
  ...repeatAction('HOTEL', 'hotel', 'building', 4, 3, { 
    attachable: true,
    metadata: {
      description: "Add onto any complete property set you own with a House to add 4M to the rent value.",
      instructions: "Play onto your property set.",
      gameplayDescription: "The ultimate property upgrade. Stacks on top of a House for devastating rent charges.",
      rulesText: "Can only be played on a set that already has a House. Only one Hotel per set.",
      officialRulesText: "Add onto any full set you own that already has a house to add 4M to the rent value. (Except Railroads and Utilities).",
      attachmentInfo: "Provides a +4M rent bonus. Requires a House."
    }
  }),

  // Double The Rent — play with a rent card to double the amount (costs 1 extra action)
  ...repeatAction('DOUBLE THE RENT', 'double-the-rent', 'modifier', 1, 2, { 
    modifierTarget: 'rent',
    metadata: {
      description: "Double the rent on any Rent card played. Can be played with another Double The Rent card.",
      instructions: "Play together with a Rent card.",
      gameplayDescription: "Must be played alongside a standard Rent card to double its charge.",
      rulesText: "Must be played with a Rent card. Doubles the total rent for that action. Multiple Double The Rent cards can be played together!",
      officialRulesText: "Needs to be played with a rent card. Play into the center to use."
    }
  }),
];
