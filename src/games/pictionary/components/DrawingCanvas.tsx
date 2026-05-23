"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { PhaseTrail, OptionsMenu, TopBar, NavBtn, tokens, useGoHome } from "@playhub/ui";
import { RulesModal } from "./RulesModal";

const PIC_PHASES = ["Word Reveal", "Drawing", "Results"];

interface Props {
  timerDuration: number;
  word: string;
  difficulty?: string;
  drawerName: string;
  teamColor: string;
  onCorrect: (timeLeft: number) => void;
  onSkip: () => void;
  onNewGame: () => void;
}

const COLORS = [tokens.black, tokens.red, "#4A6CF7", tokens.green, "#F59E0B", tokens.purple, tokens.white];
const SIZES = [3, 6, 12];

export function DrawingCanvas({ timerDuration, word, difficulty, drawerName, teamColor, onCorrect, onSkip, onNewGame }: Props) {
  const goHome = useGoHome();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const snapshots = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);
  const done = useRef(false);
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [eraser, setEraser] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [wordVisible, setWordVisible] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    done.current = false;
    const tick = setInterval(() => {
      setTimeLeft((t) => {
        if (done.current) return t;
        if (t <= 1) {
          done.current = true;
          clearInterval(tick);
          onSkipRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

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
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) {
      snapshots.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (snapshots.current.length > 10) snapshots.current.shift();
      redoStack.current = [];
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const top = snapshots.current.pop();
    if (top) redoStack.current.push(top);
    if (snapshots.current.length > 0) {
      ctx.putImageData(snapshots.current[snapshots.current.length - 1], 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleRedo = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || redoStack.current.length === 0) return;
    const top = redoStack.current.pop()!;
    snapshots.current.push(top);
    ctx.putImageData(top, 0, 0);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snapshots.current = [];
    redoStack.current = [];
  };

  const timerPct = timerDuration > 0 ? timeLeft / timerDuration : 0;
  const timerState = timerPct > 0.4 ? "ok" : timerPct > 0.2 ? "warn" : "danger";
  const timerColor = timerState === "ok" ? tokens.green : timerState === "warn" ? "#F59E0B" : tokens.red;
  const timerIcon = timerState === "ok" ? null : timerState === "warn" ? "⚠" : "!";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        fontFamily: "'DM Sans', sans-serif",
        background: tokens.bg,
        overflow: "hidden",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <TopBar
        appName="Pictionary"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
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
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 20, fontWeight: 800, color: timerColor,
              background: timerColor + "15", padding: "5px 10px", borderRadius: 8,
              fontVariantNumeric: "tabular-nums",
              outline: timerState === "danger" ? `2px solid ${timerColor}` : "none",
              animation: timerState === "danger" ? "playhub-pulse 0.9s ease-in-out infinite" : "none",
            }}>
              <style>{`@keyframes playhub-pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }`}</style>
              {timerIcon && <span aria-hidden="true" style={{ fontSize: 13 }}>{timerIcon}</span>}
              <span aria-label={`${timeLeft} seconds remaining`}>{timeLeft}</span>
            </div>
            <OptionsMenu onNewGame={onNewGame} onExit={goHome} />
          </div>
        }
      />

      {/* Drawer info */}
      <div style={{
        padding: "7px 20px", background: teamColor + "10",
        borderBottom: `1px solid ${teamColor}20`,
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: tokens.black }}>{drawerName} is drawing</span>
        {difficulty && <><span style={{ fontSize: 11, color: tokens.grey4 }}>·</span><span style={{ fontSize: 11, fontWeight: 700, color: teamColor, letterSpacing: 0.5, textTransform: "uppercase" as const }}>{difficulty}</span></>}
      </div>

      <PhaseTrail phases={PIC_PHASES} current="Drawing" accentColor={teamColor} />

      {wordVisible && (
        <div
          style={{
            background: teamColor,
            color: tokens.white,
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
      <div style={{ height: 3, background: tokens.border, flexShrink: 0 }}>
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
      <div style={{ flex: 1, position: "relative", overflow: "hidden", touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            background: tokens.white,
            cursor: eraser ? "cell" : "crosshair",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: tokens.white,
          borderTop: "1px solid #F0F0F0",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Row 1: Colors */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setEraser(false); }}
                aria-label={`Color: ${c === tokens.black ? "Black" : c === tokens.red ? "Red" : c === "#4A6CF7" ? "Blue" : c === tokens.green ? "Green" : c === "#F59E0B" ? "Yellow" : c === tokens.purple ? "Purple" : "White"}`}
                aria-pressed={color === c && !eraser}
                style={{
                  width: 26, height: 26, borderRadius: "50%", background: c,
                  border: color === c && !eraser ? `2.5px solid ${tokens.black}` : "2px solid transparent",
                  cursor: "pointer",
                  outline: color === c && !eraser ? `2px solid ${tokens.white}` : undefined,
                  outlineOffset: "-4px",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-label={`Brush size ${s}`}
                aria-pressed={size === s}
                style={{
                  width: s * 2.5 + 10, height: s * 2.5 + 10,
                  borderRadius: "50%",
                  background: size === s ? tokens.black : tokens.border,
                  border: "none", cursor: "pointer",
                  minWidth: 18, minHeight: 18, flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Row 2: Tools */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={() => setEraser((e) => !e)}
            style={{
              flex: 1, padding: "5px 0", borderRadius: 8, fontFamily: "inherit",
              border: `1.5px solid ${eraser ? tokens.red : tokens.border}`,
              background: eraser ? tokens.redBg : "transparent",
              fontSize: 12, fontWeight: 600, color: eraser ? tokens.red : tokens.grey2,
              cursor: "pointer",
            }}
          >{eraser ? "✏️ Pen" : "⬜ Erase"}</button>
          <button
            onClick={handleUndo}
            style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: "1.5px solid #F0F0F0", background: "transparent", fontSize: 12, color: tokens.grey2, cursor: "pointer", fontFamily: "inherit" }}
          >Undo</button>
          <button
            onClick={handleRedo}
            style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: "1.5px solid #F0F0F0", background: "transparent", fontSize: 12, color: tokens.grey2, cursor: "pointer", fontFamily: "inherit" }}
          >Redo</button>
          <button
            onClick={handleClear}
            style={{ flex: 1, padding: "5px 0", borderRadius: 8, border: "1.5px solid #F0F0F0", background: "transparent", fontSize: 12, color: tokens.grey2, cursor: "pointer", fontFamily: "inherit" }}
          >Clear</button>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onSkip}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: tokens.radius.lg,
              border: `1.5px solid ${tokens.border}`,
              background: tokens.white,
              color: tokens.grey2,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Skip →
          </button>
          <button
            onClick={() => { done.current = true; onCorrect(timeLeft); }}
            style={{
              flex: 2,
              padding: "12px 0",
              borderRadius: tokens.radius.lg,
              border: "none",
              background: tokens.green,
              color: tokens.white,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Correct ✓
          </button>
        </div>
      </div>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
