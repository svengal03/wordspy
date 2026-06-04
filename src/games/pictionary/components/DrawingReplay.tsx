"use client";
import { useRef, useEffect, useState } from "react";
import type { DrawingStroke } from "../types";
import { tokens } from "@playhub/ui";

interface Props {
  strokes: DrawingStroke[];
  teamColor: string;
}

export function DrawingReplay({ strokes, teamColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function replay() {
    clearCanvas();
    setPlaying(true);
    setDone(false);
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) { setPlaying(false); setDone(true); return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let i = 0;
    const speed = Math.max(1, Math.floor(strokes.length / 300)); // batch strokes for smooth speed

    function step() {
      const end = Math.min(i + speed, strokes.length);
      for (; i < end; i++) {
        const s = strokes[i];
        if (!s) continue;
        ctx.globalCompositeOperation = s.eraser ? "destination-out" : "source-over";
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.eraser ? s.size * 3 : s.size;
        if (s.type === "start") {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
        } else if (s.type === "move") {
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
        }
      }
      if (i < strokes.length) {
        animRef.current = setTimeout(step, 16);
      } else {
        setPlaying(false);
        setDone(true);
      }
    }
    step();
  }

  useEffect(() => {
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, []);

  if (strokes.length === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        position: "relative", borderRadius: 14, overflow: "hidden",
        border: `1.5px solid ${tokens.border}`, background: tokens.white,
      }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          style={{ width: "100%", display: "block" }}
        />
        {!playing && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: done ? "transparent" : "rgba(255,255,255,0.85)",
          }}>
            <button
              onClick={replay}
              style={{
                padding: "10px 22px", borderRadius: 10,
                background: teamColor, color: "#fff",
                border: "none", fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >{done ? "▶ Replay" : "▶ Watch Drawing"}</button>
          </div>
        )}
        {playing && (
          <div style={{
            position: "absolute", top: 8, right: 10,
            fontSize: 11, fontWeight: 700, color: teamColor,
            background: `${teamColor}18`, padding: "3px 8px", borderRadius: 20,
          }}>Replaying…</div>
        )}
      </div>
    </div>
  );
}
