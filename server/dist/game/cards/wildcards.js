/**
 * WILDCARD PROPERTY CARD SEEDS (11 cards)
 *
 * Official Monopoly Deal wildcard distribution:
 * - 1× Light Blue / Brown (value 1)
 * - 1× Pink / Orange (value 2)
 * - 1× Light Blue / Railroad (value 4)
 * - 1× Dark Blue / Green (value 4)
 * - 1× Railroad / Green (value 4)
 * - 1× Red / Yellow (value 3)
 * - 1× Utility / Railroad (value 2)
 * - 2× Multicolor Wild (value 0)
 */
import { CardType, PropertyColor } from '../types.js';
const ALL_COLORS = Object.values(PropertyColor);
export const WILDCARD_SEEDS = [
    {
        type: CardType.Wildcard,
        name: 'Wild Light Blue/Brown',
        colors: [PropertyColor.LightBlue, PropertyColor.Brown],
        value: 1,
        seedId: 'wild-lightblue-brown-1',
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Pink/Orange',
        colors: [PropertyColor.Pink, PropertyColor.Orange],
        value: 2,
        seedId: 'wild-pink-orange-1',
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Pink/Orange',
        colors: [PropertyColor.Pink, PropertyColor.Orange],
        value: 2,
        seedId: 'wild-pink-orange-2',
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Light Blue/Railroad',
        colors: [PropertyColor.LightBlue, PropertyColor.Rail],
        value: 4,
        seedId: 'wild-lightblue-rail-1',
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Dark Blue/Green',
        colors: [PropertyColor.DarkBlue, PropertyColor.Green],
        value: 4,
        seedId: 'wild-darkblue-green-1',
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Railroad/Green',
        colors: [PropertyColor.Rail, PropertyColor.Green],
        value: 4,
        seedId: 'wild-rail-green-1',
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Red/Yellow',
        colors: [PropertyColor.Red, PropertyColor.Yellow],
        value: 3,
        seedId: 'wild-red-yellow-1',
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Red/Yellow',
        colors: [PropertyColor.Red, PropertyColor.Yellow],
        value: 3,
        seedId: 'wild-red-yellow-2',
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Utility/Railroad',
        colors: [PropertyColor.Utility, PropertyColor.Rail],
        value: 2,
        seedId: 'wild-utility-rail-1',
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Property',
        colors: ALL_COLORS,
        value: 0,
        seedId: 'wild-any-1',
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Property',
        colors: ALL_COLORS,
        value: 0,
        seedId: 'wild-any-2',
    },
];
