"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameState, Player } from "@/lib/types";
import { Card, Btn, Avatar, tokens, SectionLabel, InfoBox, TopBar, Screen } from "@/components/ui";
import ChatPanel from "./ChatPanel";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  isOffline: boolean;
  onSubmitClue: (clue: string) => void;
  onSendChat: (text: string) => void;
  onStartVoting?: () => void;
}

export default function CluePhase({ gameState, localPlayer, isOffline, onSubmitClue, onSendChat, onStartVoting }: Props) {
  const [clue, setClue] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [lastReadCount, setLastReadCount] = useState(0);
  const [wordRevealed, setWordRevealed] = useState(false);

  const activePlayers = gameState.players.filter((p) => !p.isEliminated);
  const currentPlayer = gameState.players[gameState.currentCluePlayerIndex];
  const isMyTurn = currentPlayer?.id === localPlayer.id;
  const myPlayer = gameState.players.find((p) => p.id === localPlayer.id);
  const isSafeRound = gameState.config.safeRound && gameState.round === 1;
  const allClued = activePlayers.every((p) => p.clue !== null);

  // Reset word reveal when it's a new player's turn
  useEffect(() => {
    setWordRevealed(false);
  }, [gameState.currentCluePlayerIndex]);

  function handleSubmit() {
    if (!clue.trim()) return;
    onSubmitClue(clue.trim());
    setClue("");
  }

  return (
    <Screen>
      <TopBar
        title={`Round ${gameState.round} — Clue Phase`}
        sub={isSafeRound ? "🛡️ Safe Round — no elimination this round" : undefined}
        right={
          !isOffline ? (
            <button
              onClick={() => {
                setShowChat(!showChat);
                if (!showChat) setLastReadCount(gameState.chat.length);
              }}
              style={{
                background: "none", border: "none", fontSize: 20, cursor: "pointer", position: "relative"
              }}
            >
              💬
              {gameState.chat.length > lastReadCount && (
                <span style={{
                  position: "absolute", top: -4, right: -4, width: 8, height: 8,
                  borderRadius: 4, background: tokens.coral,
                }} />
              )}
            </button>
          ) : undefined
        }
      />

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>

        {/* Round progress */}
        <div style={{ display: "flex", gap: 5 }}>
          {Array.from({ length: Math.max(4, gameState.round + 1) }, (_, i) => i + 1).map((r) => (
            <div key={r} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: r <= gameState.round ? tokens.coral : tokens.border,
            }} />
          ))}
        </div>

        {/* Transition: Reveal word (only on current player's turn, before they give clue) */}
        {isMyTurn && !currentPlayer?.clue && !wordRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: tokens.bg,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              zIndex: 1000,
            }}
          >
            <div style={{ textAlign: "center", maxWidth: 360 }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: 28,
                background: "#F5F0ED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                margin: "0 auto 20px",
                border: `3px dashed ${tokens.coral}40`,
              }}>📱</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, marginBottom: 6, letterSpacing: -0.5 }}>
                Pass phone to {currentPlayer?.name}
              </div>
              <div style={{ fontSize: 15, color: tokens.grey2, marginBottom: 28, lineHeight: 1.6 }}>
                {isOffline ? "Make sure nobody else can see the screen, then tap to reveal your word and give a clue." : "Tap to reveal your word and give your clue."}
              </div>
              <Btn
                fullWidth
                onClick={() => setWordRevealed(true)}
                style={{ padding: "16px", fontSize: 16 }}
              >
                Give Clue →
              </Btn>
            </div>
          </motion.div>
        )}

        {/* My word — shown after reveal during current turn */}
        {isMyTurn && wordRevealed && myPlayer && myPlayer.word !== null && !currentPlayer?.clue && (
          <Card style={{ background: tokens.coralBg, border: `1.5px solid ${tokens.coralBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.coral, letterSpacing: 1, textTransform: "uppercase" }}>Your word</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, marginTop: 2 }}>
                  {myPlayer.word}
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3 }}>
                {myPlayer.role.toUpperCase()}
              </div>
            </div>
          </Card>
        )}

        {/* Ghost has no word */}
        {isMyTurn && wordRevealed && myPlayer && myPlayer.role === "ghost" && !currentPlayer?.clue && (
          <Card style={{ background: "rgba(139, 69, 19, 0.08)", border: `1.5px solid rgba(139, 69, 19, 0.2)` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey2, letterSpacing: 1, textTransform: "uppercase" }}>Your role</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, marginTop: 2 }}>
                  👻 Ghost
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3 }}>
                LISTEN & GUESS
              </div>
            </div>
          </Card>
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
                  {p.clue && <div style={{ fontSize: 16 }}>✅</div>}
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

        {/* Clue input — only show after word is revealed */}
        {!currentPlayer?.clue && isMyTurn && wordRevealed && (
          <motion.div key={currentPlayer?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <SectionLabel>Give a Clue</SectionLabel>
              <InfoBox
                icon="💡"
                title="One word or short phrase only"
                body="Be specific enough to prove you know your word, but vague enough that the Ghost can't guess it."
              />
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <input
                  key={currentPlayer?.id}
                  value={clue}
                  onChange={(e) => setClue(e.target.value)}
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

        {/* Offline mode: show who's giving clue if not your turn */}
        {isOffline && !currentPlayer?.clue && !isMyTurn && (
          <Card style={{ background: tokens.coralBg, border: `1.5px solid ${tokens.coralBorder}`, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>
              📱 Pass phone to {currentPlayer?.name}
            </div>
            <div style={{ fontSize: 12, color: tokens.grey2, marginTop: 4 }}>
              They will reveal their word and give a clue
            </div>
          </Card>
        )}

        {/* All clued — move to voting */}
        {allClued && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <InfoBox
              icon="🎤"
              title="All clues given!"
              body={localPlayer.isHost ? "Discuss with the group, then start the vote." : "Waiting for host to start the vote…"}
            />
            {localPlayer.isHost && onStartVoting && (
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
