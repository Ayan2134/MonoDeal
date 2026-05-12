const REQUIRED_COMPLETE_SETS = 3;
function countCompleteSets(player) {
    return player.properties.filter((set) => set.isComplete).length;
}
export function checkWinCondition(state) {
    for (const player of state.players) {
        if (countCompleteSets(player) >= REQUIRED_COMPLETE_SETS) {
            return player.id;
        }
    }
    return null;
}
