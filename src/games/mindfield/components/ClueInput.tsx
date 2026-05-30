"use client";
import { useState } from "react";
import { Btn, tokens } from "@playhub/ui";
import { validateClue } from "../engine";
import type { Tile } from "../types";

interface Props {
  tiles: Tile[];
  onSubmit: (clue: string, num: number) => void;
}

export default function ClueInput({ tiles, onSubmit }: Props) {
  const [clue, setClue] = useState("");
  const [num, setNum] = useState(2);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const err = validateClue(clue, tiles);
    if (err) { setError(err); return; }
    if (num < 1 || num > 9) { setError("Number must be 1–9"); return; }
    onSubmit(clue.trim(), num);
  }

  return (
    <div style={{
      background: tokens.white,
      border: `1.5px solid ${tokens.coralBorder}`,
      borderRadius: 16,
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: tokens.coral, textTransform: "uppercase", letterSpacing: 1 }}>
        Give your clue
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="One word…"
          value={clue}
          onChange={e => { setClue(e.target.value.replace(/\s/g, "")); setError(null); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{
            flex: 1,
            padding: "11px 14px",
            borderRadius: 10,
            border: `1.5px solid ${error ? "#DC2626" : tokens.border}`,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            outline: "none",
            background: tokens.inputBg,
            color: tokens.black,
          }}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
        />
        <select
          value={num}
          onChange={e => setNum(Number(e.target.value))}
          style={{
            padding: "11px 12px",
            borderRadius: 10,
            border: `1.5px solid ${tokens.border}`,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            background: tokens.inputBg,
            color: tokens.black,
            cursor: "pointer",
          }}
        >
          {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 500 }}>{error}</div>
      )}

      <Btn fullWidth onClick={handleSubmit} disabled={!clue.trim()}>
        Send Clue →
      </Btn>
    </div>
  );
}
