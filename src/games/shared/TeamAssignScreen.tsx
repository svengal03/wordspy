"use client";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Screen, TopBar, Card, Btn, NavBtn, tokens, OptionsMenu, useGoHome, Avatar } from "@playhub/ui";

interface TeamBase {
  name: string;
  players: string[];
}

interface Props<T extends TeamBase> {
  appName: string;
  teams: T[];
  teamPalette: readonly string[];
  rulesModal: (props: { isOpen: boolean; onClose: () => void }) => ReactNode;
  onConfirm: (teams: T[]) => void;
  onNewGame: () => void;
  minPlayersPerTeam?: number;
}

interface PlayerSlot {
  name: string;
  teamIdx: number;
}

export function TeamAssignScreen<T extends TeamBase>({
  appName,
  teams: initialTeams,
  teamPalette,
  rulesModal,
  onConfirm,
  onNewGame,
  minPlayersPerTeam = 1,
}: Props<T>) {
  const goHome = useGoHome();
  const [showRules, setShowRules] = useState(false);

  const [slots, setSlots] = useState<PlayerSlot[]>(() =>
    initialTeams.flatMap((team, ti) =>
      team.players.map((name) => ({ name, teamIdx: ti }))
    )
  );

  function movePlayer(playerName: string, targetTeamIdx: number) {
    setSlots((prev) =>
      prev.map((s) => (s.name === playerName ? { ...s, teamIdx: targetTeamIdx } : s))
    );
  }

  function cycleTeam(playerName: string) {
    setSlots((prev) =>
      prev.map((s) =>
        s.name === playerName
          ? { ...s, teamIdx: (s.teamIdx + 1) % initialTeams.length }
          : s
      )
    );
  }

  function buildTeams(): T[] {
    return initialTeams.map((team, ti) => ({
      ...team,
      players: slots.filter((s) => s.teamIdx === ti).map((s) => s.name),
    })) as T[];
  }

  function canStart() {
    return initialTeams.every(
      (_, ti) => slots.filter((s) => s.teamIdx === ti).length >= minPlayersPerTeam
    );
  }

  const accent = (idx: number) => teamPalette[idx % teamPalette.length]!;

  return (
    <Screen>
      <TopBar
        appName={appName}
        title="Assign Teams"
        sub="Tap Switch to move a player between teams."
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={onNewGame} onExit={goHome} />
          </div>
        }
      />

      {rulesModal({ isOpen: showRules, onClose: () => setShowRules(false) })}

      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        {initialTeams.map((team, ti) => {
          const members = slots.filter((s) => s.teamIdx === ti);
          const color = accent(ti);
          return (
            <motion.div key={ti} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ti * 0.05 }}>
              <Card style={{ borderTop: `4px solid ${color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 12 }}>
                  {team.name} — {members.length} player{members.length !== 1 ? "s" : ""}
                </div>

                {members.length === 0 && (
                  <div style={{ fontSize: 13, color: tokens.grey3, padding: "6px 0 8px" }}>
                    No players yet
                  </div>
                )}

                <AnimatePresence>
                  {members.map((slot, si) => (
                    <motion.div
                      key={`${slot.teamIdx}-${si}-${slot.name}`}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}
                    >
                      <Avatar name={slot.name} size={32} color={color} />
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.black }}>
                        {slot.name}
                      </div>

                      {initialTeams.length === 2 ? (
                        <button
                          onClick={() => cycleTeam(slot.name)}
                          style={{
                            padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: `1.5px solid ${tokens.border}`, background: "transparent",
                            cursor: "pointer", color: tokens.grey2, fontFamily: "inherit",
                          }}
                        >
                          Switch →
                        </button>
                      ) : (
                        <div style={{ display: "flex", gap: 4 }}>
                          {initialTeams.map((t, tIdx) =>
                            tIdx !== ti ? (
                              <button
                                key={tIdx}
                                onClick={() => movePlayer(slot.name, tIdx)}
                                style={{
                                  padding: "4px 8px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                                  border: `1.5px solid ${accent(tIdx)}40`,
                                  background: `${accent(tIdx)}12`,
                                  color: accent(tIdx), cursor: "pointer", fontFamily: "inherit",
                                }}
                              >
                                → {t.name}
                              </button>
                            ) : null
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}

        {!canStart() && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 13, color: tokens.red, textAlign: "center" as const }}>
            Each team needs at least {minPlayersPerTeam} player{minPlayersPerTeam !== 1 ? "s" : ""}
          </motion.div>
        )}

        <Btn fullWidth onClick={() => canStart() && onConfirm(buildTeams())} disabled={!canStart()} style={{ padding: "16px", fontSize: 16 }}>
          Start Game →
        </Btn>
      </div>
    </Screen>
  );
}
