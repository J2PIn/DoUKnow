export type PlayerId = "p1" | "p2";

export type BBox = { x: number; y: number; w: number; h: number };

export type LevelItem = {
  id: string;
  label: string;
  bbox: BBox; // in image pixels
};

export type LevelDef = {
  levelId: string;
  imageSrc: string; // public path e.g. "/levels/sample1.png"
  items: LevelItem[];
  missingItemId: string; // item to guess
  difficulty: "easy" | "med" | "hard";
};

export type GameSettings = {
  studyMs: number;
  guessMs: number;
};

export type GamePhase = "loading" | "study" | "guess" | "result" | "done";

export type GameState = {
  gameId: string;
  seed: number;
  settings: GameSettings;

  levelOrder: string[];
  roundIndex: number;

  phase: GamePhase;
  roundId: string | null;
  levelId: string | null;

  roundStartMs: number | null;      // authoritative-friendly
  studyEndMs: number | null;
  guessEndMs: number | null;

  score: number;
  lastResult: null | {
    correct: boolean;
    chosenItemId: string | null;
    timeTakenMs: number | null;
    pointsAwarded: number;
    correctItemId: string;
  };
};

export type GameEvent =
  | { type: "GAME_CREATED"; gameId: string; seed: number; settings: GameSettings; levelIds: string[]; nowMs: number }
  | { type: "ROUND_STARTED"; roundId: string; levelId: string; nowMs: number }
  | { type: "PHASE_SET"; phase: GamePhase; nowMs: number }
  | { type: "PLAYER_GUESS"; playerId: PlayerId; chosenItemId: string | null; nowMs: number }
  | { type: "ROUND_ENDED"; nowMs: number }
  | { type: "NEXT_ROUND"; nowMs: number };
