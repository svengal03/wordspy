"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameState, Player } from "../types";
import { Card, Btn, Avatar, tokens, SectionLabel, InfoBox, TopBar, Screen, OptionsMenu, NavBtn, PhaseTrail } from "@playhub/ui";
import RulesModal from "./RulesModal";
import { WORDSPY_PHASES } from "../engine";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  isOffline?: boolean;
  onVote: (targetId: string) => void;
  onContinue?: () => void;
  onLeave?: () => void;
  onNewGame?: () => void;
}

export default function VotePhase({ gameState, localPlayer, isOffline = false, onVote, onContinue, onLeave, onNewGame }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [voteRevealed, setVoteRevealed] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const activePlayers = gameState.players.filter((p) => !p.isEliminated);
  const myPlayer = gameState.players.find((p) => p.id === localPlayer.id);
  const hasVoted = myPlayer?.hasVoted;
  const isEliminated = myPlayer?.isEliminated ?? false;
  const totalVotes = activePlayers.reduce((a, p) => a + p.votes, 0);
  const isSafeRound = gameState.config.safeRound && gameState.round === 1;
  const showLiveTally = isOffline || gameState.config?.showVotesLive || hasVoted;

  // Voter rail: round-the-table progress
  const voterRail = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: tokens.grey2 }}>Voting round</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: tokens.black }}>
          {totalVotes} <span style={{ color: tokens.grey4, fontWeight: 500 }}>/ {activePlayers.length}</span>
        </div>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${activePlayers.length}, minmax(0, 1fr))`,
        gap: 4, paddingTop: 4,
      }}>
        {activePlayers.map((p) => {
          const voted = p.hasVoted;
          const isCurrent = isOffline ? p.id === localPlayer.id && !voted && !confirmed : false;
          return (
            <div key={p.id} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0,
            }}>
              <div style={{
                position: "relative",
                opacity: voted || isCurrent ? 1 : 0.4,
                transition: "opacity .2s",
              }}>
                <Avatar name={p.name} size={36} active={isCurrent} />
                {voted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    style={{
                      position: "absolute", bottom: -2, right: -2,
                      width: 16, height: 16, borderRadius: 8,
                      background: tokens.green, border: "2px solid #fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 9, fontWeight: 800,
                    }}
                  >✓</motion.div>
                )}
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    style={{
                      position: "absolute", inset: -4, borderRadius: 12,
                      border: `2px solid ${tokens.coral}`, pointerEvents: "none",
                    }}
                  />
                )}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 600, lineHeight: 1.2, textAlign: "center",
                color: voted ? tokens.grey3 : isCurrent ? tokens.coral : tokens.grey4,
                width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{p.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  useEffect(() => {
    setVoteRevealed(false);
    setSelected(null);
    setConfirmed(false);
  }, [localPlayer.id]);

  function handleConfirm() {
    if (!selected) return;
    setConfirmed(true);
    onVote(selected);
  }

  const topBarRight = (
    <div style={{ display: "flex", gap: 8 }}>
      <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
      {onLeave && <OptionsMenu onExit={onLeave} onNewGame={onNewGame} />}
    </div>
  );

  if (isSafeRound) {
    return (
      <Screen style={{ background: tokens.greenBg }}>
        <TopBar
          appName="Wordspy"
          title={`Vote Phase — Round ${gameState.round}`}
          sub="Safe round — no elimination this round"
          right={topBarRight}
        />
        <PhaseTrail phases={WORDSPY_PHASES} current="Vote" accentColor={tokens.coral} />
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <InfoBox
            icon="🛡️"
            title="Safe Round Active"
            body="No one gets eliminated in round 1. Use this time to observe clues and form your strategy."
            color={tokens.green}
          />
          {(isOffline || localPlayer.isHost) && onContinue && (
            <Btn fullWidth onClick={onContinue} style={{ padding: "16px", fontSize: 16 }}>
              Continue to Next Round →
            </Btn>
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        appName="Wordspy"
        title={`Vote Phase — Round ${gameState.round}`}
        sub={gameState.isTiebreaker ? "⚖️ Tiebreaker — tied players re-clued, vote again!" : "Who do you think is Undercover or Mr. Phantom?"}
        right={topBarRight}
      />
      <PhaseTrail phases={WORDSPY_PHASES} current="Vote" accentColor={tokens.coral} />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>

        {isEliminated ? (
          <InfoBox
            icon="👁️"
            title="You're eliminated — spectating"
            body="Sit back and watch how the remaining players vote."
            color={tokens.grey2}
          />
        ) : (
          <InfoBox
            icon="🗳️"
            title="Time to vote"
            body="Select the player you think is the Undercover or Mr. Phantom. The player with the most votes will be eliminated."
          />
        )}

        {gameState.isTiebreaker && (
          <InfoBox
            icon="⚖️"
            title="Tiebreaker!"
            body="Last vote was a tie. The tied players have given new clues — now vote again to break the tie."
            color={tokens.coral}
          />
        )}

        {voterRail}

        {/* Eliminated players spectate — voter rail above already shows progress */}
        {isEliminated ? null : isOffline && !hasVoted && !voteRevealed ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "20px 18px", borderRadius: 16,
              background: tokens.white, border: `1.5px dashed ${tokens.coralBorder}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              Next voter
            </div>
            <div style={{
              fontSize: 20, fontWeight: 800, color: tokens.black, letterSpacing: -0.3,
              wordBreak: "break-word", lineHeight: 1.2,
            }}>
              Pass to {localPlayer.name}
            </div>
            <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 4, marginBottom: 14 }}>
              Their turn to cast a vote
            </div>
            <Btn fullWidth onClick={() => setVoteRevealed(true)} style={{ padding: "14px", fontSize: 15 }}>
              I&apos;m {localPlayer.name} →
            </Btn>
          </motion.div>
        ) : (
          <>
            <Card>
              <SectionLabel>Choose Wisely</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activePlayers
                  .filter((p) => !p.isEliminated && p.id !== localPlayer.id)
                  .map((p, i) => {
                    const isSelected = selected === p.id;
                    return (
                      <motion.button
                        key={p.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => !hasVoted && !confirmed && setSelected(p.id)}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "14px",
                          borderRadius: 14, border: `2px solid ${isSelected ? tokens.coral : tokens.border}`,
                          background: isSelected ? tokens.coralBg : "#FAFAFA",
                          cursor: hasVoted || confirmed ? "default" : "pointer",
                          textAlign: "left", width: "100%", transition: "all .15s",
                        }}
                      >
                        <Avatar name={p.name} size={44} active={isSelected} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: tokens.black, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                          {p.clue && (
                            <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              &ldquo;{p.clue}&rdquo;
                            </div>
                          )}
                          {showLiveTally && p.votes > 0 && (
                            <div style={{ display: "flex", gap: 4, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                                {Array.from({ length: p.votes }).map((_, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ scale: 0, y: -4 }}
                                    animate={{ scale: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 20, delay: idx * 0.04 }}
                                    style={{
                                      width: 10, height: 10, borderRadius: 5,
                                      background: tokens.coral,
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                    }}
                                  />
                                ))}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: tokens.coral, marginLeft: 2 }}>
                                {p.votes} vote{p.votes > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                        {isSelected && !hasVoted && (
                          <div style={{
                            width: 24, height: 24, borderRadius: 12, background: tokens.coral,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: 13, fontWeight: 800, flexShrink: 0,
                          }}>✓</div>
                        )}
                      </motion.button>
                    );
                  })}
              </div>
            </Card>

            {!hasVoted && !confirmed && (
              <Btn
                fullWidth
                variant={selected ? "primary" : "ghost"}
                onClick={handleConfirm}
                disabled={!selected}
                style={{ padding: "16px", fontSize: 16 }}
              >
                {selected
                  ? `Vote to eliminate ${activePlayers.find((p) => p.id === selected)?.name} →`
                  : "Select a player to vote"}
              </Btn>
            )}

            {(hasVoted || confirmed) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <InfoBox
                  icon="✅"
                  title="Vote cast!"
                  body={isOffline ? "Pass the phone to the next player." : "Waiting for other players to vote…"}
                  color={tokens.green}
                />
              </motion.div>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}
