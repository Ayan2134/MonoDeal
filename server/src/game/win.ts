import type { GameState, GamePlayer } from './state.js';

const REQUIRED_COMPLETE_SETS = 3;

function countCompleteSets(player: GamePlayer) {
  return player.properties.filter((set) => set.isComplete).length;
}

export function checkWinCondition(state: GameState) {
  for (const player of state.players) {
    if (countCompleteSets(player) >= REQUIRED_COMPLETE_SETS) {
      return player.id;
    }
  }

  return null;
}
