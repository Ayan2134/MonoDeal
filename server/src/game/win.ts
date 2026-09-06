import type { GameState, GamePlayer } from './state.js';

const REQUIRED_COMPLETE_SETS = 3;

/** Official win: 3 complete sets of different colors. */
function countDistinctCompleteColors(player: GamePlayer) {
  const colors = new Set(
    player.properties
      .filter((set) => set.isComplete && set.color !== 'wild')
      .map((set) => set.color),
  );
  return colors.size;
}

export function checkWinCondition(state: GameState) {
  for (const player of state.players) {
    if (countDistinctCompleteColors(player) >= REQUIRED_COMPLETE_SETS) {
      return player.id;
    }
  }

  return null;
}
