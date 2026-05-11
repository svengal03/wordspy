"use client";
import { useState } from "react";
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
}

export default function CluePhase({ gameState, localPlayer, isOffline, onSubmitClue, onSendChat }: Props) {
  const [clue, setClue] = useState("");
  const [showChat, setShowChat] = useState(false);

  const activePlayers = gameState.players.filter((p) => !p.isEliminated);
  const currentPlayer = gameState.players[gameState.currentCluePlayerIndex];
  const isMyTurn = currentPlayer?.id === localPlayer.id;
  const myPlayer = gameState.players.find((p) => p.id === localPlayer.id);
  const isSafeRound = gameState.config.safeRound && gameState.round === 1;
  const allClued = activePlayers.every((p) => p.clue !== null);

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
            <button onClick={() => setShowChat(!showChat)} style={{
              background: "none", border: "none", fontSize: 20, cursor: "pointer", position: "relative"
            }}>
              💬
              {gameState.chat.length > 0 && (
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
          {[1, 2, 3, 4].map((r) => (
            <div key={r} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: r <= gameState.round ? tokens.coral : tokens.border,
            }} />
          ))}
        </div>

        {/* My word reminder */}
        {myPlayer && (
          <Card style={{ background: tokens.coralBg, border: `1.5px solid ${tokens.coralBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.coral, letterSpacing: 1, textTransform: "uppercase" }}>Your word</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, marginTop: 2 }}>
                  {myPlayer.role === "ghost" ? "👻 None" : myPlayer.word}
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3 }}>
                {myPlayer.role.toUpperCase()}
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
          </div>
        </Card>

        {/* My turn to clue */}
        {isMyTurn && !myPlayer?.clue && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <SectionLabel>Your Turn — Give a Clue</SectionLabel>
              <InfoBox
                icon="💡"
                title="One word or short phrase only"
                body="Be specific enough to prove you know your word, but vague enough that the Ghost can't guess it."
              />
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <input
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

        {/* All clued — move to discussion */}
        {allClued && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <InfoBox
              icon="🎤"
              title="All clues given!"
              body="Discuss with the group. When ready, the host moves to voting."
            />
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
