import type { GameEvent, GameSettings, GameState, LevelDef } from "./types";
import { initialState, reduce } from "./reducer";
import { computePoints } from "./rules";

export class GameEngine {
  private _state: GameState = initialState();
  private _events: GameEvent[] = [];
  private _levelsById: Record<string, LevelDef>;

  constructor(levels: LevelDef[]) {
    this._levelsById = Object.fromEntries(levels.map(l => [l.levelId, l]));
  }

  get state() { return this._state; }
  get events() { return this._events.slice(); } // event log (future: replay, multiplayer verification)

  dispatch(ev: GameEvent) {
    this._events.push(ev);
    this._state = reduce(this._state, ev);
  }

  createGame(args: { gameId: string; seed: number; settings: GameSettings; nowMs: number }) {
    const levelIds = Object.keys(this._levelsById);
    this.dispatch({ type: "GAME_CREATED", gameId: args.gameId, seed: args.seed, settings: args.settings, levelIds, nowMs: args.nowMs });
    // auto-start first round
    this.startRound({ nowMs: args.nowMs });
  }

  startRound(args: { nowMs: number }) {
    const levelId = this._state.levelOrder[this._state.roundIndex];
    const roundId = `${this._state.gameId}-r${this._state.roundIndex}`;
    this.dispatch({ type: "ROUND_STARTED", roundId, levelId, nowMs: args.nowMs });
  }

  // Single-player call; multiplayer later: this becomes "request guess", server validates.
  guess(args: { playerId: "p1"; chosenItemId: string | null; nowMs: number }) {
    const s = this._state;
    if (s.phase !== "guess") return;

    const level = s.levelId ? this._levelsById[s.levelId] : null;
    if (!level || s.studyEndMs == null) return;

    const timeTakenMs = Math.max(0, args.nowMs - s.studyEndMs);
    const correct = args.chosenItemId === level.missingItemId;
    const pointsAwarded = computePoints({ correct, timeTakenMs, level, settings: s.settings });

    this.dispatch({ type: "PLAYER_GUESS", playerId: args.playerId, chosenItemId: args.chosenItemId, nowMs: args.nowMs });

    // write result directly onto state (kept outside reducer because we need level lookup)
    this._state = {
      ...this._state,
      score: this._state.score + pointsAwarded,
      lastResult: {
        correct,
        chosenItemId: args.chosenItemId,
        timeTakenMs,
        pointsAwarded,
        correctItemId: level.missingItemId,
      },
    };

    this.dispatch({ type: "ROUND_ENDED", nowMs: args.nowMs });
  }

  tick(nowMs: number) {
    const s = this._state;
    if (s.phase === "study" && s.studyEndMs != null && nowMs >= s.studyEndMs) {
      this.dispatch({ type: "PHASE_SET", phase: "guess", nowMs });
      return;
    }
    if (s.phase === "guess" && s.guessEndMs != null && nowMs >= s.guessEndMs) {
      // timeout -> end round with incorrect
      this.guess({ playerId: "p1", chosenItemId: null, nowMs });
      return;
    }
  }

  nextRound(nowMs: number) {
    this.dispatch({ type: "NEXT_ROUND", nowMs });
    if (this._state.phase !== "done") this.startRound({ nowMs });
  }

  getLevel(): LevelDef | null {
    const id = this._state.levelId;
    return id ? this._levelsById[id] : null;
  }
}
