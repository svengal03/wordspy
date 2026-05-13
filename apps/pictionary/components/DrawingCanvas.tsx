"use client";
import { useRef, useEffect, useState, useCallback } from "react";

interface Props {
  timerDuration: number;
  word: string;
  drawerName: string;
  teamColor: string;
  onCorrect: () => void;
  onSkip: () => void;
}

const COLORS = ["#1A1A1A", "#E84040", "#4A6CF7", "#2BB34A", "#F59E0B", "#9333EA"];
const SIZES = [3, 6, 12];

export function DrawingCanvas({ timerDuration, word, drawerName, teamColor, onCorrect, onSkip }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const snapshots = useRef<ImageData[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [eraser, setEraser] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [wordVisible, setWordVisible] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(tick);
          onSkip();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [onSkip]);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = eraser ? size * 3 : size;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = false;
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) {
      snapshots.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (snapshots.current.length > 30) snapshots.current.shift();
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    snapshots.current.pop();
    if (snapshots.current.length > 0) {
      ctx.putImageData(snapshots.current[snapshots.current.length - 1], 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snapshots.current = [];
  };

  const timerPct = timeLeft / timerDuration;
  const timerColor = timerPct > 0.4 ? "#2BB34A" : timerPct > 0.2 ? "#F59E0B" : "#E84040";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        fontFamily: "'DM Sans', sans-serif",
        background: "#FAFAF8",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "#FFFFFF",
          borderBottom: "1px solid #F0F0F0",
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{drawerName}</div>
          <div style={{ fontSize: 11, color: "#AAA" }}>Drawing now</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setWordVisible((v) => !v)}
            style={{
              padding: "5px 12px", borderRadius: 8,
              border: `1.5px solid ${teamColor}`, background: "transparent",
              color: teamColor, fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >{wordVisible ? "Hide" : "Peek"}</button>
          <div style={{
            fontSize: 20, fontWeight: 800, color: timerColor,
            background: timerColor + "15", padding: "5px 10px", borderRadius: 8,
            fontVariantNumeric: "tabular-nums",
          }}>{timeLeft}</div>
        </div>
      </div>

      {wordVisible && (
        <div
          style={{
            background: teamColor,
            color: "#fff",
            textAlign: "center",
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {word}
        </div>
      )}

      {/* Timer bar */}
      <div style={{ height: 3, background: "#F0F0F0", flexShrink: 0 }}>
        <div
          style={{
            height: "100%",
            width: `${timerPct * 100}%`,
            background: timerColor,
            transition: "width 1s linear, background 0.3s",
          }}
        />
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            background: "#fff",
            cursor: eraser ? "cell" : "crosshair",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: "#fff",
          borderTop: "1px solid #F0F0F0",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Colors + sizes */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setEraser(false); }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: c,
                  border: color === c && !eraser ? "2.5px solid #1A1A1A" : "2px solid transparent",
                  cursor: "pointer",
                  outline: color === c && !eraser ? "2px solid #fff" : "none",
                  outlineOffset: "-4px",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                style={{
                  width: s * 2.5 + 10,
                  height: s * 2.5 + 10,
                  borderRadius: "50%",
                  background: size === s ? "#1A1A1A" : "#E8E5E1",
                  border: "none",
                  cursor: "pointer",
                  minWidth: 18,
                  minHeight: 18,
                }}
              />
            ))}
            <button
              onClick={() => setEraser((e) => !e)}
              style={{
                padding: "4px 10px", borderRadius: 8, fontFamily: "inherit",
                border: `1.5px solid ${eraser ? "#E84040" : "#F0F0F0"}`,
                background: eraser ? "#FFF0F0" : "transparent",
                fontSize: 12, fontWeight: 600, color: eraser ? "#E84040" : "#888",
                cursor: "pointer",
              }}
              title="Eraser"
            >Erase</button>
            <button
              onClick={handleUndo}
              style={{ padding: "4px 10px", borderRadius: 8, border: "1.5px solid #F0F0F0", background: "transparent", fontSize: 12, color: "#888", cursor: "pointer", fontFamily: "inherit" }}
              title="Undo"
            >Undo</button>
            <button
              onClick={handleClear}
              style={{ padding: "4px 10px", borderRadius: 8, border: "1.5px solid #F0F0F0", background: "transparent", fontSize: 12, color: "#888", cursor: "pointer", fontFamily: "inherit" }}
            >Clear</button>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onSkip}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 12,
              border: "1.5px solid #E8E5E1",
              background: "#fff",
              color: "#888",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Skip →
          </button>
          <button
            onClick={onCorrect}
            style={{
              flex: 2,
              padding: "12px 0",
              borderRadius: 12,
              border: "none",
              background: "#2BB34A",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Correct ✓
          </button>
        </div>
      </div>
    </div>
  );
}
