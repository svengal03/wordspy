"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameState, Player } from "@/lib/types";
import { Card, Btn, Avatar, tokens, SectionLabel, InfoBox, TopBar, Screen, OptionsMenu } from "@/components/ui";
import RulesModal from "./RulesModal";
import ChatPanel from "./ChatPanel";
import { PhaseTrail } from "@playhub/ui";

const PHASES = ["Word Reveal", "Clue", "Vote", "Results"];

interface Props {
  gameState: GameState;
  localPlayer: Player;
  isOffline: boolean;
  onSubmitClue: (clue: string) => string | undefined | void | Promise<string | undefined | void>;
  onSendChat: (text: string) => void;
  onStartVoting?: () => void;
  onLeave?: () => void;
  onNewGame?: () => void;
}

export default function CluePhase({ gameState, localPlayer, isOffline, onSubmitClue, onSendChat, onStartVoting, onLeave, onNewGame }: Props) {
  const [clue, setClue] = useState("");
  const [clueError, setClueError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [lastReadCount, setLastReadCount] = useState(0);
  const [clueScreenActive, setClueScreenActive] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const activePlayers = gameState.players.filter((p) => !p.isEliminated);
  const currentPlayer = gameState.players[gameState.currentCluePlayerIndex];
  const isMyTurn = currentPlayer?.id === localPlayer.id;
  const myPlayer = gameState.players.find((p) => p.id === localPlayer.id);
  const isSafeRound = gameState.config.safeRound && gameState.round === 1;
  const allClued = activePlayers.every((p) => p.clue !== null);

  // Reset clue screen when turn changes
  useEffect(() => {
    setClueScreenActive(false);
    setClue("");
    setClueError(null);
  }, [gameState.currentCluePlayerIndex]);

  async function handleSubmit() {
    if (!clue.trim()) return;
    const err = await onSubmitClue(clue.trim());
    if (err) {
      setClueError(err);
    } else {
      setClue("");
      setClueError(null);
      setClueScreenActive(false);
    }
  }

  const topBar = (
    <TopBar
      title={`Round ${gameState.round} — Clue Phase`}
      sub={isSafeRound ? "🛡️ Safe Round — no elimination this round" : undefined}
      right={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setShowRules(true)}
            style={{
              padding: "7px 14px", borderRadius: 10,
              border: `1.5px solid ${tokens.border}`,
              background: tokens.white, cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: tokens.grey1,
              fontFamily: "inherit", transition: "all 0.15s",
            }}
          >
            Rules
          </button>
          {!isOffline && (
            <button
              onClick={() => {
                setShowChat(!showChat);
                if (!showChat) setLastReadCount(gameState.chat.length);
              }}
              style={{
                padding: "6px 12px", borderRadius: 8,
                border: `1.5px solid ${tokens.border}`,
                background: tokens.white, cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: tokens.grey1,
                fontFamily: "inherit", position: "relative",
              }}
            >
              Chat
              {gameState.chat.length > lastReadCount && (
                <span style={{
                  position: "absolute", top: -4, right: -4, width: 10, height: 10,
                  borderRadius: 5, background: tokens.coral, border: "2px solid #fff",
                }} />
              )}
            </button>
          )}
          {onLeave && <OptionsMenu onExit={onLeave} onNewGame={onNewGame} />}
        </div>
      }
    />
  );

  // ── Clue screen (separate view when it's my turn) ──────────────────────────
  if (clueScreenActive && isMyTurn && !currentPlayer?.clue && myPlayer) {
    return (
      <Screen>
        {topBar}
        <PhaseTrail phases={PHASES} current="Clue" accentColor={tokens.coral} />
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>

          <button
            onClick={() => setClueScreenActive(false)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: tokens.grey2,
              padding: "4px 0", fontFamily: "inherit", textAlign: "left", width: "fit-content",
            }}
          >
            ← Back
          </button>

          {/* Word card */}
          <div style={{
            borderRadius: 16,
            background: myPlayer.role === "ghost" ? "#F5F3FF" : tokens.coralBg,
            border: `2px solid ${myPlayer.role === "ghost" ? "#DDD6FE" : tokens.coralBorder}`,
            padding: "20px 24px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, color: myPlayer.role === "ghost" ? "#7C3AED" : tokens.coral }}>
              Your word
            </div>
            {myPlayer.role === "ghost" ? (
              <div style={{ fontSize: 15, fontWeight: 700, color: "#7C3AED" }}>👻 No word — listen and bluff</div>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>{myPlayer.word}</div>
            )}
          </div>

          {/* Clue input */}
          <motion.div key={currentPlayer?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <SectionLabel>Give a Clue</SectionLabel>
              <InfoBox
                icon="💡"
                title="One word only — no spaces"
                body="Give a single-word clue that hints at your word without saying it directly."
              />
              {clueError && (
                <div style={{
                  marginTop: 10, padding: "10px 14px", borderRadius: 10,
                  background: "#FFF0EE", border: `1.5px solid ${tokens.coralBorder}`,
                  fontSize: 13, fontWeight: 600, color: tokens.coral,
                }}>
                  {clueError}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <input
                  key={currentPlayer?.id}
                  value={clue}
                  onChange={(e) => { setClue(e.target.value.replace(/\s/g, "")); setClueError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Your clue…"
                  maxLength={40}
                  autoFocus
                  style={{
                    flex: 1, padding: "12px 14px", borderRadius: 10,
                    border: `1.5px solid ${tokens.coral}`, fontSize: 15,
                    fontFamily: "inherit", outline: "none", color: tokens.black,
                  }}
                />
                <Btn onClick={handleSubmit} disabled={!clue.trim()} style={{ padding: "12px 18px" }}>
                  Submit
                </Btn>
              </div>
              <div style={{ fontSize: 11, color: tokens.grey4, textAlign: "right", marginTop: 4 }}>
                {clue.length}/40
              </div>
            </Card>
          </motion.div>
        </div>
      </Screen>
    );
  }

  // ── Main screen (player list) ──────────────────────────────────────────────
  return (
    <Screen>
      {topBar}
      <PhaseTrail phases={PHASES} current="Clue" accentColor={tokens.coral} />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>

        {/* Spectator banner for eliminated players */}
        {myPlayer?.isEliminated && (
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "#F5F5F5", border: "1.5px solid #E0E0E0",
            textAlign: "center", fontSize: 13, color: tokens.grey2, fontWeight: 500,
          }}>
            You've been eliminated — watching as spectator
          </div>
        )}

        {/* Player clue list */}
        <Card>
          <SectionLabel>Clues This Round</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activePlayers.map((p, i) => {
              const isActive = p.id === currentPlayer?.id;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    borderRadius: 12, background: isActive ? tokens.coralBg : "#FAFAFA",
                    border: `1.5px solid ${isActive ? tokens.coralBorder : "transparent"}`,
                  }}
                >
                  <Avatar name={p.name} size={36} active={isActive} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>{p.name}{p.id === localPlayer.id ? " (you)" : ""}</div>
                    {p.clue ? (
                      <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 1 }}>"{p.clue}"</div>
                    ) : isActive ? (
                      <div style={{ fontSize: 12, color: tokens.coral, fontWeight: 600 }}>Giving clue…</div>
                    ) : (
                      <div style={{ fontSize: 12, color: tokens.grey4 }}>Waiting</div>
                    )}
                  </div>
                  {p.clue && <div style={{ width: 8, height: 8, borderRadius: 4, background: tokens.green, flexShrink: 0 }} />}
                  {isActive && !p.clue && (
                    <div style={{
                      background: tokens.coral, color: "#fff",
                      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 8,
                    }}>NOW</div>
                  )}
                </motion.div>
              );
            })}
            {gameState.players.some((p) => p.isEliminated) && (
              <>
                <div style={{ fontSize: 12, color: tokens.grey4, marginTop: 8, marginBottom: 4 }}>Eliminated</div>
                {gameState.players.filter((p) => p.isEliminated).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                      borderRadius: 12, background: "#F5F5F5", opacity: 0.6,
                      textDecoration: "line-through", color: tokens.grey3,
                    }}
                  >
                    <Avatar name={p.name} size={36} />
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>

        {/* Offline: pass phone to next person when not my turn */}
        {isOffline && !currentPlayer?.clue && !isMyTurn && (
          <Card style={{ background: tokens.coralBg, border: `1.5px solid ${tokens.coralBorder}`, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>
              Pass phone to {currentPlayer?.name}
            </div>
            <div style={{ fontSize: 12, color: tokens.grey2, marginTop: 4 }}>
              They will reveal their word and give a clue
            </div>
          </Card>
        )}

        {/* CTA when it's my turn */}
        {isMyTurn && !currentPlayer?.clue && gameState.phase === "clue" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Btn
              fullWidth
              onClick={() => setClueScreenActive(true)}
              style={{ padding: "15px", fontSize: 15 }}
            >
              {isOffline ? "Reveal & Give Clue →" : "Give Your Clue →"}
            </Btn>
          </motion.div>
        )}

        {/* All clued — move to voting */}
        {allClued && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <InfoBox
              icon="📣"
              title="All clues given!"
              body={isOffline ? "Discuss with the group, then start the vote." : localPlayer.isHost ? "Discuss with the group, then start the vote." : "Waiting for host to start the vote…"}
            />
            {(isOffline || localPlayer.isHost) && onStartVoting && (
              <Btn
                fullWidth
                onClick={onStartVoting}
                style={{ padding: "16px", fontSize: 16, marginTop: 14 }}
              >
                Start Voting →
              </Btn>
            )}
          </motion.div>
        )}

        {/* Chat panel (online only) */}
        {!isOffline && showChat && (
          <ChatPanel
            messages={gameState.chat}
            localPlayer={localPlayer}
            onSend={onSendChat}
          />
        )}
      </div>
    </Screen>
  );
}
