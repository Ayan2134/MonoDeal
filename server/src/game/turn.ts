import { drawMultipleCards } from './deck.js';
import { TurnPhase, type GameState } from './state.js';

const DRAW_CARDS_PER_TURN = 2;
const MAX_ACTIONS_PER_TURN = 3;

export type TurnUpdate = {
  roomId: string;
  currentTurnPlayerId: string | null;
  actionsRemaining: number;
  turnPhase: TurnPhase;
};

export type GameStateResult =
  | {
      ok: true;
      gameState: GameState;
      turn: TurnUpdate;
    }
  | {
      ok: false;
      error: string;
    };

function buildTurnUpdate(state: GameState): TurnUpdate {
  return {
    roomId: state.roomId,
    currentTurnPlayerId: state.currentTurnPlayerId,
    actionsRemaining: state.actionsRemaining,
    turnPhase: state.turnPhase,
  };
}

function findNextTurnPlayerId(state: GameState): string | null {
  if (!state.currentTurnPlayerId) {
    return state.players[0]?.id ?? null;
  }

  const currentIndex = state.players.findIndex((player) => player.id === state.currentTurnPlayerId);
  if (currentIndex < 0) {
    return state.players[0]?.id ?? null;
  }

  for (let offset = 1; offset <= state.players.length; offset += 1) {
    const index = (currentIndex + offset) % state.players.length;
    const candidate = state.players[index];
    if (candidate?.status === 'connected') {
      return candidate.id;
    }
  }

  return state.players[currentIndex]?.id ?? null;
}

// Draw phase: current player draws two cards and moves into action phase.
export function startTurn(state: GameState, playerId: string): GameStateResult {
  if (!state.gameStarted) {
    return { ok: false, error: 'Game has not started.' };
  }

  if (state.currentTurnPlayerId !== playerId) {
    return { ok: false, error: 'It is not your turn.' };
  }

  if (state.turnPhase !== TurnPhase.Draw) {
    return { ok: false, error: 'Turn is already in progress.' };
  }

  const drawResult = drawMultipleCards(
    { deck: state.deck, discardPile: state.discardPile },
    DRAW_CARDS_PER_TURN,
  );

  const updatedPlayers = state.players.map((player) => {
    if (player.id !== playerId) {
      return player;
    }
    return {
      ...player,
      hand: [...player.hand, ...drawResult.cards],
    };
  });

  const nextState: GameState = {
    ...state,
    players: updatedPlayers,
    deck: drawResult.deck,
    discardPile: drawResult.discardPile,
    actionsRemaining: MAX_ACTIONS_PER_TURN,
    turnPhase: TurnPhase.Action,
  };

  return { ok: true, gameState: nextState, turn: buildTurnUpdate(nextState) };
}

// End phase: current player ends turn and advances to the next player.
export function endTurn(state: GameState, playerId: string): GameStateResult {
  if (!state.gameStarted) {
    return { ok: false, error: 'Game has not started.' };
  }

  if (state.currentTurnPlayerId !== playerId) {
    return { ok: false, error: 'It is not your turn.' };
  }

  if (state.turnPhase === TurnPhase.Draw) {
    return { ok: false, error: 'Draw phase must complete before ending turn.' };
  }

  const nextPlayerId = findNextTurnPlayerId(state);
  const nextState: GameState = {
    ...state,
    currentTurnPlayerId: nextPlayerId,
    actionsRemaining: MAX_ACTIONS_PER_TURN,
    turnPhase: TurnPhase.Draw,
  };

  return { ok: true, gameState: nextState, turn: buildTurnUpdate(nextState) };
}

// Action tracking helper for future card effects and validation.
export function consumeAction(state: GameState, playerId: string, count = 1): GameStateResult {
  if (!state.gameStarted) {
    return { ok: false, error: 'Game has not started.' };
  }

  if (state.currentTurnPlayerId !== playerId) {
    return { ok: false, error: 'It is not your turn.' };
  }

  if (state.turnPhase !== TurnPhase.Action) {
    return { ok: false, error: 'Actions are only allowed during the action phase.' };
  }

  if (state.actionsRemaining < count) {
    return { ok: false, error: 'No actions remaining.' };
  }

  const nextState: GameState = {
    ...state,
    actionsRemaining: state.actionsRemaining - count,
  };

  return { ok: true, gameState: nextState, turn: buildTurnUpdate(nextState) };
}
