"use client";
import { useEffect, useRef, useState } from "react";
import { tokens, OptionsMenu, PlayHubLogo, NavBtn, useGoHome } from "@playhub/ui";
import { RulesModal } from "./RulesModal";
import { PhaseTrail } from "@playhub/ui";

const DC_PHASES = ["Word Reveal", "Acting", "Results"];

interface Props {
  timerDuration: number;
  word: string;
  actorName: string;
  teamName: string;
  teamColor: string;
  onCorrect: (timeLeft: number) => void;
  onSkip: () => void;
  onNewGame: () => void;
}

export function ActingScreen({ timerDuration, word, actorName, teamName, teamColor, onCorrect, onSkip, onNewGame }: Props) {
  const goHome = useGoHome();
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [wordVisible, setWordVisible] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const fired = useRef(false);
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  useEffect(() => {
    fired.current = false;
    const tick = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (fired.current) return 0;
          fired.current = true;
          clearInterval(tick);
          onSkipRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const timerPct = timerDuration > 0 ? timeLeft / timerDuration : 0;
  const timerColor = timerPct > 0.4 ? tokens.green : timerPct > 0.2 ? "#F59E0B" : tokens.red;

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      background: tokens.bg,
    }}>
      {/* TopBar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", background: "#FAFAF8", borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <PlayHubLogo appName="Dumb Charades" />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
          <OptionsMenu onNewGame={onNewGame} onExit={goHome} />
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
            fontSize: 22, fontWeight: 800, color: timerColor,
            background: timerColor + "15", padding: "5px 12px", borderRadius: 8,
            fontVariantNumeric: "tabular-nums",
          }}>{timeLeft}</div>
        </div>
      </div>

      <PhaseTrail phases={DC_PHASES} current="Acting" accentColor={teamColor} />

      {/* Timer bar */}
      <div style={{ height: 3, background: tokens.border }}>
        <div style={{
          height: "100%", width: `${timerPct * 100}%`,
          background: timerColor, transition: "width 1s linear, background 0.3s",
        }} />
      </div>

      {wordVisible && (
        <div style={{
          background: teamColor, color: "#fff", textAlign: "center",
          padding: "10px 16px", fontSize: 15, fontWeight: 700,
        }}>{word}</div>
      )}

      {/* Actor info */}
      <div style={{
        padding: "8px 20px", background: teamColor + "10",
        borderBottom: `1px solid ${teamColor}20`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: teamColor, letterSpacing: 1, textTransform: "uppercase" }}>{teamName}</span>
        <span style={{ fontSize: 11, color: tokens.grey4 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: tokens.black }}>{actorName} is acting</span>
      </div>

      {/* Center */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 32, gap: 24,
      }}>
        {/* Circular timer */}
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: `conic-gradient(${timerColor} ${timerPct * 360}deg, ${tokens.border} 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", background: tokens.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800, color: timerColor,
          }}>{timeLeft}</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: tokens.grey2, marginBottom: 6 }}>Team is guessing</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, letterSpacing: -0.3 }}>Act it out</div>
          <div style={{ fontSize: 13, color: tokens.grey3, marginTop: 6 }}>No talking · No sounds · No mouthing</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => onCorrect(timeLeft)}
          style={{
            width: "100%", padding: "18px 0", borderRadius: 14, border: "none",
            background: tokens.green, color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >Correct ✓</button>
        <button
          onClick={() => { if (!fired.current) { fired.current = true; onSkip(); } }}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 14,
            border: `1.5px solid ${tokens.border}`, background: tokens.white,
            color: tokens.grey2, fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >Skip →</button>
      </div>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
