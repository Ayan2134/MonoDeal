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
function dualRent(name, colors, seedIdBase, count) {
    return Array.from({ length: count }, (_, i) => ({
        type: CardType.Action,
        name,
        actionId: 'rent',
        actionCategory: 'payment',
        value: 1,
        supportedColors: colors,
        affectsAllPlayers: true,
        wildcardRent: false,
        seedId: `${seedIdBase}-${i + 1}`,
    }));
}
export const RENT_SEEDS = [
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
        actionCategory: 'payment',
        value: 3,
        wildcardRent: true,
        affectsAllPlayers: false,
        seedId: 'rent-wild-1',
    },
    {
        type: CardType.Action,
        name: 'Wild Rent',
        actionId: 'rent',
        actionCategory: 'payment',
        value: 3,
        wildcardRent: true,
        affectsAllPlayers: false,
        seedId: 'rent-wild-2',
    },
    {
        type: CardType.Action,
        name: 'Wild Rent',
        actionId: 'rent',
        actionCategory: 'payment',
        value: 3,
        wildcardRent: true,
        affectsAllPlayers: false,
        seedId: 'rent-wild-3',
    },
];
