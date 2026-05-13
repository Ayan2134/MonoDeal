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
        metadata: {
            description: "Use as either property color shown. May be moved between sets during your turn.",
            gameplayDescription: "A versatile property that can pivot between two different sets. Great for completing a set unexpectedly.",
            rulesText: "You can move and rearrange this card during your turn. It does not count as an action.",
            officialRulesText: "This card can be used as part of either a Light Blue or Brown property set. You can swap it around on your turn.",
            wildcardInfo: "Provides 1 property value towards either the Light Blue (needs 3) or Brown (needs 2) set."
        }
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Pink/Orange',
        colors: [PropertyColor.Pink, PropertyColor.Orange],
        value: 2,
        seedId: 'wild-pink-orange-1',
        metadata: {
            description: "Use as either property color shown. May be moved between sets during your turn.",
            gameplayDescription: "A versatile property that can pivot between two different sets. Great for completing a set unexpectedly.",
            rulesText: "You can move and rearrange this card during your turn. It does not count as an action.",
            officialRulesText: "This card can be used as part of either a Pink or Orange property set. You can swap it around on your turn.",
            wildcardInfo: "Provides 1 property value towards either the Pink (needs 3) or Orange (needs 3) set."
        }
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Pink/Orange',
        colors: [PropertyColor.Pink, PropertyColor.Orange],
        value: 2,
        seedId: 'wild-pink-orange-2',
        metadata: {
            description: "Use as either property color shown. May be moved between sets during your turn.",
            gameplayDescription: "A versatile property that can pivot between two different sets. Great for completing a set unexpectedly.",
            rulesText: "You can move and rearrange this card during your turn. It does not count as an action.",
            officialRulesText: "This card can be used as part of either a Pink or Orange property set. You can swap it around on your turn.",
            wildcardInfo: "Provides 1 property value towards either the Pink (needs 3) or Orange (needs 3) set."
        }
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Light Blue/Railroad',
        colors: [PropertyColor.LightBlue, PropertyColor.Rail],
        value: 4,
        seedId: 'wild-lightblue-rail-1',
        metadata: {
            description: "Use as either property color shown. May be moved between sets during your turn.",
            gameplayDescription: "A versatile property that can pivot between two different sets. Great for completing a set unexpectedly.",
            rulesText: "You can move and rearrange this card during your turn. It does not count as an action.",
            officialRulesText: "This card can be used as part of either a Light Blue or Railroad property set. You can swap it around on your turn.",
            wildcardInfo: "Provides 1 property value towards either the Light Blue (needs 3) or Railroad (needs 4) set."
        }
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Dark Blue/Green',
        colors: [PropertyColor.DarkBlue, PropertyColor.Green],
        value: 4,
        seedId: 'wild-darkblue-green-1',
        metadata: {
            description: "Use as either property color shown. May be moved between sets during your turn.",
            gameplayDescription: "A versatile property that can pivot between two different sets. Great for completing a set unexpectedly.",
            rulesText: "You can move and rearrange this card during your turn. It does not count as an action.",
            officialRulesText: "This card can be used as part of either a Dark Blue or Green property set. You can swap it around on your turn.",
            wildcardInfo: "Provides 1 property value towards either the Dark Blue (needs 2) or Green (needs 3) set."
        }
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Railroad/Green',
        colors: [PropertyColor.Rail, PropertyColor.Green],
        value: 4,
        seedId: 'wild-rail-green-1',
        metadata: {
            description: "Use as either property color shown. May be moved between sets during your turn.",
            gameplayDescription: "A versatile property that can pivot between two different sets. Great for completing a set unexpectedly.",
            rulesText: "You can move and rearrange this card during your turn. It does not count as an action.",
            officialRulesText: "This card can be used as part of either a Railroad or Green property set. You can swap it around on your turn.",
            wildcardInfo: "Provides 1 property value towards either the Railroad (needs 4) or Green (needs 3) set."
        }
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Red/Yellow',
        colors: [PropertyColor.Red, PropertyColor.Yellow],
        value: 3,
        seedId: 'wild-red-yellow-1',
        metadata: {
            description: "Use as either property color shown. May be moved between sets during your turn.",
            gameplayDescription: "A versatile property that can pivot between two different sets. Great for completing a set unexpectedly.",
            rulesText: "You can move and rearrange this card during your turn. It does not count as an action.",
            officialRulesText: "This card can be used as part of either a Red or Yellow property set. You can swap it around on your turn.",
            wildcardInfo: "Provides 1 property value towards either the Red (needs 3) or Yellow (needs 3) set."
        }
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Red/Yellow',
        colors: [PropertyColor.Red, PropertyColor.Yellow],
        value: 3,
        seedId: 'wild-red-yellow-2',
        metadata: {
            description: "Use as either property color shown. May be moved between sets during your turn.",
            gameplayDescription: "A versatile property that can pivot between two different sets. Great for completing a set unexpectedly.",
            rulesText: "You can move and rearrange this card during your turn. It does not count as an action.",
            officialRulesText: "This card can be used as part of either a Red or Yellow property set. You can swap it around on your turn.",
            wildcardInfo: "Provides 1 property value towards either the Red (needs 3) or Yellow (needs 3) set."
        }
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Utility/Railroad',
        colors: [PropertyColor.Utility, PropertyColor.Rail],
        value: 2,
        seedId: 'wild-utility-rail-1',
        metadata: {
            description: "Use as either property color shown. May be moved between sets during your turn.",
            gameplayDescription: "A versatile property that can pivot between two different sets. Great for completing a set unexpectedly.",
            rulesText: "You can move and rearrange this card during your turn. It does not count as an action.",
            officialRulesText: "This card can be used as part of either a Utility or Railroad property set. You can swap it around on your turn.",
            wildcardInfo: "Provides 1 property value towards either the Utility (needs 2) or Railroad (needs 4) set."
        }
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Property',
        colors: ALL_COLORS,
        value: 0,
        seedId: 'wild-any-1',
        metadata: {
            description: "Use as any property color. May be moved between sets during your turn.",
            gameplayDescription: "The ultimate property card. It can fill a gap in any property set you own.",
            rulesText: "Can be used to complete any property set. Can be rearranged for free during your turn.",
            officialRulesText: "This card can be used as part of ANY property set. This card has no monetary value.",
            wildcardInfo: "Provides 1 property value towards any set. Cannot be used to pay rent."
        }
    },
    {
        type: CardType.Wildcard,
        name: 'Wild Property',
        colors: ALL_COLORS,
        value: 0,
        seedId: 'wild-any-2',
        metadata: {
            description: "Use as any property color. May be moved between sets during your turn.",
            gameplayDescription: "The ultimate property card. It can fill a gap in any property set you own.",
            rulesText: "Can be used to complete any property set. Can be rearranged for free during your turn.",
            officialRulesText: "This card can be used as part of ANY property set. This card has no monetary value.",
            wildcardInfo: "Provides 1 property value towards any set. Cannot be used to pay rent."
        }
    },
];
