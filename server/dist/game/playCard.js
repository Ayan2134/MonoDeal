import { CardType } from './types.js';
import { TurnPhase } from './state.js';
import { consumeAction } from './turn.js';
import { addPropertyCard } from './property.js';
import { resolveActionEffect } from './effects/engine.js';
import { enqueuePendingAction, isResponseEligibleAction } from './stack.js';
export var CardDestination;
(function (CardDestination) {
    CardDestination["Bank"] = "bank";
    CardDestination["Property"] = "property";
    CardDestination["Discard"] = "discard";
})(CardDestination || (CardDestination = {}));
function removeCardFromHand(player, cardId) {
    const index = player.hand.findIndex((card) => card.id === cardId);
    if (index < 0) {
        return { card: null, player };
    }
    const nextHand = [...player.hand];
    const [card] = nextHand.splice(index, 1);
    return { card: card ?? null, player: { ...player, hand: nextHand } };
}
function applyCardDestination(player, card, destination, discardPile, propertySetColor, targetSetId) {
    if (destination === CardDestination.Bank) {
        return { ...player, bank: [...player.bank, card] };
    }
    if (destination === CardDestination.Property) {
        const propertyResult = addPropertyCard(player, card, propertySetColor, discardPile, targetSetId);
        if (!propertyResult.ok) {
            throw new Error(propertyResult.error);
        }
        return propertyResult.player;
    }
    return player;
}
export function playCard(state, input) {
    if (!state.gameStarted) {
        return { ok: false, error: 'Game has not started.' };
    }
    if (state.gameEnded) {
        return { ok: false, error: 'Game has ended.' };
    }
    if (state.responseWindow.isOpen) {
        return { ok: false, error: 'Wait for the response window to resolve.' };
    }
    if (state.currentTurnPlayerId !== input.playerId) {
        return { ok: false, error: 'It is not your turn.' };
    }
    if (state.turnPhase !== TurnPhase.Action) {
        return { ok: false, error: 'Cards can only be played during the action phase.' };
    }
    const playerIndex = state.players.findIndex((player) => player.id === input.playerId);
    if (playerIndex < 0) {
        return { ok: false, error: 'Player not found.' };
    }
    const player = state.players[playerIndex];
    if (!player) {
        return { ok: false, error: 'Player not found.' };
    }
    const removed = removeCardFromHand(player, input.cardId);
    if (!removed.card) {
        return { ok: false, error: 'Card not found in hand.' };
    }
    if (input.destination === CardDestination.Bank) {
        const isMoney = removed.card.type === CardType.Money;
        const isBankableAction = removed.card.type === CardType.Action && typeof removed.card.value === 'number';
        if (!isMoney && !isBankableAction) {
            return { ok: false, error: 'Only money cards (or valued actions) can be banked.' };
        }
    }
    let propertySetColor = input.propertySetColor;
    if (input.destination === CardDestination.Property) {
        const isPropertyCard = removed.card.type === CardType.Property || removed.card.type === CardType.Wildcard;
        if (!isPropertyCard) {
            return { ok: false, error: 'Only property or wildcard cards can be placed as properties.' };
        }
        // Infer color for normal properties if not provided
        if (!propertySetColor && removed.card.type === CardType.Property) {
            propertySetColor = removed.card.color;
        }
    }
    if (input.destination === CardDestination.Discard && removed.card.type !== CardType.Action) {
        return { ok: false, error: 'Only action cards can be discarded.' };
    }
    let updatedPlayer = removed.player;
    const modifierCardIds = input.targets?.modifierCardIds || [];
    const modifiersToConsume = [];
    if (modifierCardIds.length > 0) {
        if (removed.card.type !== CardType.Action || removed.card.actionId !== 'rent') {
            return { ok: false, error: 'Modifiers can only be applied to rent actions.' };
        }
        const totalRequired = 1 + modifierCardIds.length;
        if (state.actionsRemaining < totalRequired) {
            return { ok: false, error: `Not enough actions. This play requires ${totalRequired} actions.` };
        }
        for (const mid of modifierCardIds) {
            const index = updatedPlayer.hand.findIndex(c => c.id === mid);
            if (index === -1)
                return { ok: false, error: 'Modifier card not found in hand.' };
            const [mCard] = updatedPlayer.hand.splice(index, 1);
            if (!mCard || mCard.actionId !== 'double-the-rent') {
                return { ok: false, error: 'Only Double The Rent can be used as a modifier.' };
            }
            modifiersToConsume.push(mCard);
        }
    }
    try {
        updatedPlayer = applyCardDestination(updatedPlayer, removed.card, input.destination, state.discardPile, propertySetColor, input.targetSetId);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid property placement.';
        return { ok: false, error: message };
    }
    const updatedPlayers = state.players.map((current, index) => (index === playerIndex ? updatedPlayer : current));
    let updatedState = {
        ...state,
        players: updatedPlayers,
        discardPile: [
            ...state.discardPile,
            ...(input.destination === CardDestination.Discard && !['house', 'hotel'].includes(removed.card.actionId) ? [removed.card] : []),
            ...modifiersToConsume
        ],
    };
    if (input.destination === CardDestination.Discard && removed.card.type === CardType.Action) {
        if (isResponseEligibleAction(removed.card.actionId)) {
            updatedState = enqueuePendingAction(updatedState, input.playerId, removed.card, input.targets);
        }
        else {
            const effectResult = resolveActionEffect(updatedState, input.playerId, removed.card, input.targets);
            if (!effectResult.ok) {
                return effectResult;
            }
            updatedState = effectResult.state;
        }
    }
    const actionResult = consumeAction(updatedState, input.playerId, 1 + modifiersToConsume.length);
    if (!actionResult.ok) {
        return actionResult;
    }
    return actionResult;
}
