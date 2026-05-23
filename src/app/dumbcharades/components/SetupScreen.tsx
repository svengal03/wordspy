"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, CategoryPicker, PlayerNameInput, useGoHome } from "@playhub/ui";
import { Btn, Card, NavBtn, OptionsMenu, Screen, TopBar, SectionLabel, tokens } from "@playhub/ui";
import { RulesModal } from "./RulesModal";
import type { Team } from "../lib/types";
import { TIMER_OPTIONS, TEAM_PALETTE_DUMBCHARADES as TEAM_PALETTE } from "@playhub/core";

interface Props {
  onStart: (teams: Team[], timerDuration: number, selectedPackIds: string[]) => void;
  onNewGame?: () => void;
  hostName?: string;
}

interface TeamDraft {
  id: string;
  name: string;
  players: string[];
}

function makeTeam(idx: number): TeamDraft {
  return { id: Math.random().toString(36).slice(2), name: `Team ${idx + 1}`, players: [""] };
}

export function SetupScreen({ onStart, onNewGame, hostName }: Props) {
  const goHome = useGoHome();
  const [teams, setTeams] = useState<TeamDraft[]>([makeTeam(0), makeTeam(1)]);
  const [timerDuration, setTimerDuration] = useState(60);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(["bollywood", "tollywood", "bollywood-songs", "tollywood-songs"]);
  const [showRules, setShowRules] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  function resetForm() {
    setTeams([makeTeam(0), makeTeam(1)]);
    setTimerDuration(60);
    setSelectedPackIds(["bollywood", "tollywood", "bollywood-songs", "tollywood-songs"]);
    setStartError(null);
    onNewGame?.();
  }

  const accent = (idx: number) => TEAM_PALETTE[idx % TEAM_PALETTE.length]!;

  function updateTeamName(ti: number, val: string) {
    setTeams((prev) => prev.map((t, i) => i === ti ? { ...t, name: val } : t));
  }

  function addPlayer(ti: number) {
    setTeams((prev) => prev.map((t, i) => i === ti ? { ...t, players: [...t.players, ""] } : t));
  }

  function updatePlayer(ti: number, pi: number, val: string) {
    setTeams((prev) => prev.map((t, i) => i === ti ? { ...t, players: t.players.map((p, j) => j === pi ? val : p) } : t));
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
    const emptyTeam = builtTeams.find((t) => t.players.length === 0);
    if (emptyTeam) {
      setStartError(`${emptyTeam.name} has no players — add at least one.`);
      return;
    }
    if (selectedPackIds.length === 0) {
      setStartError("Select at least one category.");
      return;
    }
    setStartError(null);
    onStart(builtTeams, timerDuration, selectedPackIds);
  }

  return (
    <Screen>
      <TopBar appName="Dumb Charades" right={
        <div style={{ display: "flex", gap: 8 }}>
          <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
          <OptionsMenu onNewGame={resetForm} onExit={goHome} />
        </div>
      } />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {hostName && (
          <div style={{ paddingTop: 8, fontSize: 13, color: tokens.grey2, fontWeight: 500 }}>
            Hi {hostName}, let&apos;s set up your game.
          </div>
        )}
        <div style={{ paddingTop: hostName ? 4 : 8, fontSize: 36, fontWeight: 800, color: tokens.black, letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 10 }}>
          Act it out. No words. Just<br />
          <span style={{ color: tokens.coral }}>dumbcharades</span>.
        </div>
        <div style={{ fontSize: 14, color: tokens.grey2, lineHeight: 1.5, marginTop: 6 }}>
          Mime it, flail it, crack up everyone. No sounds allowed.
        </div>

        {/* Teams */}
        <AnimatePresence>
          {teams.map((team, ti) => (
            <motion.div key={team.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ delay: ti * 0.04 }}>
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{
                    background: accent(ti) + "18", color: accent(ti),
                    border: `1px solid ${accent(ti)}40`,
                    borderRadius: 8, padding: "3px 10px",
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
                    flexShrink: 0, whiteSpace: "nowrap" as const,
                  }}>Team {ti + 1}</span>
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
                        style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Avatar name={p || `P${pi + 1}`} size={36} color={accent(ti)} />
                        <PlayerNameInput
                          value={p}
                          onChange={(val) => updatePlayer(ti, pi, val)}
                          placeholder={`Player ${pi + 1}`}
                          style={{ flex: 1 }}
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
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600, border: `1.5px solid ${timerDuration === t ? tokens.coral : tokens.border}`, background: timerDuration === t ? "#FAECE7" : "transparent", color: timerDuration === t ? "#993C1D" : tokens.grey1, cursor: "pointer", fontFamily: "inherit" }}
                >{t}s</button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Categories */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CategoryPicker selected={selectedPackIds} onChange={setSelectedPackIds} game="dumbcharades" />
          </Card>
        </motion.div>

        {startError && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "#FFF0EE", border: "1.5px solid #FECACA", fontSize: 13, fontWeight: 600, color: "#E84040" }}>
            {startError}
          </div>
        )}
        <Btn fullWidth onClick={handleStart} style={{ padding: "16px", fontSize: 16 }}>
          Start Game →
        </Btn>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
            How it works
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "🎬", title: "Pick your teams and a category", desc: "Split into teams and choose what to act out." },
              { icon: "🎭", title: "One player acts it out", desc: "No talking, no sounds. Just wild gestures and desperate faces." },
              { icon: "🏆", title: "Your team guesses the movie, song, or phrase", desc: "Get it right before the timer runs out for points." },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: "#F5F0ED",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Screen>
  );
}
