import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LevelDef, BBox } from "../engine/types";

function inside(b: BBox, x: number, y: number) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

export function CanvasScene(props: {
  level: LevelDef;
  phase: "study" | "guess" | "result";
  revealCorrect?: boolean;
  correctItemId?: string;
  onPick: (itemId: string | null, pos: { x: number; y: number }) => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = props.level.imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };
  }, [props.level.imageSrc]);

  const items = props.level.items;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!natural) return;
    if (props.phase !== "guess") return;

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    // map click to image pixel coords (contain-fit)
    const imgW = natural.w, imgH = natural.h;
    const scale = Math.min(rect.width / imgW, rect.height / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const offsetX = (rect.width - drawW) / 2;
    const offsetY = (rect.height - drawH) / 2;

    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;

    let chosen: string | null = null;
    for (const it of items) {
      if (inside(it.bbox, x, y)) { chosen = it.id; break; }
    }
    props.onPick(chosen, { x, y });
  };

  const overlayBoxes = useMemo(() => {
    if (!natural) return null;
    if (props.phase === "study") return null;
    // in result phase, show correct bbox highlight (optionally)
    if (props.phase === "result" && props.revealCorrect && props.correctItemId) {
      const it = items.find(i => i.id === props.correctItemId);
      if (!it) return null;
      return [it];
    }
    return null;
  }, [natural, props.phase, props.revealCorrect, props.correctItemId, items]);

  return (
    <div
      onClick={handleClick}
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        background: "#111",
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
        cursor: props.phase === "guess" ? "crosshair" : "default",
      }}
    >
      {natural ? (
        <>
          <img
            src={props.level.imageSrc}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
          {overlayBoxes?.map((it) => (
            <BBoxOverlay key={it.id} bbox={it.bbox} natural={natural} />
          ))}
        </>
      ) : (
        <div style={{ color: "#bbb", padding: 16 }}>Loading image…</div>
      )}

      {props.phase === "study" && (
        <div style={{
          position: "absolute", inset: 0,
          display: "grid", placeItems: "center",
          background: "rgba(0,0,0,0.15)", color: "white",
          fontSize: 18
        }}>
          Memorize the scene…
        </div>
      )}
    </div>
  );
}

function BBoxOverlay(props: { bbox: BBox; natural: { w: number; h: number } }) {
  const { bbox, natural } = props;
  // We'll convert bbox to percentages so it scales with contain image easily-ish.
  // This overlay assumes the image fills container with objectFit: contain; exact mapping is complex.
  // For MVP: good enough as a hint highlight. Click-hit-test is already correct.
  const left = (bbox.x / natural.w) * 100;
  const top = (bbox.y / natural.h) * 100;
  const width = (bbox.w / natural.w) * 100;
  const height = (bbox.h / natural.h) * 100;

  return (
    <div style={{
      position: "absolute",
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`,
      border: "3px solid #3cff3c",
      boxSizing: "border-box",
      pointerEvents: "none",
      borderRadius: 8,
    }} />
  );
}
