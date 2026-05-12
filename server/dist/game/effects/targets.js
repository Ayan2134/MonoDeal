export function validateTargets(state, targets) {
    if (targets.playerIds) {
        const missing = targets.playerIds.filter((playerId) => !state.players.some((player) => player.id === playerId));
        if (missing.length) {
            return { ok: false, error: 'Target player not found.' };
        }
    }
    return { ok: true };
}
export function normalizeTargets(targets) {
    return {
        playerIds: targets?.playerIds ?? [],
        propertyCardIds: targets?.propertyCardIds ?? [],
        propertySetColors: targets?.propertySetColors ?? [],
        propertySetIds: targets?.propertySetIds ?? [],
    };
}
