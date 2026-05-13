"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryPicker } from "./CategoryPicker";
import { Btn, Card, Screen, TopBar, SectionLabel, tokens } from "./ui";
import type { Team } from "@/lib/types";

interface Props {
  onStart: (teams: Team[], timerDuration: number, selectedPackIds: string[]) => void;
}

const TIMER_OPTIONS = [60, 90, 120];
const TEAM_ACCENTS = ["#E85D2F", "#4A6CF7"];

export function SetupScreen({ onStart }: Props) {
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [team1Players, setTeam1Players] = useState<string[]>(["Player 1"]);
  const [team2Players, setTeam2Players] = useState<string[]>(["Player 2"]);
  const [timerDuration, setTimerDuration] = useState(60);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(["bollywood", "tollywood", "south-food", "north-food"]);

  const addPlayer = (team: 1 | 2) => {
    if (team === 1) setTeam1Players((p) => [...p, ""]);
    else setTeam2Players((p) => [...p, ""]);
  };

  const updatePlayer = (team: 1 | 2, idx: number, val: string) => {
    const cleaned = val.replace(/[^a-zA-Z\s]/g, "");
    if (team === 1) setTeam1Players((p) => p.map((n, i) => (i === idx ? cleaned : n)));
    else setTeam2Players((p) => p.map((n, i) => (i === idx ? cleaned : n)));
  };

  const removePlayer = (team: 1 | 2, idx: number) => {
    if (team === 1) {
      if (team1Players.length === 1) return;
      setTeam1Players((p) => p.filter((_, i) => i !== idx));
    } else {
      if (team2Players.length === 1) return;
      setTeam2Players((p) => p.filter((_, i) => i !== idx));
    }
  };

  const handleStart = () => {
    const teams: Team[] = [
      { name: team1Name || "Team 1", score: 0, players: team1Players.filter(Boolean), actorIdx: 0 },
      { name: team2Name || "Team 2", score: 0, players: team2Players.filter(Boolean), actorIdx: 0 },
    ];
    onStart(teams, timerDuration, selectedPackIds);
  };

  return (
    <Screen>
      <TopBar title="Dumb Charades" />

      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Teams */}
        {[
          { num: 1 as const, name: team1Name, players: team1Players, accent: TEAM_ACCENTS[0]! },
          { num: 2 as const, name: team2Name, players: team2Players, accent: TEAM_ACCENTS[1]! },
        ].map(({ num, name, players, accent }) => (
          <motion.div key={num} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (num - 1) * 0.05 }}>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                <input
                  value={name}
                  onChange={(e) => num === 1 ? setTeam1Name(e.target.value.replace(/[^a-zA-Z\s\d]/g, "")) : setTeam2Name(e.target.value.replace(/[^a-zA-Z\s\d]/g, ""))}
                  style={{
                    flex: 1, border: "none", outline: "none",
                    fontSize: 15, fontWeight: 700, color: tokens.black, background: "transparent",
                    fontFamily: "inherit",
                  }}
                  placeholder={`Team ${num}`}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                <AnimatePresence>
                  {players.map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                      style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        value={p}
                        onChange={(e) => updatePlayer(num, i, e.target.value)}
                        style={{
                          flex: 1, padding: "9px 12px", borderRadius: 10,
                          border: `1.5px solid ${tokens.border}`, fontSize: 13,
                          color: tokens.black, outline: "none", background: "#FAFAFA",
                          fontFamily: "inherit",
                        }}
                        placeholder={`Player ${i + 1}`}
                      />
                      {players.length > 1 && (
                        <button
                          onClick={() => removePlayer(num, i)}
                          style={{
                            width: 28, height: 28, borderRadius: 7,
                            border: `1px solid ${tokens.border}`, background: "transparent",
                            cursor: "pointer", fontSize: 14, color: tokens.grey3,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >×</button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <button
                onClick={() => addPlayer(num)}
                style={{
                  padding: "7px 10px", borderRadius: 8,
                  border: `1.5px dashed ${accent}50`,
                  background: "transparent", color: accent,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >+ Add player</button>
            </Card>
          </motion.div>
        ))}

        {/* Timer */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <SectionLabel>Timer</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {TIMER_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimerDuration(t)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600,
                    border: `1.5px solid ${timerDuration === t ? TEAM_ACCENTS[0] : tokens.border}`,
                    background: timerDuration === t ? "#FFF3EF" : "transparent",
                    color: timerDuration === t ? TEAM_ACCENTS[0] : tokens.grey1,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
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
