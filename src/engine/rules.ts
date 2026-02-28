import type { GameSettings, LevelDef } from "./types";

export function difficultyFactor(d: LevelDef["difficulty"]) {
  if (d === "easy") return 1.0;
  if (d === "med") return 1.5;
  return 2.0;
}

// Scoring uses time taken (not FPS). Multiplayer-safe.
export function computePoints(args: {
  correct: boolean;
  timeTakenMs: number | null;
  level: LevelDef;
  settings: GameSettings;
}) {
  if (!args.correct) return 0;
  const base = 100;
  const diff = difficultyFactor(args.level.difficulty);
  const total = args.settings.guessMs;
  const taken = Math.max(0, Math.min(total, args.timeTakenMs ?? total));
  const remaining = total - taken;
  const timeFactor = remaining / total; // 0..1
  const pts = Math.round(base * diff * (0.5 + 0.5 * timeFactor));
  return pts;
}
