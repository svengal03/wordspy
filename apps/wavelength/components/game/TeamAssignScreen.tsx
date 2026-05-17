"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Screen, TopBar, Card, Btn, NavBtn, tokens, TEAM_META, OptionsMenu } from "@/components/ui";

const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL ?? "https://playhub-home.vercel.app";
import { useGame } from "@/lib/store";
import { startGame } from "@/lib/gameEngine";
import { Player, TeamId } from "@/lib/types";
import RulesModal from "./RulesModal";

export default function TeamAssignScreen() {
  const { game, set, reset } = useGame();
  const [players, setPlayers] = useState<Player[]>(game.players);
  const [showRules, setShowRules] = useState(false);

  const teamA = players.filter((p) => p.teamId === "A");
  const teamB = players.filter((p) => p.teamId === "B");

  function toggleTeam(id: string) {
    setPlayers((prev) =>
      prev.map((p) => p.id === id ? { ...p, teamId: (p.teamId === "A" ? "B" : "A") as TeamId } : p)
    );
  }

  function canStart() {
    return teamA.length >= 2 && teamB.length >= 2;
  }

  function handleStart() {
    if (!canStart()) return;
    const newState = startGame(players, game.config);
    set(newState);
  }

  function renderTeam(teamId: TeamId, members: Player[]) {
    const meta = TEAM_META[teamId];
    return (
      <Card style={{ borderTop: `4px solid ${meta.color}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
          {meta.label} — {members.length} players
        </div>
        {members.length === 0 && (
          <div style={{ fontSize: 13, color: tokens.grey3, padding: "8px 0" }}>No players yet</div>
        )}
        {members.map((p) => (
          <motion.div
            key={p.id}
            layout
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: meta.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: meta.color, flexShrink: 0,
            }}>{p.name.slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.black }}>{p.name}</div>
            <button
              onClick={() => toggleTeam(p.id)}
              style={{
                padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${tokens.border}`, background: "transparent",
                cursor: "pointer", color: tokens.grey2, fontFamily: "inherit",
              }}
            >Switch →</button>
          </motion.div>
        ))}
      </Card>
    );
  }

  return (
    <Screen>
      <TopBar
        appName="Wavelength"
        title="Assign Teams"
        sub="Tap Switch to move a player. Both teams need at least 2."
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={reset} onExit={() => { window.location.href = HOME_URL; }} />
          </div>
        }
      />

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {renderTeam("A", teamA)}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          {renderTeam("B", teamB)}
        </motion.div>

        {!canStart() && (
          <div style={{ fontSize: 13, color: tokens.red, textAlign: "center" }}>
            Each team needs at least 2 players
          </div>
        )}

        <Btn fullWidth onClick={handleStart} disabled={!canStart()} style={{ padding: "16px", fontSize: 16 }}>
          Start Game →
        </Btn>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </Screen>
  );
}
