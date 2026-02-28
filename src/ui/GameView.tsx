import React, { useEffect, useMemo, useState } from "react";
import { GameEngine } from "../engine/game";
import { randomSeed } from "../engine/seed";
import { LEVELS } from "../levels";
import { CanvasScene } from "./CanvasScene";

export function GameView() {
  const [engine] = useState(() => new GameEngine(LEVELS));
  const [now, setNow] = useState(() => performance.now());
  const [imgReady, setImgReady] = useState(false);
  const s = engine.state;
  const level = engine.getLevel();
  // preload level image
  useEffect(() => {
    if (!level) return;
    setImgReady(false);
    const img = new Image();
    img.src = level.imageSrc;
    img.onload = () => setImgReady(true);
    img.onerror = () => setImgReady(false);
  }, [level?.imageSrc]);

  // start game once
  useEffect(() => {
    engine.createGame({
      gameId: `g-${Math.floor(Math.random() * 1e9)}`,
      seed: randomSeed(),
      settings: { studyMs: 2500, guessMs: 8000 },
      nowMs: performance.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ticker
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = performance.now();
      if (imgReady) {
        engine.tick(t);
      }
      setNow(t);
    }, 50);
    return () => window.clearInterval(id);
  }, [engine]);

  const timeLeftMs = useMemo(() => {
    if (s.phase === "study" && s.studyEndMs != null) return Math.max(0, s.studyEndMs - now);
    if (s.phase === "guess" && s.guessEndMs != null) return Math.max(0, s.guessEndMs - now);
    return 0;
  }, [s.phase, s.studyEndMs, s.guessEndMs, now]);

  if (!level) return <div style={{ color: "#ddd" }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16, color: "#eee", fontFamily: "system-ui" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>What’s Missing — MVP</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            Round {Math.min(s.roundIndex + 1, s.levelOrder.length)} / {s.levelOrder.length} • Phase: {s.phase}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Score: {s.score}</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>Time left: {(timeLeftMs / 1000).toFixed(1)}s</div>
        </div>
      </header>

      {!imgReady && (
        <div style={{ marginBottom: 10, opacity: 0.8 }}>
          Waiting for image to load…
        </div>
      )}
      
      <CanvasScene
        level={level}
        phase={(s.phase === "study" || s.phase === "guess" || s.phase === "result") ? s.phase : "study"}
        revealCorrect={s.phase === "result"}
        correctItemId={s.lastResult?.correctItemId}
        onPick={(itemId) => {
          if (s.phase !== "guess") return;
          engine.guess({ playerId: "p1", chosenItemId: itemId, nowMs: performance.now() });
          setNow(performance.now());
        }}
      />

      <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
        {s.phase === "guess" && (
          <div style={{ opacity: 0.85, fontSize: 14 }}>
            Tap the area where you think the missing item was.
          </div>
        )}

        {s.phase === "result" && (
          <>
            <div style={{ fontSize: 14 }}>
              {s.lastResult?.correct ? "✅ Correct!" : "❌ Wrong / Time!"}
              {" "}
              +{s.lastResult?.pointsAwarded ?? 0} pts
            </div>
            <button
              onClick={() => {
                engine.nextRound(performance.now());
                setNow(performance.now());
              }}
              style={{
                marginLeft: "auto",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #444",
                background: "#1a1a1a",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Next
            </button>
          </>
        )}

        {s.phase === "done" && (
          <div style={{ fontSize: 16, fontWeight: 700 }}>Game over — Score: {s.score}</div>
        )}
      </div>

      <details style={{ marginTop: 16, opacity: 0.85 }}>
        <summary>Debug (event log)</summary>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
          {JSON.stringify(engine.events.slice(-20), null, 2)}
        </pre>
      </details>
    </div>
  );
}
