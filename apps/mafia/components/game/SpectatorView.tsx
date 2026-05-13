"use client";
import { Card, tokens, RoleBadge, ROLE_META } from "@/components/ui";
import { useGame } from "@/lib/store";
import { getLiving } from "@/lib/gameEngine";

export default function SpectatorView() {
  const { game } = useGame();
  const living = getLiving(game.players);
  const dead = game.players.filter((p) => p.isEliminated);
  const mafiaAlive = living.filter((p) => p.role === "mafia").length;
  const othersAlive = living.filter((p) => p.role !== "mafia").length;

  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, padding: "12px", borderRadius: 12, textAlign: "center", background: tokens.redBg, border: "1px solid #FECACA" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: tokens.red }}>{mafiaAlive}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: tokens.red }}>Mafia alive</div>
        </div>
        <div style={{ flex: 1, padding: "12px", borderRadius: 12, textAlign: "center", background: tokens.greenBg, border: "1px solid #BBF7D0" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: tokens.green }}>{othersAlive}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: tokens.green }}>Village alive</div>
        </div>
      </div>
      <Card>
        <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
          Living Players (all roles visible)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {living.map((p) => {
            const meta = p.role ? ROLE_META[p.role] : null;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: meta ? meta.color + "08" : "#F5F5F5" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: meta ? meta.color + "20" : "#EBEBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  {meta?.emoji ?? "?"}
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.black }}>{p.name}</div>
                {p.role && <RoleBadge role={p.role} />}
              </div>
            );
          })}
        </div>
      </Card>
      {dead.length > 0 && (
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
            Eliminated
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dead.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.55 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EBEBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💀</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: tokens.grey2 }}>{p.name}</div>
                {p.role && <RoleBadge role={p.role} />}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
