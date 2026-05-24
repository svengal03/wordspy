"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Screen, TopBar, Card, Btn, Toggle, NavBtn, OptionsMenu, tokens, PlayerNameInput, useGoHome } from "@playhub/ui";
import { useGame } from "../store";
import { createPlayer, assignTeamsRandomly } from "../engine";
import { GameConfig, Player } from "../types";
import { getWavelengthPacks } from "../spectrumCards";
import { SectionLabel } from "./ui";
import RulesModal from "./RulesModal";

export default function SetupScreen() {
  const { game, set } = useGame();
  const goHome = useGoHome();
  const existingNames = game.players.map((p) => p.name);
  const hostSeed = game.hostName && !existingNames.includes(game.hostName) ? [game.hostName] : existingNames;
  const [names, setNames] = useState<string[]>(hostSeed);
  const [input, setInput] = useState("");
  const [config, setConfig] = useState<GameConfig>({ ...game.config });
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);

  // ── Supabase pack list ────────────────────────────────────────────────────
  const [packOptions, setPackOptions] = useState<Awaited<ReturnType<typeof getWavelengthPacks>>>([]);
  useEffect(() => {
    getWavelengthPacks().then((packs) => {
      setPackOptions(packs);
      // Auto-select the first pack if none is set yet
      if (packs.length > 0 && !config.packId) {
        setConfig((c) => ({ ...c, packId: packs[0]!.id }));
      }
    }).catch(console.error);
  }, []);

  function addPlayer() {
    const name = input.trim();
    if (!name) return;
    if (names.length >= 12) return setError("Maximum 12 players");
    if (names.some((n) => n.toLowerCase() === name.toLowerCase())) return setError("Name already taken");
    setNames([...names, name]);
    setInput("");
    setError("");
  }

  function removePlayer(i: number) {
    setNames(names.filter((_, idx) => idx !== i));
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") addPlayer();
  }

  function proceed() {
    if (names.length < 4) return setError("Need at least 4 players");
    const teamA = Math.ceil(names.length / 2);
    const teamB = names.length - teamA;
    if (teamA < 2 || teamB < 2) return setError("Need at least 2 players per team");
    if (!config.packId) return setError("Please select a spectrum pack");

    let players: Player[] = names.map((n) => createPlayer(n, "A"));
    if (config.randomTeams) {
      players = assignTeamsRandomly(players);
    }

    set({ phase: "team-assign", players, config });
  }

  return (
    <Screen>
      <TopBar
        appName="Wavelength"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={() => set({ phase: "lobby" })} onExit={goHome} />
          </div>
        }
      />

      <div style={{ padding: "24px 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 4 }}>
            Add players
          </div>
          <div style={{ fontSize: 14, color: tokens.grey2, lineHeight: 1.6 }}>
            4–12 players. At least 2 per team.
          </div>
        </motion.div>

        {/* Players */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <SectionLabel>Players ({names.length}/12)</SectionLabel>
            {names.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {names.map((name, i) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, background: tokens.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: tokens.grey2, flexShrink: 0,
                    }}>{name.slice(0, 2).toUpperCase()}</div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.black }}>{name}</div>
                    <button
                      onClick={() => removePlayer(i)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${tokens.border}`, background: "transparent", cursor: "pointer", fontSize: 14, color: tokens.grey3 }}
                    >×</button>
                  </motion.div>
                ))}
              </div>
            )}
            {names.length < 12 && (
              <div style={{ display: "flex", gap: 8 }}>
                <PlayerNameInput
                  value={input}
                  onChange={(val) => { setInput(val); setError(""); }}
                  onKeyDown={handleKey}
                  placeholder="Add player…"
                  autoFocus
                  style={{ flex: 1 }}
                />
                <Btn onClick={addPlayer} style={{ padding: "10px 16px", fontSize: 14 }}>Add</Btn>
              </div>
            )}
            {error && <div style={{ marginTop: 8, fontSize: 13, color: tokens.red }}>{error}</div>}
          </Card>
        </motion.div>

        {/* Pack selector */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <SectionLabel>Spectrum Pack</SectionLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {packOptions.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setConfig((c) => ({ ...c, packId: pack.id }))}
                  style={{
                    padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: `1.5px solid ${config.packId === pack.id ? tokens.coral : tokens.border}`,
                    background: config.packId === pack.id ? tokens.accentBg : "transparent",
                    color: config.packId === pack.id ? tokens.coralDark : tokens.grey1,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {pack.emoji} {pack.name}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Options */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Card>
            <SectionLabel marginBottom={14}>Options</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Opposing Bet</div>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 2 }}>Opposing team earns +1 for correct left/right guess</div>
                </div>
                <Toggle value={config.enableOpposingBet} onChange={(v) => setConfig((c) => ({ ...c, enableOpposingBet: v }))} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Random Teams</div>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 2 }}>Auto-assign players to teams</div>
                </div>
                <Toggle value={config.randomTeams} onChange={(v) => setConfig((c) => ({ ...c, randomTeams: v }))} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: config.guessTimerSeconds > 0 ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Guess Timer</div>
                    <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 2 }}>Auto-lock needle when time runs out</div>
                  </div>
                  <Toggle
                    value={config.guessTimerSeconds > 0}
                    onChange={(v) => setConfig((c) => ({ ...c, guessTimerSeconds: v ? 60 : 0 }))}
                  />
                </div>
                {config.guessTimerSeconds > 0 && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {[30, 45, 60, 90].map((s) => (
                      <button
                        key={s}
                        onClick={() => setConfig((c) => ({ ...c, guessTimerSeconds: s }))}
                        style={{
                          flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
                          border: `1.5px solid ${config.guessTimerSeconds === s ? tokens.coral : tokens.border}`,
                          background: config.guessTimerSeconds === s ? tokens.accentBg : "transparent",
                          color: config.guessTimerSeconds === s ? tokens.coralDark : tokens.grey1,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >{s}s</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Target score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card>
            <SectionLabel>Target Score</SectionLabel>
            <div style={{ display: "flex", gap: 8 }}>
              {[8, 10, 12, 15].map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig((c) => ({ ...c, targetScore: s }))}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600,
                    border: `1.5px solid ${config.targetScore === s ? tokens.coral : tokens.border}`,
                    background: config.targetScore === s ? tokens.accentBg : "transparent",
                    color: config.targetScore === s ? tokens.coralDark : tokens.grey1,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >{s}</button>
              ))}
            </div>
          </Card>
        </motion.div>

        <Btn
          fullWidth
          onClick={proceed}
          disabled={names.length < 4}
          style={{ padding: "16px", fontSize: 16 }}
        >
          {names.length < 4 ? `Need ${4 - names.length} more player${4 - names.length !== 1 ? "s" : ""}` : "Set Up Teams →"}
        </Btn>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </Screen>
  );
}
