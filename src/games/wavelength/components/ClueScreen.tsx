"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Screen, TopBar, Card, Btn, NavBtn, tokens, RevealCover, OptionsMenu, useGoHome } from "@playhub/ui";
import { WAVELENGTH_TEAM_META } from "@playhub/core";
import { useGame } from "../store";
import { submitClue } from "../engine";
import { RoundBar, SectionLabel } from "./ui";
import RulesModal from "./RulesModal";
import SpectrumDial from "./SpectrumDial";

export default function ClueScreen() {
  const { game, set, restartGame } = useGame();
  const goHome = useGoHome();
  const [revealed, setRevealed] = useState(false);
  const [spun, setSpun] = useState(false);
  const [clue, setClue] = useState("");
  const [showRules, setShowRules] = useState(false);

  const psychic = game.players.find((p) => p.id === game.currentPsychicId);
  const teamMeta = WAVELENGTH_TEAM_META[game.currentTeamId];
  const card = game.currentCard;

  function handleSubmit() {
    if (!clue.trim()) return;
    set(submitClue(game, clue.trim()));
  }

  if (!revealed) {
    return (
      <Screen>
        <TopBar
          appName="Wavelength"
          right={
            <div style={{ display: "flex", gap: 8 }}>
              <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
              <OptionsMenu onNewGame={restartGame} onExit={goHome} />
            </div>
          }
        />
        <RoundBar round={game.round} sub={`${teamMeta.label} — Psychic's turn`} current="Clue" accentColor={teamMeta.color} />
        <div style={{ padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <RevealCover
            playerName={psychic?.name ?? ""}
            label="Pass phone to the Psychic"
            subtitle={`${teamMeta.label} Psychic`}
            lookAwayText="Everyone else look away"
            buttonLabel="Tap to see the spectrum →"
            accentColor={teamMeta.color}
            onReveal={() => setRevealed(true)}
          />
        </div>
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        appName="Wavelength"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={restartGame} onExit={goHome} />
          </div>
        }
      />
      <RoundBar round={game.round} sub={`${teamMeta.label} · ${psychic?.name} is the Psychic`} current="Clue" accentColor={teamMeta.color} />

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Spectrum dial */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <SectionLabel marginBottom={16}>The Spectrum</SectionLabel>
            <SpectrumDial
              left={card?.left ?? ""}
              right={card?.right ?? ""}
              color={teamMeta.color}
              spinZonesTo={game.targetPosition}
              onSpun={() => setSpun(true)}
            />
            {!spun && (
              <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 10, textAlign: "center" }}>
                Spin to reveal where to aim
              </div>
            )}
          </Card>
        </motion.div>

        {/* Clue input — only after spin */}
        {spun && (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <SectionLabel>Your Clue</SectionLabel>
                <input
                  value={clue}
                  onChange={(e) => setClue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  placeholder="One word or short phrase…"
                  autoFocus
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: `1.5px solid ${tokens.border}`, fontSize: 15,
                    fontFamily: "inherit", background: tokens.bg, outline: "none",
                    color: tokens.black, boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 8 }}>
                  Give a clue that points your team to where the needle landed.
                </div>
              </Card>
            </motion.div>

            <Btn fullWidth onClick={handleSubmit} disabled={!clue.trim()} style={{ padding: "16px", fontSize: 16 }}>
              Submit Clue →
            </Btn>
          </>
        )}
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </Screen>
  );
}


