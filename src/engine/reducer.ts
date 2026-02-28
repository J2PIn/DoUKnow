import type { GameEvent, GameState } from "./types";
import { shuffleDeterministic } from "./seed";

export function initialState(): GameState {
  return {
    gameId: "g0",
    seed: 1,
    settings: { studyMs: 2500, guessMs: 8000 },
    levelOrder: [],
    roundIndex: 0,
    phase: "loading",
    roundId: null,
    levelId: null,
    roundStartMs: null,
    studyEndMs: null,
    guessEndMs: null,
    score: 0,
    lastResult: null,
  };
}

export function reduce(state: GameState, ev: GameEvent): GameState {
  switch (ev.type) {
    case "GAME_CREATED": {
      const levelOrder = shuffleDeterministic(ev.levelIds, ev.seed);
      return {
        ...state,
        gameId: ev.gameId,
        seed: ev.seed,
        settings: ev.settings,
        levelOrder,
        roundIndex: 0,
        phase: "loading",
        score: 0,
        lastResult: null,
      };
    }
    case "ROUND_STARTED": {
      const roundStartMs = ev.nowMs;
      const studyEndMs = roundStartMs + state.settings.studyMs;
      const guessEndMs = studyEndMs + state.settings.guessMs;
      return {
        ...state,
        roundId: ev.roundId,
        levelId: ev.levelId,
        phase: "study",
        roundStartMs,
        studyEndMs,
        guessEndMs,
        lastResult: null,
      };
    }
    case "PHASE_SET":
      return { ...state, phase: ev.phase };

    // We record guess; scoring is computed in game.ts (where level data is available)
    case "PLAYER_GUESS":
      return state;

    case "ROUND_ENDED":
      return { ...state, phase: "result" };

    case "NEXT_ROUND": {
      const nextIndex = state.roundIndex + 1;
      if (nextIndex >= state.levelOrder.length) {
        return { ...state, phase: "done", roundIndex: nextIndex };
      }
      return { ...state, roundIndex: nextIndex, phase: "loading" };
    }
    default:
      return state;
  }
}
