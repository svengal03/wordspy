"use client";
import { WORD_PACKS } from "@playhub/core";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
  accent?: string;
  accentBg?: string;
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

export function CategoryPicker({ selected, onChange, accent = "#4A6CF7", accentBg = "#EEF2FF" }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length === 1) return;
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Categories</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onChange(WORD_PACKS.map((p) => p.id))} style={ghostBtn}>All</button>
          <button onClick={() => onChange([WORD_PACKS[0]!.id])} style={ghostBtn}>Clear</button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {WORD_PACKS.map((pack) => {
          const active = selected.includes(pack.id);
          return (
            <button
              key={pack.id}
              onClick={() => toggle(pack.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: active ? `1.5px solid ${accent}` : "1.5px solid #E8E5E1",
                background: active ? accentBg : "#fff",
                color: active ? accent : "#666",
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
