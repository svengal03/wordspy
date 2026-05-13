"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryPicker } from "./CategoryPicker";
import { Btn, Card, Screen, TopBar, SectionLabel, tokens } from "./ui";
import { RulesModal } from "./RulesModal";
import type { Team } from "@/lib/types";

interface Props {
  onStart: (teams: Team[], timerDuration: number, selectedPackIds: string[]) => void;
}

const TIMER_OPTIONS = [60, 90, 120];
const TEAM_PALETTE = ["#E85D2F", "#4A6CF7", "#2BB34A", "#9333EA", "#F59E0B", "#06B6D4"];

interface TeamDraft {
  name: string;
  players: string[];
}

function makeTeam(idx: number): TeamDraft {
  return { name: `Team ${idx + 1}`, players: [""] };
}

export function SetupScreen({ onStart }: Props) {
  const [teams, setTeams] = useState<TeamDraft[]>([makeTeam(0), makeTeam(1)]);
  const [timerDuration, setTimerDuration] = useState(60);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(["bollywood", "tollywood", "south-food", "north-food"]);
  const [showRules, setShowRules] = useState(false);

  const accent = (idx: number) => TEAM_PALETTE[idx % TEAM_PALETTE.length]!;

  function updateTeamName(ti: number, val: string) {
    setTeams((prev) => prev.map((t, i) => i === ti ? { ...t, name: val.replace(/[^a-zA-Z\s\d]/g, "") } : t));
  }

  function addPlayer(ti: number) {
    setTeams((prev) => prev.map((t, i) => i === ti ? { ...t, players: [...t.players, ""] } : t));
  }

  function updatePlayer(ti: number, pi: number, val: string) {
    const cleaned = val.replace(/[^a-zA-Z\s]/g, "");
    setTeams((prev) => prev.map((t, i) => i === ti ? { ...t, players: t.players.map((p, j) => j === pi ? cleaned : p) } : t));
  }

  function removePlayer(ti: number, pi: number) {
    setTeams((prev) => prev.map((t, i) => {
      if (i !== ti || t.players.length <= 1) return t;
      return { ...t, players: t.players.filter((_, j) => j !== pi) };
    }));
  }

  function addTeam() {
    if (teams.length >= 6) return;
    setTeams((prev) => [...prev, makeTeam(prev.length)]);
  }

  function removeTeam(ti: number) {
    if (teams.length <= 2) return;
    setTeams((prev) => prev.filter((_, i) => i !== ti));
  }

  function handleStart() {
    const builtTeams: Team[] = teams.map((t) => ({
      name: t.name || `Team ${teams.indexOf(t) + 1}`,
      score: 0,
      players: t.players.filter(Boolean),
      actorIdx: 0,
    }));
    onStart(builtTeams, timerDuration, selectedPackIds);
  }

  return (
    <Screen>
      <TopBar
        title="Dumb Charades"
        right={
          <button
            onClick={() => setShowRules(true)}
            style={{ padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${tokens.border}`, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: tokens.grey1, fontFamily: "inherit" }}
          >Rules</button>
        }
      />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Teams */}
        <AnimatePresence>
          {teams.map((team, ti) => (
            <motion.div key={ti} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ delay: ti * 0.04 }}>
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent(ti), flexShrink: 0 }} />
                  <input
                    value={team.name}
                    onChange={(e) => updateTeamName(ti, e.target.value)}
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontWeight: 700, color: tokens.black, background: "transparent", fontFamily: "inherit" }}
                    placeholder={`Team ${ti + 1}`}
                  />
                  {teams.length > 2 && (
                    <button
                      onClick={() => removeTeam(ti)}
                      style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${tokens.border}`, background: "transparent", cursor: "pointer", fontSize: 14, color: tokens.grey3, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >×</button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  <AnimatePresence>
                    {team.players.map((p, pi) => (
                      <motion.div key={pi} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                        style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          value={p}
                          onChange={(e) => updatePlayer(ti, pi, e.target.value)}
                          style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${tokens.border}`, fontSize: 13, color: tokens.black, outline: "none", background: "#FAFAFA", fontFamily: "inherit" }}
                          placeholder={`Player ${pi + 1}`}
                        />
                        {team.players.length > 1 && (
                          <button
                            onClick={() => removePlayer(ti, pi)}
                            style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${tokens.border}`, background: "transparent", cursor: "pointer", fontSize: 14, color: tokens.grey3, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >×</button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => addPlayer(ti)}
                  style={{ padding: "7px 10px", borderRadius: 8, border: `1.5px dashed ${accent(ti)}50`, background: "transparent", color: accent(ti), fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >+ Add player</button>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Team */}
        {teams.length < 6 && (
          <button
            onClick={addTeam}
            style={{ padding: "12px", borderRadius: 14, border: `1.5px dashed ${tokens.border}`, background: "transparent", color: tokens.grey2, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >+ Add Team</button>
        )}

        {/* Timer */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <SectionLabel>Timer</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {TIMER_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimerDuration(t)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600, border: `1.5px solid ${timerDuration === t ? TEAM_PALETTE[0] : tokens.border}`, background: timerDuration === t ? "#FFF3EF" : "transparent", color: timerDuration === t ? TEAM_PALETTE[0] : tokens.grey1, cursor: "pointer", fontFamily: "inherit" }}
                >{t}s</button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Categories */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CategoryPicker selected={selectedPackIds} onChange={setSelectedPackIds} />
          </Card>
        </motion.div>

        <Btn fullWidth onClick={handleStart} style={{ padding: "16px", fontSize: 16 }}>
          Start Game →
        </Btn>
      </div>
    </Screen>
  );
}
