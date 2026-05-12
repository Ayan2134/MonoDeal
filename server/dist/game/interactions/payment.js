import { createNewSet } from '../property.js';
export function calculateCardValue(card) {
    if (card.type === 'money')
        return card.value;
    if (card.type === 'action')
        return card.value ?? 0;
    if (card.type === 'property')
        return card.value;
    if (card.type === 'wildcard')
        return card.value;
    return 0;
}
export function getTotalPlayerAssetValue(player) {
    let total = 0;
    for (const card of player.bank) {
        total += calculateCardValue(card);
    }
    for (const set of player.properties) {
        for (const card of set.cards) {
            total += calculateCardValue(card);
        }
    }
    return total;
}
export function validatePayment(state, playerId, amountDue, resolution) {
    const player = state.players.find(p => p.id === playerId);
    if (!player)
        return { ok: false, error: 'Player not found' };
    const totalAssets = getTotalPlayerAssetValue(player);
    const requiredAmount = Math.min(amountDue, totalAssets);
    // If the player has 0 assets, the required amount is 0, they can just pay nothing.
    if (requiredAmount === 0 && resolution.cardIds.length === 0) {
        return { ok: true, valuePaid: 0, cards: [] };
    }
    let valuePaid = 0;
    const cardsToPay = [];
    const allPlayerAssets = new Map();
    for (const card of player.bank) {
        allPlayerAssets.set(card.id, { card, location: 'bank' });
    }
    for (const set of player.properties) {
        for (const card of set.cards) {
            allPlayerAssets.set(card.id, { card, location: 'property', color: set.color });
        }
    }
    for (const cardId of resolution.cardIds) {
        const asset = allPlayerAssets.get(cardId);
        if (!asset) {
            return { ok: false, error: `Card ${cardId} is not owned by the player or is not an asset on the board` };
        }
        valuePaid += calculateCardValue(asset.card);
        cardsToPay.push(asset.card);
    }
    if (valuePaid < requiredAmount) {
        return { ok: false, error: `Insufficient payment: required ${requiredAmount}M, provided ${valuePaid}M` };
    }
    // TODO: Validate that properties aren't partially split illegally (e.g. from complete sets, usually this is allowed in Monopoly Deal but taking a property breaks the set).
    // Actually, in Monopoly Deal, you CAN pay with properties from a complete set, it just breaks the set.
    // There are no rules against breaking a set for payment, EXCEPT if a house/hotel is on it. 
    // We'll assume the client ensures houses/hotels are paid first or handled correctly.
    return { ok: true, valuePaid, cards: cardsToPay };
}
export function applyPayment(state, payerId, payeeId, cards) {
    let nextState = { ...state };
    let payer = nextState.players.find(p => p.id === payerId);
    let payee = nextState.players.find(p => p.id === payeeId);
    for (const card of cards) {
        // Remove from payer
        let removed = false;
        // Check bank
        const bankIndex = payer.bank.findIndex(c => c.id === card.id);
        if (bankIndex >= 0) {
            payer.bank.splice(bankIndex, 1);
            removed = true;
        }
        if (!removed) {
            // Check properties
            for (const set of payer.properties) {
                const propIndex = set.cards.findIndex(c => c.id === card.id);
                if (propIndex >= 0) {
                    set.cards.splice(propIndex, 1);
                    set.isComplete = false; // Breaking a set
                    removed = true;
                    break;
                }
            }
            payer.properties = payer.properties.filter(set => set.cards.length > 0);
        }
        // Add to payee
        if (card.type === 'money' || card.type === 'action') {
            payee.bank.push(card);
        }
        else if (card.type === 'property' || card.type === 'wildcard') {
            // Auto-assign property to payee's sets
            const propColor = card.type === 'property' ? card.color : card.colors[0];
            if (!propColor)
                continue;
            let targetSet = payee.properties.find(set => set.color === propColor && !set.isComplete);
            if (!targetSet) {
                const { setId } = createNewSet(propColor);
                targetSet = { setId, color: propColor, cards: [], isComplete: false };
                payee.properties.push(targetSet);
            }
            targetSet.cards.push(card);
            // We don't auto-complete sets here, but we could check. For simplicity, just add it.
        }
    }
    nextState.players = nextState.players.map(p => {
        if (p.id === payerId)
            return payer;
        if (p.id === payeeId)
            return payee;
        return p;
    });
    return nextState;
}
