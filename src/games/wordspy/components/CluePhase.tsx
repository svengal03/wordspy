"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameState, Player } from "../types";
import { Card, Btn, Avatar, tokens, SectionLabel, InfoBox, TopBar, Screen, OptionsMenu, NavBtn, PhaseTrail } from "@playhub/ui";
import RulesModal from "./RulesModal";
import ChatPanel from "./ChatPanel";
import { WORDSPY_PHASES } from "../engine";

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
  const [wordRevealed, setWordRevealed] = useState(false);
  const [suspiciousIds, setSuspiciousIds] = useState<Set<string>>(new Set());

  function toggleSuspicion(id: string) {
    setSuspiciousIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

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
    setWordRevealed(false);
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
      appName="Wordspy"
      title={`Round ${gameState.round} — Clue Phase`}
      sub={isSafeRound ? "🛡️ Safe Round — no elimination this round" : undefined}
      right={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
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
    const isGhost = myPlayer.role === "ghost";
    const accent = isGhost ? "#7C3AED" : tokens.coral;
    const accentBg = isGhost ? "#F5F3FF" : tokens.coralBg;
    const accentBorder = isGhost ? "#DDD6FE" : tokens.coralBorder;

    return (
      <Screen>
        {topBar}
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        <div style={{ padding: "12px 20px 24px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 480, margin: "0 auto" }}>

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

          {/* Player hero — confirms identity in offline pass-phone */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <Avatar name={myPlayer.name} size={48} active />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase" }}>
                Your turn
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: tokens.black, letterSpacing: -0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {myPlayer.name}
              </div>
            </div>
          </motion.div>

          {/* Word card — blurred by default in offline so nearby players can't peek */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => isOffline && setWordRevealed((v) => !v)}
            style={{
              position: "relative",
              borderRadius: 18,
              background: accentBg,
              border: `1.5px solid ${accentBorder}`,
              padding: "22px 24px",
              textAlign: "center",
              cursor: isOffline ? "pointer" : "default",
              overflow: "hidden",
              userSelect: "none",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, color: accent }}>
              Your word
            </div>
            <div
              style={{
                filter: isOffline && !wordRevealed ? "blur(14px)" : "none",
                transition: "filter 0.2s ease",
              }}
            >
              {isGhost ? (
                <div style={{ fontSize: 16, fontWeight: 700, color: accent }}>👻 No word — listen & bluff</div>
              ) : (
                <div style={{ fontSize: 30, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>{myPlayer.word}</div>
              )}
            </div>
            {isOffline && (
              <div style={{
                marginTop: 10, fontSize: 12, fontWeight: 600, color: tokens.grey3,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <span>{wordRevealed ? "👁️" : "🙈"}</span>
                <span>Tap to {wordRevealed ? "hide" : "reveal"}</span>
              </div>
            )}
          </motion.div>

          {/* Clue input */}
          <motion.div
            key={currentPlayer?.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: tokens.grey2 }}>
              Give a one-word clue that hints at your word.
            </div>
            <div style={{
              position: "relative",
              borderRadius: 14,
              border: `1.5px solid ${clueError ? tokens.red : clue ? accent : tokens.border}`,
              background: tokens.white,
              transition: "border-color 0.15s ease",
            }}>
              <input
                key={currentPlayer?.id}
                value={clue}
                onChange={(e) => { setClue(e.target.value.replace(/\s/g, "")); setClueError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="One word…"
                maxLength={40}
                autoFocus
                style={{
                  width: "100%", padding: "14px 60px 14px 16px", borderRadius: 14,
                  border: "none", fontSize: 16, fontWeight: 600,
                  fontFamily: "inherit", outline: "none", color: tokens.black,
                  background: "transparent",
                }}
              />
              {clue.length > 25 && (
                <span style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 11, fontWeight: 600, color: clue.length >= 38 ? tokens.red : tokens.grey4,
                  pointerEvents: "none",
                }}>
                  {clue.length}/40
                </span>
              )}
            </div>
            {clueError && (
              <div style={{ fontSize: 13, fontWeight: 500, color: tokens.red, paddingLeft: 4 }}>
                {clueError}
              </div>
            )}
            <Btn fullWidth onClick={handleSubmit} disabled={!clue.trim()} style={{ padding: "15px", fontSize: 16, marginTop: 6 }}>
              Submit Clue →
            </Btn>
          </motion.div>
        </div>
      </Screen>
    );
  }

  // ── Main screen (player list) ──────────────────────────────────────────────
  const cluedCount = activePlayers.filter((p) => p.clue !== null).length;
  const totalCount = activePlayers.length;
  const eliminatedPlayers = gameState.players.filter((p) => p.isEliminated);

  return (
    <Screen>
      {topBar}
      <PhaseTrail phases={WORDSPY_PHASES} current={gameState.phase === "discussion" ? "Discussion" : "Clue"} accentColor={tokens.coral} />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <div style={{ padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>

        {/* Spectator banner for eliminated players */}
        {myPlayer?.isEliminated && (
          <div style={{
            padding: "12px 16px", borderRadius: tokens.radius.lg,
            background: tokens.inputBg, border: `1.5px solid ${tokens.border}`,
            textAlign: "center", fontSize: 13, color: tokens.grey2, fontWeight: 500,
          }}>
            You&apos;ve been eliminated — watching as spectator
          </div>
        )}

        {/* Progress strip */}
        {!allClued && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tokens.grey2 }}>
                Clues given
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: tokens.black }}>
                {cluedCount} <span style={{ color: tokens.grey4, fontWeight: 500 }}>/ {totalCount}</span>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: tokens.inputBg, overflow: "hidden" }}>
              <motion.div
                initial={false}
                animate={{ width: `${(cluedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ height: "100%", background: tokens.coral, borderRadius: 3 }}
              />
            </div>
          </div>
        )}

        {/* Clues list — compact */}
        <Card>
          <SectionLabel>Clues This Round</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {activePlayers.map((p, i) => {
              const isActive = p.id === currentPlayer?.id;
              const isMe = p.id === localPlayer.id;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    borderRadius: 12,
                    background: isActive ? tokens.coralBg : p.clue ? "#FAFAFA" : "transparent",
                    border: `1.5px solid ${isActive ? tokens.coralBorder : "transparent"}`,
                  }}
                >
                  <Avatar name={p.name} size={34} active={isActive} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>{p.name}</span>
                      {isMe && <span style={{ fontSize: 11, color: tokens.grey3, fontWeight: 500 }}>(you)</span>}
                    </div>
                    {p.clue ? (
                      <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        &ldquo;{p.clue}&rdquo;
                      </div>
                    ) : isActive ? (
                      <div style={{ fontSize: 12, color: tokens.coral, fontWeight: 600 }}>Thinking…</div>
                    ) : (
                      <div style={{ fontSize: 12, color: tokens.grey4 }}>Waiting</div>
                    )}
                  </div>
                  {!isMe && (
                    <button
                      onClick={() => toggleSuspicion(p.id)}
                      title={suspiciousIds.has(p.id) ? "Remove suspicion" : "Mark as suspicious"}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
                        background: suspiciousIds.has(p.id) ? "#FEF2F2" : "transparent",
                        fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "background 0.15s",
                      }}
                    >{suspiciousIds.has(p.id) ? "🚨" : "🔍"}</button>
                  )}
                  {p.clue ? (
                    <div style={{
                      width: 22, height: 22, borderRadius: 11, background: tokens.green,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>✓</div>
                  ) : isActive ? (
                    <div style={{
                      background: tokens.coral, color: "#fff",
                      fontSize: 10, fontWeight: 800, letterSpacing: 0.5, padding: "4px 10px", borderRadius: 8, flexShrink: 0,
                    }}>NOW</div>
                  ) : null}
                </motion.div>
              );
            })}
            {eliminatedPlayers.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey4, letterSpacing: 1, textTransform: "uppercase", marginTop: 10, marginBottom: 2, paddingLeft: 4 }}>
                  Eliminated
                </div>
                {eliminatedPlayers.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "8px 12px",
                      borderRadius: 12, opacity: 0.55,
                    }}
                  >
                    <Avatar name={p.name} size={28} eliminated />
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: tokens.grey3, textDecoration: "line-through" }}>{p.name}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>

        {/* Offline: pass phone to next person when not my turn */}
        {isOffline && !currentPlayer?.clue && !isMyTurn && !myPlayer?.isEliminated && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "16px 18px", borderRadius: 14,
              background: tokens.white, border: `1.5px dashed ${tokens.coralBorder}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              Next clue
            </div>
            <div style={{
              fontSize: 17, fontWeight: 800, color: tokens.black, letterSpacing: -0.2,
              wordBreak: "break-word", lineHeight: 1.2,
            }}>
              Pass to {currentPlayer?.name}
            </div>
            <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 4 }}>
              They&apos;ll reveal their word and give a clue
            </div>
          </motion.div>
        )}

        {/* CTA when it's my turn */}
        {isMyTurn && !currentPlayer?.clue && gameState.phase === "clue" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Btn
              fullWidth
              onClick={() => setClueScreenActive(true)}
              style={{ padding: "16px", fontSize: 16 }}
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
