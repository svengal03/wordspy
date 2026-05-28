"use client";
import { motion, AnimatePresence } from "framer-motion";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import type { Tile, PlayerRole, TeamColor } from "../types";
import { sfx, haptic } from "../sound";

interface Props {
  tile: Tile;
  viewerRole: PlayerRole | null;
  viewerTeam: TeamColor | null;
  activeTeam: TeamColor;
  canTap: boolean;
  onTap: (id: number) => void;
  flagged?: boolean;
  canFlag?: boolean;
  onFlag?: (id: number) => void;
}

const HOLD_MS = 380;

const REVEALED: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  red:     { bg: "#B22234", text: "#FFFFFF", border: "#8B1A28", glow: "#FF4D6280" },
  blue:    { bg: "#1A3F7A", text: "#FFFFFF", border: "#112C5C", glow: "#5B8DEF80" },
  neutral: { bg: "#9E7B4E", text: "#FFFFFF", border: "#7A5E38", glow: "#D4B88A80" },
  bomb:    { bg: "#141414", text: "#FFFFFF", border: "#000000", glow: "#FF3B3BCC" },
};

const SPY_UNREVEALED: Record<string, { bg: string; text: string; border: string }> = {
  red:     { bg: "#E8929D", text: "#5C0A14", border: "#CC6070" },
  blue:    { bg: "#8BAAD4", text: "#0A1F42", border: "#5A7BB0" },
  neutral: { bg: "#D4B88A", text: "#4A3520", border: "#B89A66" },
  bomb:    { bg: "#555555", text: "#FFFFFF", border: "#333333" },
};

const AGENT_UNREVEALED = { bg: "#F0E6C8", text: "#2A1A0E", border: "#C8B48A" };

