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

        {/* Eliminated players only see the progress bar, no voting controls */}
        {isEliminated ? (
          totalVotes >= 1 && (
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
          )
        ) : isOffline && !hasVoted && !voteRevealed ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{ textAlign: "center", padding: "28px 20px" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: tokens.black, marginBottom: 14, letterSpacing: -0.3 }}>
                Pass to {localPlayer.name}
              </div>
              <Btn fullWidth onClick={() => setVoteRevealed(true)} style={{ padding: "14px", fontSize: 15 }}>
                Vote →
              </Btn>
            </Card>
          </motion.div>
        ) : (
          <>
            <Card style={{ background: tokens.coralBg, border: `1.5px solid ${tokens.coralBorder}`, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: tokens.coral }}>
                {localPlayer.name}&apos;s turn
              </div>
            </Card>

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
                              Clue: &quot;{p.clue}&quot;
                            </div>
                          )}
                        </div>
                        {(hasVoted || gameState.config?.showVotesLive) && p.votes > 0 && (
                          <div style={{
                            background: tokens.coral, color: "#fff",
                            fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                          }}>{p.votes} vote{p.votes > 1 ? "s" : ""}</div>
                        )}
                        {isSelected && !hasVoted && <div style={{ width: 10, height: 10, borderRadius: 5, background: tokens.coral, flexShrink: 0 }} />}
                      </motion.button>
                    );
                  })}
              </div>
            </Card>

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
          </>
        )}
      </div>
    </Screen>
  );
}
