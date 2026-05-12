/**
 * MONEY CARD SEEDS (20 cards)
 *
 * Official Monopoly Deal money distribution:
 * - 6× 1M
 * - 5× 2M
 * - 3× 3M
 * - 3× 4M
 * - 2× 5M
 * - 1× 10M
 */

import { CardType } from '../types.js';
import type { CardSeed } from './registry.js';

function repeatMoney(value: number, count: number): CardSeed[] {
  return Array.from({ length: count }, (_, i) => ({
    type: CardType.Money,
    name: `${value}M`,
    value,
    seedId: `money-${value}m-${i + 1}`,
    metadata: {
      description: `Monetary value: ${value}M`,
      instructions: "Add to your bank to pay for rent or actions.",
    }
  }));
}

export const MONEY_SEEDS: CardSeed[] = [
  ...repeatMoney(1, 6),
  ...repeatMoney(2, 5),
  ...repeatMoney(3, 3),
  ...repeatMoney(4, 3),
  ...repeatMoney(5, 2),
  ...repeatMoney(10, 1),
];