function WordCardImpl({ tile, viewerRole, viewerTeam, canTap, onTap, flagged, canFlag, onFlag }: Props) {
  const isSpymaster = viewerRole === "spymaster";
  const isInteractive = canTap && !tile.revealed;

  const unrevealedStyle = isSpymaster ? SPY_UNREVEALED[tile.color] : AGENT_UNREVEALED;
  const revealedStyle = REVEALED[tile.color];

  // Flip animation: displayRevealed lags behind tile.revealed so we can swap
  // styles mid-flip while the card is edge-on.
  const [flipping, setFlipping] = useState(false);
  const [displayRevealed, setDisplayRevealed] = useState(tile.revealed);
  const [showRipple, setShowRipple] = useState(false);
  const [shake, setShake] = useState(false);
  const prevRevealedRef = useRef(tile.revealed);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (tile.revealed && !prevRevealedRef.current) {
      timers.current.forEach(clearTimeout);
      setFlipping(true);
      setDisplayRevealed(false);
      timers.current = [
        setTimeout(() => setDisplayRevealed(true), 180),
        setTimeout(() => setFlipping(false), 420),
      ];

      // Sound + haptic on actual reveal — keyed off the viewer's team perspective.
      sfx.flip();
      if (tile.color === "bomb") {
        sfx.bomb();
        haptic([0, 60, 40, 120]);
        setShake(true);
        timers.current.push(setTimeout(() => setShake(false), 420));
      } else if (viewerTeam && tile.color === viewerTeam) {
        sfx.revealOwn();
        haptic(18);
      } else if (tile.color === "neutral") {
        sfx.revealNeutral();
        haptic(30);
      } else {
        sfx.revealOpponent();
        haptic([0, 30, 40, 30]);
      }
      setShowRipple(true);
      timers.current.push(setTimeout(() => setShowRipple(false), 600));
    } else if (!tile.revealed) {
      setDisplayRevealed(false);
    }
    prevRevealedRef.current = tile.revealed;
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile.revealed]);

  // ── Long-press logic ──────────────────────────────────────────────────────
  const [holdProgress, setHoldProgress] = useState(0); // 0–1
  const holdStartRef = useRef(0);
  const holdRafRef = useRef<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickedRef = useRef(false);
  const committedRef = useRef(false);
  const movedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const clearHold = useCallback(() => {
    if (holdRafRef.current != null) cancelAnimationFrame(holdRafRef.current);
    if (holdTimerRef.current != null) clearTimeout(holdTimerRef.current);
    holdRafRef.current = null;
    holdTimerRef.current = null;
    setHoldProgress(0);
  }, []);

  const tick = useCallback(() => {
    const elapsed = performance.now() - holdStartRef.current;
    const p = Math.min(1, elapsed / HOLD_MS);
    setHoldProgress(p);
    // One subtle tick sound at the halfway mark to signal commitment is imminent.
    if (!tickedRef.current && p > 0.5) {
      tickedRef.current = true;
      sfx.holdTick();
      haptic(8);
    }
    if (p < 1) holdRafRef.current = requestAnimationFrame(tick);
  }, []);

  const startHold = useCallback((e: React.PointerEvent) => {
    if (!isInteractive) return;
    if (pointerIdRef.current != null) return;
    pointerIdRef.current = e.pointerId;
    movedRef.current = false;
    committedRef.current = false;
    tickedRef.current = false;
    holdStartRef.current = performance.now();
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    holdRafRef.current = requestAnimationFrame(tick);
    holdTimerRef.current = setTimeout(() => {
      committedRef.current = true;
      clearHold();
      haptic(35);
      onTap(tile.id);
    }, HOLD_MS);
  }, [isInteractive, tick, clearHold, onTap, tile.id]);

  const endHold = useCallback((e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    const wasCommitted = committedRef.current;
    const wasMoved = movedRef.current;
    clearHold();
    if (wasCommitted) return; // reveal already fired
    if (wasMoved) return;
    // Short tap → flag toggle
    if (canFlag && onFlag && !tile.revealed) {
      if (flagged) sfx.unflag(); else sfx.flag();
      haptic(10);
      onFlag(tile.id);
    }
  }, [clearHold, canFlag, onFlag, tile.id, tile.revealed, flagged]);

  const cancelHold = useCallback((e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    const wasMid = !committedRef.current && holdProgress > 0.1;
    if (wasMid) sfx.cancel();
    clearHold();
  }, [clearHold, holdProgress]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    // If finger drifts far, treat as cancel (not a tap, not a hold commit)
    if (Math.abs(e.movementX) + Math.abs(e.movementY) > 4) {
      movedRef.current = true;
    }
  }, []);

  useEffect(() => () => clearHold(), [clearHold]);

  const style = displayRevealed ? revealedStyle : unrevealedStyle;
  const opacity = displayRevealed && !isSpymaster && tile.color !== "bomb" ? 0.55 : 1;
  const showFlagAffordance = !tile.revealed && (flagged || canFlag);
  const isHolding = holdProgress > 0;

  return (
    <motion.button
      type="button"
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onPointerMove={onMove}
      onContextMenu={(e) => e.preventDefault()}
      animate={
        shake
          ? { x: [0, -6, 6, -5, 5, -3, 3, 0], scaleX: 1 }
          : flipping
            ? { scaleX: [1, 0.04, 0.04, 1], y: 0 }
            : isHolding
              ? { scale: 0.94, y: 2 }
              : { scaleX: 1, scale: 1, y: 0, x: 0 }
      }
      transition={
        shake
          ? { duration: 0.42, ease: "easeInOut" }
          : flipping
            ? { duration: 0.4, times: [0, 0.45, 0.55, 1], ease: "easeInOut" }
            : { type: "spring", stiffness: 480, damping: 28 }
      }
      style={{
        position: "relative",
        background: style.bg,
        color: style.text,
        border: `1.5px solid ${flagged ? "#F59E0B" : style.border}`,
        borderRadius: 8,
        padding: "6px 5px",
        fontSize: tile.word.length > 9 ? 9 : tile.word.length > 7 ? 10 : 11,
        fontWeight: 800,
        textAlign: "center",
        cursor: isInteractive ? "pointer" : "default",
        opacity,
        letterSpacing: 0.6,
        lineHeight: 1.2,
        wordBreak: "break-word",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        textTransform: "uppercase",
        minHeight: 58,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        touchAction: "none",
        overflow: "hidden",
        willChange: "transform",
        boxShadow: tile.revealed
          ? "inset 0 2px 6px rgba(0,0,0,0.28), inset 0 -1px 0 rgba(255,255,255,0.08)"
          : isHolding
            ? "0 1px 2px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.4)"
            : flagged
              ? "0 0 0 2px #F59E0B55, 0 3px 6px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.5)"
              : "0 3px 6px rgba(0,0,0,0.14), 0 1px 2px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.55)",
        transition: "background 0.05s, color 0.05s, border-color 0.12s, box-shadow 0.18s, opacity 0.2s",
      }}
    >
      {/* Subtle top highlight for tactile depth (unrevealed only) */}
      {!displayRevealed && (
        <span
          aria-hidden
          style={{
            position: "absolute", inset: 0, borderRadius: 8, pointerEvents: "none",
            background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 38%)",
          }}
        />
      )}

      {/* Hold progress ring — radial fill from bottom */}
      {isHolding && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0, right: 0, bottom: 0,
            height: `${holdProgress * 100}%`,
            background: holdProgress > 0.6
              ? "linear-gradient(0deg, rgba(220,38,38,0.32), rgba(220,38,38,0.05))"
              : "linear-gradient(0deg, rgba(204,120,92,0.28), rgba(204,120,92,0.04))",
            borderRadius: 8,
            pointerEvents: "none",
            transition: "background 0.15s",
          }}
        />
      )}

      {/* Reveal ripple in tile color */}
      <AnimatePresence>
        {showRipple && (
          <motion.span
            aria-hidden
            initial={{ scale: 0, opacity: 0.55 }}
            animate={{ scale: 3.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: "50%", top: "50%",
              width: 24, height: 24,
              marginLeft: -12, marginTop: -12,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${revealedStyle.glow} 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      <span style={{ position: "relative", zIndex: 1 }}>
        {displayRevealed && tile.color === "bomb"
          ? <span style={{ fontSize: 22, lineHeight: 1 }}>💣</span>
          : tile.word
        }
      </span>

      {/* Flag indicator */}
      {showFlagAffordance && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 3,
            right: 4,
            fontSize: flagged ? 13 : 11,
            lineHeight: 1,
            opacity: flagged ? 1 : 0.45,
            userSelect: "none",
            WebkitUserSelect: "none",
            pointerEvents: "none",
            filter: flagged ? "none" : "grayscale(0.4)",
            zIndex: 2,
          }}
        >
          🚩
        </span>
      )}
    </motion.button>
  );
}

const WordCard = memo(WordCardImpl, (a, b) =>
  a.tile.id === b.tile.id &&
  a.tile.revealed === b.tile.revealed &&
  a.tile.color === b.tile.color &&
  a.tile.word === b.tile.word &&
  a.viewerRole === b.viewerRole &&
  a.viewerTeam === b.viewerTeam &&
  a.activeTeam === b.activeTeam &&
  a.canTap === b.canTap &&
  a.canFlag === b.canFlag &&
  a.flagged === b.flagged &&
  a.onTap === b.onTap &&
  a.onFlag === b.onFlag
);

export default WordCard;
