import { randomUUID } from 'node:crypto';
import { CardType } from './types.js';
const PROPERTY_SET_SIZES = {
    brown: 2,
    'light-blue': 3,
    pink: 3,
    orange: 3,
    red: 3,
    yellow: 3,
    green: 3,
    'dark-blue': 2,
    rail: 4,
    utility: 2,
};
export function getSetSize(color) {
    return PROPERTY_SET_SIZES[color] ?? Number.POSITIVE_INFINITY;
}
function isWildcard(card) {
    return card.type === CardType.Wildcard;
}
function isProperty(card) {
    return card.type === CardType.Property;
}
/**
 * Normalizes a set:
 * 1. Checks completeness (requires at least one real property)
 * 2. Removes buildings if set is no longer complete
 */
export function normalizePropertySetWithBuildings(set, discardPile) {
    const required = getSetSize(set.color);
    const hasRealProperty = set.cards.some(c => c.type === CardType.Property);
    const isComplete = Number.isFinite(required)
        ? (set.cards.length >= required && hasRealProperty)
        : false;
    const normalized = {
        ...set,
        isComplete
    };
    // If set is not complete, buildings must be discarded
    if (!normalized.isComplete) {
        if (normalized.houseCard) {
            discardPile.push(normalized.houseCard);
            normalized.houseCard = undefined;
        }
        if (normalized.hotelCard) {
            discardPile.push(normalized.hotelCard);
            normalized.hotelCard = undefined;
        }
    }
    else {
        // Hotel requires house
        if (normalized.hotelCard && !normalized.houseCard) {
            discardPile.push(normalized.hotelCard);
            normalized.hotelCard = undefined;
        }
    }
    return normalized;
}
/**
 * Recomputes all sets for a player.
 * Cleans up empty sets.
 * Does NOT automatically merge sets (players might want them separate).
 */
export function recomputePropertySets(player, discardPile = []) {
    return {
        ...player,
        properties: player.properties
            .map(set => normalizePropertySetWithBuildings(set, discardPile))
            .filter(set => set.cards.length > 0)
    };
}
export function createNewSet(color) {
    return {
        setId: randomUUID(),
        color,
        cards: [],
        isComplete: false
    };
}
export function canPlaceOnColor(card, color) {
    if (color === 'wild')
        return isWildcard(card);
    if (isProperty(card))
        return card.color === color;
    return isWildcard(card) && card.colors.includes(color);
}
/**
 * Adds a card to a player's collection.
 * If targetSetId is provided, adds to that set.
 * Otherwise, finds an incomplete set of the color or creates a new one.
 */
export function addPropertyCard(player, card, targetColor, discardPile = [], targetSetId) {
    // Infer color if missing for normal properties
    if (!targetColor && isProperty(card)) {
        targetColor = card.color;
    }
    if (!targetColor) {
        return { ok: false, error: 'Target color is required for wildcard properties.' };
    }
    if (!canPlaceOnColor(card, targetColor)) {
        return { ok: false, error: 'Card cannot be placed in that property set.' };
    }
    let nextProperties = [...player.properties];
    let targetSetIndex = targetSetId ? nextProperties.findIndex(s => s.setId === targetSetId) : -1;
    if (targetSetId && targetSetIndex === -1) {
        return { ok: false, error: 'Target set not found.' };
    }
    // If no target set, find an existing incomplete set of that color
    if (targetSetIndex === -1) {
        targetSetIndex = nextProperties.findIndex(s => s.color === targetColor && !s.isComplete);
    }
    // If still no set, create a new one
    if (targetSetIndex === -1) {
        const newSet = createNewSet(targetColor);
        nextProperties.push(newSet);
        targetSetIndex = nextProperties.length - 1;
    }
    const targetSet = nextProperties[targetSetIndex];
    // Rule: A set cannot exceed its required size (overflow goes to new set)
    // Wait, if targetSetId is specified, we might want to respect it but if it's full...
    // Actually, players can have "extra" cards in a set but they don't count for rent?
    // User says: "Extra properties beyond required set size: do NOT increase rent; must exist in separate row/set"
    // So we MUST enforce set size limits.
    const maxSize = getSetSize(targetSet.color);
    if (targetSet.cards.length >= maxSize && Number.isFinite(maxSize)) {
        // If we were targeting a specific set and it's full, create a new one instead of failing
        const newSet = createNewSet(targetColor);
        newSet.cards.push(card);
        nextProperties.push(newSet);
    }
    else {
        targetSet.cards.push(card);
    }
    return {
        ok: true,
        player: recomputePropertySets({ ...player, properties: nextProperties }, discardPile)
    };
}
export function addBuildingToSet(player, buildingCard, setId) {
    const setIndex = player.properties.findIndex(s => s.setId === setId);
    if (setIndex === -1)
        return { ok: false, error: 'Target set not found.' };
    const set = player.properties[setIndex];
    if (!set.isComplete)
        return { ok: false, error: 'Buildings can only be added to complete sets.' };
    const actionCard = buildingCard;
    if (actionCard.actionId === 'house') {
        if (set.houseCard)
            return { ok: false, error: 'Set already has a house.' };
        set.houseCard = buildingCard;
    }
    else if (actionCard.actionId === 'hotel') {
        if (!set.houseCard)
            return { ok: false, error: 'Set must have a house before adding a hotel.' };
        if (set.hotelCard)
            return { ok: false, error: 'Set already has a hotel.' };
        set.hotelCard = buildingCard;
    }
    else {
        return { ok: false, error: 'Invalid building card.' };
    }
    return { ok: true, player: { ...player } };
}
/**
 * Moves a card from one set to another (or a new set).
 * Also used for reassigning wildcard colors.
 */
export function moveCardBetweenSets(player, cardId, targetColor, targetSetId, discardPile = []) {
    // 1. Find and remove the card
    let cardToMove = null;
    const nextProperties = player.properties.map(set => {
        const idx = set.cards.findIndex(c => c.id === cardId);
        if (idx === -1)
            return set;
        const nextCards = [...set.cards];
        const removed = nextCards.splice(idx, 1);
        cardToMove = removed[0] || null;
        return { ...set, cards: nextCards };
    });
    if (!cardToMove)
        return { ok: false, error: 'Card not found in properties.' };
    // 2. Validate placement
    if (!canPlaceOnColor(cardToMove, targetColor)) {
        return { ok: false, error: `This card cannot be placed in a ${targetColor} set.` };
    }
    // 3. Add to target set
    let finalProperties = nextProperties;
    if (targetSetId === 'new') {
        const newSet = createNewSet(targetColor);
        newSet.cards.push(cardToMove);
        finalProperties.push(newSet);
    }
    else {
        const setIdx = finalProperties.findIndex(s => s.setId === targetSetId);
        if (setIdx === -1)
            return { ok: false, error: 'Target set not found.' };
        const targetSet = finalProperties[setIdx];
        // Enforce size limit
        const maxSize = getSetSize(targetSet.color);
        if (targetSet.cards.length >= maxSize && Number.isFinite(maxSize)) {
            return { ok: false, error: 'Target set is already full.' };
        }
        // Update color if moving to a specific color set
        targetSet.cards.push(cardToMove);
        if (targetSet.color !== targetColor) {
            // This shouldn't really happen if validation above passed, but for safety:
            return { ok: false, error: 'Mismatched target color.' };
        }
    }
    return {
        ok: true,
        player: recomputePropertySets({ ...player, properties: finalProperties }, discardPile)
    };
}
