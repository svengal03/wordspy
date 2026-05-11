"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameState, Player } from "@/lib/types";
import { Card, Btn, Avatar, tokens, SectionLabel, InfoBox, TopBar, Screen, OptionsMenu } from "@/components/ui";
import RulesModal from "./RulesModal";
import ChatPanel from "./ChatPanel";

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
  // In online mode, word is revealed immediately (no pass-phone step needed)
  const [wordRevealed, setWordRevealed] = useState(!isOffline);
  const [showRules, setShowRules] = useState(false);

  const activePlayers = gameState.players.filter((p) => !p.isEliminated);
  const currentPlayer = gameState.players[gameState.currentCluePlayerIndex];
  const isMyTurn = currentPlayer?.id === localPlayer.id;
  const myPlayer = gameState.players.find((p) => p.id === localPlayer.id);
  const isSafeRound = gameState.config.safeRound && gameState.round === 1;
  const allClued = activePlayers.every((p) => p.clue !== null);

  // Reset word reveal when it's a new player's turn (offline: hide until tap; online: always visible)
  useEffect(() => {
    setWordRevealed(!isOffline);
  }, [gameState.currentCluePlayerIndex, isOffline]);

  async function handleSubmit() {
    if (!clue.trim()) return;
    const err = await onSubmitClue(clue.trim());
    if (err) {
      setClueError(err);
    } else {
      setClue("");
      setClueError(null);
    }
  }

  return (
    <Screen>
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
                    position: "absolute", top: -3, right: -3, width: 7, height: 7,
                    borderRadius: 4, background: tokens.coral,
                  }} />
                )}
              </button>
            )}
            {onLeave && <OptionsMenu onExit={onLeave} onNewGame={onNewGame} />}
          </div>
        }
      />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>

        {/* Round progress — one dot per round played */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {Array.from({ length: gameState.round }, (_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              background: tokens.coral,
            }} />
          ))}
          <div style={{ fontSize: 12, color: tokens.grey3, marginLeft: 4 }}>
            Round {gameState.round}
          </div>
        </div>

        {/* Player clue list — always shown first */}
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

        {/* Offline pass card — reveal word before giving clue */}
        {isOffline && isMyTurn && !currentPlayer?.clue && !wordRevealed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{ textAlign: "center", padding: "20px 18px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: tokens.black, marginBottom: 14, letterSpacing: -0.3 }}>
                Pass to {currentPlayer?.name}
              </div>
              <Btn fullWidth onClick={() => setWordRevealed(true)} style={{ padding: "13px", fontSize: 14 }}>
                Reveal & Give Clue →
              </Btn>
            </Card>
          </motion.div>
        )}

        {/* Offline: pass phone to next person when not your turn */}
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

        {/* My word card — shown after reveal (ghost sees same card with blank word) */}
        {isMyTurn && wordRevealed && myPlayer && !currentPlayer?.clue && (
          <Card style={{ background: tokens.coralBg, border: `1.5px solid ${tokens.coralBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.coral, letterSpacing: 1, textTransform: "uppercase" }}>Your word</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, marginTop: 2 }}>
                  {myPlayer.role === "ghost" ? " " : myPlayer.word}
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3 }}>
                {myPlayer.role === "ghost" ? "WORDSPY" : myPlayer.role.toUpperCase()}
              </div>
            </div>
          </Card>
        )}

        {/* Clue input — only show during clue phase, after word is revealed */}
        {gameState.phase === "clue" && !currentPlayer?.clue && isMyTurn && wordRevealed && (
          <motion.div key={currentPlayer?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <SectionLabel>Give a Clue</SectionLabel>
              <InfoBox
                icon="💡"
                title="One word or short phrase only"
                body={
                  myPlayer?.role === "ghost"
                    ? "You have NO word — make up a convincing clue that fits what you've heard, to avoid being voted out."
                    : myPlayer?.role === "undercover"
                    ? "Your word is similar but different — blend in with the civilians without revealing you're different."
                    : "Be specific enough to prove you know your word, but vague enough that the WordSpy can't guess it."
                }
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
                  onChange={(e) => { setClue(e.target.value); setClueError(null); }}
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
            </Card>
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
