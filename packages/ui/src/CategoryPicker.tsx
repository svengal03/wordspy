"use client";
import React from "react";
import { WORD_PACKS } from "@playhub/core";
import type { GameId } from "@playhub/core";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Filter packs to only those tagged for this game */
  game?: GameId;
  accent?: string;
  accentBg?: string;
  accentText?: string;
}

const ghostBtn: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 8,
  border: "1.5px solid #E8E5E1",
  background: "transparent",
  color: "#888",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

export function CategoryPicker({ selected, onChange, game }: Props) {
  const packs = game
    ? WORD_PACKS.filter((p) => p.games.includes(game!))
    : WORD_PACKS;

  const packIds = new Set(packs.map((p) => p.id));
  const visibleSelected = selected.filter((id) => packIds.has(id));

  const toggle = (id: string) => {
    if (visibleSelected.includes(id)) {
      if (visibleSelected.length === 1) return;
      onChange(visibleSelected.filter((s) => s !== id));
    } else {
      onChange([...visibleSelected, id]);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Categories</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onChange(packs.map((p) => p.id))} style={ghostBtn}>All</button>
          <button onClick={() => onChange([packs[0]!.id])} style={ghostBtn}>Clear</button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {packs.map((pack) => {
          const active = visibleSelected.includes(pack.id);
          return (
            <button
              key={pack.id}
              onClick={() => toggle(pack.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: active ? "1.5px solid #CC785C" : "1.5px solid #E8E5E1",
                background: active ? "#FAECE7" : "#fff",
                color: active ? "#993C1D" : "#666",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {pack.emoji} {pack.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
