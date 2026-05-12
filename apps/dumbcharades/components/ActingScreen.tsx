"use client";
import { useEffect, useState } from "react";

interface Props {
  timerDuration: number;
  word: string;
  actorName: string;
  teamName: string;
  teamColor: string;
  onCorrect: () => void;
  onSkip: () => void;
}

export function ActingScreen({ timerDuration, word, actorName, teamName, teamColor, onCorrect, onSkip }: Props) {
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

  const timerPct = timeLeft / timerDuration;
  const timerColor = timerPct > 0.4 ? "#2BB34A" : timerPct > 0.2 ? "#F59E0B" : "#E84040";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Sans', sans-serif",
        background: "#FAFAF8",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "#fff",
          borderBottom: "1.5px solid #E8E5E1",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{actorName}</div>
          <div style={{ fontSize: 11, color: "#888" }}>{teamName} is acting</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setWordVisible((v) => !v)}
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              border: `1.5px solid ${teamColor}`,
              background: "transparent",
              color: teamColor,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {wordVisible ? "Hide" : "Peek"}
          </button>
          <div style={{ fontSize: 26, fontWeight: 800, color: timerColor, minWidth: 40, textAlign: "right" }}>
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ height: 4, background: "#E8E5E1" }}>
        <div
          style={{
            height: "100%",
            width: `${timerPct * 100}%`,
            background: timerColor,
            transition: "width 1s linear, background 0.3s",
          }}
        />
      </div>

      {wordVisible && (
        <div
          style={{
            background: teamColor,
            color: "#fff",
            textAlign: "center",
            padding: "10px 16px",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {word}
        </div>
      )}

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 24,
        }}
      >
        <div style={{ fontSize: 80 }}>🎭</div>

        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "#888" }}>Team is guessing</p>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#1A1A1A",
              letterSpacing: "-0.01em",
            }}
          >
            Act it out!
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#AAA" }}>
            No talking · No sounds · No mouthing
          </p>
        </div>

        {/* Circular timer */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: `conic-gradient(${timerColor} ${timerPct * 360}deg, #E8E5E1 0deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#FAFAF8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              color: timerColor,
            }}
          >
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onCorrect}
          style={{
            width: "100%",
            padding: "18px 0",
            borderRadius: 14,
            border: "none",
            background: "#2BB34A",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Correct ✓
        </button>
        <button
          onClick={onSkip}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
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
      </div>
    </div>
  );
}
