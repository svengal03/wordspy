"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameState, Player } from "@/lib/types";
import { Card, Btn, Avatar, tokens, SectionLabel, InfoBox, TopBar, Screen } from "@/components/ui";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  isOffline?: boolean;
  onVote: (targetId: string) => void;
  onContinue?: () => void;
}

export default function VotePhase({ gameState, localPlayer, isOffline = false, onVote, onContinue }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [voteRevealed, setVoteRevealed] = useState(false);

  const activePlayers = gameState.players.filter((p) => !p.isEliminated);
  const myPlayer = gameState.players.find((p) => p.id === localPlayer.id);
  const hasVoted = myPlayer?.hasVoted;
  const totalVotes = activePlayers.reduce((a, p) => a + p.votes, 0);
  const isSafeRound = gameState.config.safeRound && gameState.round === 1;

  // Reset vote UI when it's a new player's turn (offline mode)
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

  if (isSafeRound) {
    return (
      <Screen>
        <TopBar title="Safe Round" sub="No elimination — it's round 1" />
        <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <InfoBox
            icon="🛡️"
            title="Safe Round Active"
            body="No one gets eliminated in round 1. Use this time to observe clues and form your strategy."
            color={tokens.green}
          />
          {localPlayer.isHost && onContinue && (
            <Btn fullWidth onClick={onContinue} style={{ padding: "16px", fontSize: 16 }}>
              Continue to Next Round →
            </Btn>
          )}
        </div>
      </Screen>
    );
  }

  // Transition: Pass phone before voting (offline mode only)
  if (isOffline && !hasVoted && !voteRevealed) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: tokens.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", maxWidth: 360 }}
        >
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
            Pass phone to {localPlayer.name}
          </div>
          <div style={{ fontSize: 15, color: tokens.grey2, marginBottom: 28, lineHeight: 1.6 }}>
            It's time to vote. Make sure nobody else can see the screen, then select who to eliminate.
          </div>
          <Btn
            fullWidth
            onClick={() => setVoteRevealed(true)}
            style={{ padding: "16px", fontSize: 16 }}
          >
            Vote →
          </Btn>
        </motion.div>
      </div>
    );
  }

  return (
    <Screen>
      <TopBar title={`Vote — Round ${gameState.round}`} sub="Who do you think is the Wordspy?" />
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>

        <InfoBox
          icon="🗳️"
          title="Time to vote"
          body="Select the player you think is the Undercover or Ghost. The player with the most votes will be eliminated."
        />

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
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: tokens.black }}>{p.name}</div>
                      {p.clue && (
                        <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 2 }}>
                          Clue: "{p.clue}"
                        </div>
                      )}
                    </div>
                    {/* Vote count (visible after all voted) */}
                    {hasVoted && p.votes > 0 && (
                      <div style={{
                        background: tokens.coral, color: "#fff",
                        fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                      }}>{p.votes} vote{p.votes > 1 ? "s" : ""}</div>
                    )}
                    {isSelected && !hasVoted && <div style={{ fontSize: 20 }}>🎯</div>}
                  </motion.button>
                );
              })}
          </div>
        </Card>

        {/* Vote progress */}
        {totalVotes >= 1 && (
          <Card style={{ textAlign: "center", padding: "14px" }}>
            <div style={{ fontSize: 13, color: tokens.grey2 }}>
              {totalVotes} of {activePlayers.length} player{activePlayers.length > 1 ? "s" : ""} {totalVotes === 1 ? "has" : "have"} voted
            </div>
            <div style={{ height: 6, background: tokens.border, borderRadius: 3, marginTop: 8 }}>
              <div style={{
                height: "100%", borderRadius: 3, background: tokens.coral,
                width: `${(totalVotes / activePlayers.length) * 100}%`,
                transition: "width .3s",
              }} />
            </div>
          </Card>
        )}

        {/* Confirm button */}
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
              body="Waiting for other players to vote…"
              color={tokens.green}
            />
          </motion.div>
        )}
      </div>
    </Screen>
  );
}
