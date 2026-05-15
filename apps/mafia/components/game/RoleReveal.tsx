"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, tokens, ROLE_META, Card, Screen, TopBar, OptionsMenu } from "@/components/ui";
import { RevealCover, PhaseTrail, RevealProgressDots } from "@playhub/ui";
import { useGame } from "@/lib/store";
import { MafiaRole } from "@/lib/types";
import { getMafiaTeammates } from "@/lib/gameEngine";

const ROLE_DESC: Record<MafiaRole, string> = {
  mafia: "Stay hidden. Each night, pick a Villager to eliminate. Win when your numbers match the Villagers.",
  villager: "You have no special power — only your instincts. Find and vote out all Mafia members to win.",
  doctor: "Each night, secretly protect one player. If Mafia targets them, they survive. You cannot protect the same player two nights in a row.",
  police: "Each night, secretly investigate one player. You'll learn if they are Mafia or not.",
  god: "You are the moderator. You do not play — you run the game. Keep the phone during night. Announce eliminations. Stay neutral.",
};

const PHASES = ["Role Reveal", "Night", "Day", "Vote"];

export default function RoleReveal() {
  const { game, set, reset } = useGame();
  const { players, revealIndex } = game;
  const [revealed, setRevealed] = useState(false);

  const currentPlayer = players[revealIndex];
  const isLast = revealIndex === players.length - 1;
  const role = currentPlayer?.role;
  const meta = role ? ROLE_META[role] : null;
  const teammates = role === "mafia" ? getMafiaTeammates(players, currentPlayer.id) : [];
  const isGod = role === "god";

  function handleConfirm() {
    const updated = players.map((p, i) =>
      i === revealIndex ? { ...p, hasSeenRole: true } : p
    );
    setRevealed(false);
    if (isLast) {
      set({ players: updated, phase: "night", nightSubPhase: "sleeping" });
    } else {
      set({ players: updated, revealIndex: revealIndex + 1 });
    }
  }

  if (!currentPlayer) return null;

  const homeUrl = process.env.NEXT_PUBLIC_HOME_URL ?? "https://playhub-home.vercel.app";

  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar
        appName="Mafia"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RevealProgressDots
              total={players.length}
              current={revealIndex}
              accentColor={tokens.coral}
              doneColor={tokens.green}
            />
            <OptionsMenu onNewGame={reset} onExit={() => { window.location.href = homeUrl; }} />
          </div>
        }
      />

      <PhaseTrail phases={PHASES} current="Role Reveal" accentColor={tokens.coral} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 20px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.5, textTransform: "uppercase" }}>
              {revealIndex + 1} of {players.length}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!revealed ? (
              <RevealCover
                key="cover"
                playerName={currentPlayer.name}
                label="Pass phone to"
                lookAwayText="Everyone else look away"
                buttonLabel="Tap to reveal role →"
                accentColor={tokens.coral}
                onReveal={() => setRevealed(true)}
              />
            ) : (
              <motion.div
                key="role"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card style={{ padding: "32px 28px" }}>
                  {/* Role name */}
                  <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 34, fontWeight: 800, color: meta?.color ?? tokens.black, letterSpacing: -0.5 }}>
                      {meta?.label ?? "Unknown"}
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{
                    background: tokens.bg, borderRadius: 14, padding: "16px 18px", marginBottom: 16,
                    fontSize: 15, color: tokens.grey1, lineHeight: 1.6,
                    border: `1px solid ${tokens.border}`,
                  }}>
                    {role ? ROLE_DESC[role] : ""}
                  </div>

                  {/* Mafia teammates */}
                  {teammates.length > 0 && (
                    <div style={{
                      background: tokens.redBg, border: `1px solid #FECACA`,
                      borderRadius: 14, padding: "14px 18px", marginBottom: 16,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: tokens.red, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                        Your Mafia team
                      </div>
                      {teammates.map((name) => (
                        <div key={name} style={{ fontSize: 15, fontWeight: 600, color: tokens.black, marginBottom: 4 }}>
                          {name}
                        </div>
                      ))}
                    </div>
                  )}

                  <Btn fullWidth onClick={handleConfirm}>
                    {isGod
                      ? (isLast ? "Start Game →" : "Next →")
                      : (isLast ? "Start Night →" : "Next →")}
                  </Btn>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Screen>
  );
}
