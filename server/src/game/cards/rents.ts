/**
 * RENT CARD SEEDS (13 cards)
 *
 * Official Monopoly Deal rent distribution:
 * - 2× Brown / Light Blue Rent (value 1)
 * - 2× Pink / Orange Rent (value 1)
 * - 2× Red / Yellow Rent (value 1)
 * - 2× Green / Dark Blue Rent (value 1)
 * - 2× Railroad / Utility Rent (value 1)
 * - 3× Wild Rent (value 3, targets single player)
 */

import { CardType, PropertyColor } from '../types.js';
import type { CardSeed } from './registry.js';

function dualRent(
  name: string,
  colors: [PropertyColor, PropertyColor],
  seedIdBase: string,
  count: number,
): CardSeed[] {
  return Array.from({ length: count }, (_, i) => ({
    type: CardType.Action,
    name,
    actionId: 'rent',
    actionCategory: 'payment' as const,
    value: 1,
    supportedColors: colors,
    affectsAllPlayers: true,
    wildcardRent: false,
    seedId: `${seedIdBase}-${i + 1}`,
    metadata: {
      description: `Charge all players rent for your ${colors[0].replace('-', ' ')} or ${colors[1].replace('-', ' ')} properties.`,
      rulesText: "You must own at least one property of the chosen color to play this card. All opponents must pay you."
    }
  }));
}

export const RENT_SEEDS: CardSeed[] = [
  ...dualRent('Rent (Brown/Light Blue)', [PropertyColor.Brown, PropertyColor.LightBlue], 'rent-brown-lightblue', 2),
  ...dualRent('Rent (Pink/Orange)', [PropertyColor.Pink, PropertyColor.Orange], 'rent-pink-orange', 2),
  ...dualRent('Rent (Red/Yellow)', [PropertyColor.Red, PropertyColor.Yellow], 'rent-red-yellow', 2),
  ...dualRent('Rent (Green/Dark Blue)', [PropertyColor.Green, PropertyColor.DarkBlue], 'rent-green-darkblue', 2),
  ...dualRent('Rent (Railroad/Utility)', [PropertyColor.Rail, PropertyColor.Utility], 'rent-rail-utility', 2),

  // Wild rent cards — target one player, any color
  {
    type: CardType.Action,
    name: 'Wild Rent',
    actionId: 'rent',
    actionCategory: 'payment' as const,
    value: 3,
    wildcardRent: true,
    affectsAllPlayers: false,
    seedId: 'rent-wild-1',
    metadata: {
      description: "Charge any ONE player rent for any property color you own.",
      rulesText: "You can choose any property color you currently have on the board. Target only ONE player to pay."
    }
  },
  {
    type: CardType.Action,
    name: 'Wild Rent',
    actionId: 'rent',
    actionCategory: 'payment' as const,
    value: 3,
    wildcardRent: true,
    affectsAllPlayers: false,
    seedId: 'rent-wild-2',
    metadata: {
      description: "Charge any ONE player rent for any property color you own.",
      rulesText: "You can choose any property color you currently have on the board. Target only ONE player to pay."
    }
  },
  {
    type: CardType.Action,
    name: 'Wild Rent',
    actionId: 'rent',
    actionCategory: 'payment' as const,
    value: 3,
    wildcardRent: true,
    affectsAllPlayers: false,
    seedId: 'rent-wild-3',
    metadata: {
      description: "Charge any ONE player rent for any property color you own.",
      rulesText: "You can choose any property color you currently have on the board. Target only ONE player to pay."
    }
  },
];
