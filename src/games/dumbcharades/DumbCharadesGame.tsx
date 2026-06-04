"use client";
import { useState, useCallback, useEffect } from "react";
import { TeamSetupScreen, TeamAssignScreen, WordReveal, GetReadyScreen } from "@/games/shared";
import { ActingScreen } from "@/games/dumbcharades/components/ActingScreen";
import { RulesModal } from "@/games/dumbcharades/components/RulesModal";
import { RoundResult } from "@playhub/ui/game";
import { GameOver } from "@playhub/ui/game";
import { useGoHome, GameLobbyScreen, tokens, LoadingScreen, EmptyState, Btn, Card, Toggle, Screen, TopBar, OptionsMenu } from "@playhub/ui";
import { TEAM_PALETTE_DUMBCHARADES as TEAM_PALETTE } from "@playhub/core";
import type { GameState, Team, Difficulty } from "@/games/dumbcharades/types";
import { calcScore } from "@/lib/scoringUtils";
import { buildWordPool, pickThree } from "@/lib/wordPoolUtils";
import { useWordPackCache } from "@/hooks/useWordPackCache";

function teamColor(idx: number) {
  return TEAM_PALETTE[idx % TEAM_PALETTE.length]!;
}

const defaultState: GameState = {
  phase: "lobby",
  hostName: "",
  teams: [],
  currentTeamIdx: 0,
  timerDuration: 60,
  selectedPackIds: [],
  currentWord: "",
  wordOptions: ["", "", ""],
  wordPool: [],
  lastRoundCorrect: null,
  pointsLastRound: null,
  roundNumber: 0,
  currentDifficulty: "medium",
  lastDifficulty: null,
  suddenDeathEnabled: false,
  isSuddenDeath: false,
};

const SESSION_KEY = "dc-game-state";

export function DumbCharadesGame() {
  const goHome = useGoHome();
  const [state, setState] = useState<GameState>(() => {
    if (typeof window === "undefined") return defaultState;
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved) as GameState) : defaultState;
    } catch {
      return defaultState;
    }
  });

  const { dbRowsRef, loading: wordsLoading, error: wordsError } = useWordPackCache("dumbcharades");

  useEffect(() => {
    if (state.phase === "lobby" || state.phase === "setup" || state.phase === "team-assign" || state.phase === "get-ready") {
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    }
  }, [state]);

  const handleStart = useCallback((teams: Team[], timerDuration: number, selectedPackIds: string[]) => {
    setState((s) => ({
      ...defaultState,
      phase: "team-assign",
      hostName: s.hostName,
      suddenDeathEnabled: s.suddenDeathEnabled,
      isSuddenDeath: false,
      teams,
      timerDuration,
      selectedPackIds,
    }));
  }, []);

  const handleTeamAssignConfirm = useCallback((teams: Team[]) => {
    const pool = buildWordPool(state.selectedPackIds, dbRowsRef.current, true);
    if (pool.length === 0) return;
    const { options, remaining } = pickThree(pool, state.selectedPackIds, dbRowsRef.current, true);
    setState((s) => ({
      phase: "get-ready",
      hostName: s.hostName,
      teams,
      currentTeamIdx: 0,
      timerDuration: s.timerDuration,
      selectedPackIds: s.selectedPackIds,
      currentWord: "",
      wordOptions: options,
      wordPool: remaining,
      lastRoundCorrect: null,
      pointsLastRound: null,
      roundNumber: 1,
      currentDifficulty: "medium",
      lastDifficulty: null,
      suddenDeathEnabled: s.suddenDeathEnabled,
      isSuddenDeath: false,
    }));
  }, [state.selectedPackIds]);

  const handleGetReadyConfirm = useCallback(() => {
    setState((s) => ({ ...s, phase: "word-reveal" }));
  }, []);

  const handleActingStart = useCallback((word: string, difficulty: Difficulty) => {
    setState((s) => ({ ...s, phase: "acting", currentWord: word, currentDifficulty: difficulty }));
  }, []);

  const handleRoundEnd = useCallback((correct: boolean, timeLeft = 0) => {
    setState((s) => {
      const points = correct ? calcScore(timeLeft, s.timerDuration, s.currentDifficulty) : 0;
      const newTeams = s.teams.map((team, i) =>
        i === s.currentTeamIdx && correct ? { ...team, score: team.score + points } : team
      );
      return { ...s, phase: "round-result", lastRoundCorrect: correct, pointsLastRound: points, teams: newTeams, lastDifficulty: s.currentDifficulty };
    });
  }, []);

  const handleNextRound = useCallback(() => {
    setState((s) => {
      const nextTeamIdx = (s.currentTeamIdx + 1) % s.teams.length;
      const nextTeam = s.teams[nextTeamIdx]!;
      const nextActorIdx = (nextTeam.actorIdx + 1) % Math.max(nextTeam.players.length, 1);
      const updatedTeams = s.teams.map((team, i) =>
        i === nextTeamIdx ? { ...team, actorIdx: nextActorIdx } : team
      );
      const { options, remaining } = pickThree(s.wordPool, s.selectedPackIds, dbRowsRef.current, true);
      return {
        ...s,
        phase: "word-reveal",
        teams: updatedTeams,
        currentTeamIdx: nextTeamIdx,
        currentWord: "",
        wordOptions: options,
        wordPool: remaining,
        lastRoundCorrect: null,
        pointsLastRound: null,
        roundNumber: s.roundNumber + 1,
        lastDifficulty: null,
      };
    });
  }, []);

  const handleEndGame = useCallback(() => {
    setState((s) => {
      if (s.suddenDeathEnabled) {
        const scores = s.teams.map((t) => t.score);
        const max = Math.max(...scores);
        const tied = scores.filter((sc) => sc === max).length > 1;
        if (tied) {
          // Pick next team and word — continue SD until one team pulls ahead
          const nextTeamIdx = (s.currentTeamIdx + 1) % s.teams.length;
          const nextTeam = s.teams[nextTeamIdx]!;
          const nextActorIdx = (nextTeam.actorIdx + 1) % Math.max(nextTeam.players.length, 1);
          const updatedTeams = s.teams.map((team, i) =>
            i === nextTeamIdx ? { ...team, actorIdx: nextActorIdx } : team
          );
          const { options, remaining } = pickThree(s.wordPool, s.selectedPackIds, dbRowsRef.current, true);
          return {
            ...s,
            phase: "word-reveal",
            teams: updatedTeams,
            currentTeamIdx: nextTeamIdx,
            currentWord: "",
            wordOptions: options,
            wordPool: remaining,
            lastRoundCorrect: null,
            pointsLastRound: null,
            roundNumber: s.roundNumber + 1,
            lastDifficulty: null,
            isSuddenDeath: true,
          };
        }
      }
      return { ...s, phase: "game-over" };
    });
  }, []);

  const handleNewGame = useCallback(() => {
    setState((s) => ({
      ...defaultState,
      phase: "setup",
      hostName: s.hostName,
      suddenDeathEnabled: s.suddenDeathEnabled,
      teams: s.teams.map((t) => ({ ...t, score: 0, actorIdx: 0 })),
    }));
  }, []);

  const { phase, teams, currentTeamIdx, timerDuration, currentWord, wordOptions, lastRoundCorrect, lastDifficulty, pointsLastRound, isSuddenDeath } = state;
  const currentTeam = teams[currentTeamIdx];
  const currentActor = currentTeam?.players[currentTeam.actorIdx] ?? "Actor";
  const color = teamColor(currentTeamIdx);

  if (phase === "lobby") {
    return (
      <GameLobbyScreen
        appName="Dumb Charades"
        tagline={<>Act it out. No words.<br /><span style={{ color: tokens.coral }}>Just dumbcharades.</span></>}
        description="Mime it, flail it, crack up everyone. No sounds allowed."
        howItWorks={[
          { icon: "🎬", title: "Pick your teams and a category", desc: "Split into teams and choose what to act out." },
          { icon: "🎭", title: "One player acts it out", desc: "No talking, no sounds. Just wild gestures and desperate faces." },
          { icon: "🏆", title: "Your team guesses", desc: "Get it right before the timer runs out for points." },
        ]}
        onSubmit={(name) => setState((s) => ({ ...s, phase: "options", hostName: name }))}
        onExit={goHome}
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
      />
    );
  }

  if (phase === "options") {
    return (
      <Screen style={{ display: "flex", flexDirection: "column" }}>
        <TopBar
          appName="Dumb Charades"
          right={
            <div style={{ display: "flex", gap: 8 }}>
              <OptionsMenu onNewGame={() => setState((s) => ({ ...s, phase: "lobby" }))} onExit={goHome} />
            </div>
          }
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
          <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, letterSpacing: -0.5, marginBottom: 4 }}>Game Options</div>
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Sudden Death Tiebreaker</div>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 2 }}>If teams are tied at game end, play extra rounds until one team pulls ahead</div>
                </div>
                <Toggle
                  value={state.suddenDeathEnabled}
                  onChange={(v) => setState((s) => ({ ...s, suddenDeathEnabled: v }))}
                />
              </div>
            </Card>
            <Btn fullWidth onClick={() => setState((s) => ({ ...s, phase: "setup" }))} style={{ padding: "15px", fontSize: 16 }}>
              Continue →
            </Btn>
          </div>
        </div>
      </Screen>
    );
  }

  if (phase === "setup") {
    if (wordsLoading) return <LoadingScreen label="Loading word packs…" />;
    if (wordsError) return (
      <EmptyState
        icon="!"
        title="Failed to load word packs"
        body={wordsError}
        action={<Btn onClick={goHome} variant="ghost">← PlayHub</Btn>}
      />
    );
    return (
      <TeamSetupScreen<Team>
        appName="Dumb Charades"
        game="dumbcharades"
        teamPalette={TEAM_PALETTE}
        defaultPackIds={["bollywood", "tollywood", "bollywood-songs", "tollywood-songs"]}
        tagline={<>Act it out. No words. Just<br /><span style={{ color: tokens.coral }}>dumbcharades</span>.</>}
        description="Mime it, flail it, crack up everyone. No sounds allowed."
        buildTeam={(draft, idx) => ({
          name: draft.name || `Team ${idx + 1}`,
          score: 0,
          players: draft.players.filter(Boolean),
          actorIdx: 0,
        })}
        onStart={handleStart}
        onNewGame={handleNewGame}
        hostName={state.hostName}
        initialTeams={teams.length > 0 ? teams : undefined}
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
      />
    );
  }

  if (phase === "team-assign") {
    return (
      <TeamAssignScreen<Team>
        appName="Dumb Charades"
        teams={teams}
        teamPalette={TEAM_PALETTE}
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
        onConfirm={handleTeamAssignConfirm}
        onNewGame={handleNewGame}
      />
    );
  }

  if (phase === "get-ready" && currentTeam) {
    return (
      <GetReadyScreen
        appName="Dumb Charades"
        accentColor={color}
        title={isSuddenDeath ? "Sudden Death!" : "Let the miming begin"}
        subtitle={isSuddenDeath
          ? <><strong style={{ color }}>Tied game</strong> — first team to pull ahead wins. <strong style={{ color }}>{currentTeam.name}</strong> acts next.</>
          : <>First up: <strong style={{ color }}>{currentTeam.name}</strong> — {currentActor} is acting.</>
        }
        hints={[
          { icon: "🎭", text: "No talking, no sounds — gestures only." },
          { icon: "📱", text: "Pass the phone to the actor when ready." },
        ]}
        buttonLabel="Start Round →"
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
        onStart={handleGetReadyConfirm}
        onNewGame={handleNewGame}
      />
    );
  }

  if (phase === "word-reveal" && currentTeam) {
    return (
      <WordReveal
        appName="Dumb Charades"
        playerName={currentActor}
        teamName={currentTeam.name}
        teamColor={color}
        wordOptions={wordOptions}
        phases={["Word Reveal", "Acting", "Results"]}
        actionLabel="Start Acting →"
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
        onReady={handleActingStart}
        onNewGame={handleNewGame}
      />
    );
  }

  if (phase === "acting" && currentTeam) {
    return (
      <ActingScreen
        timerDuration={timerDuration}
        word={currentWord}
        actorName={currentActor}
        teamName={currentTeam.name}
        teamColor={color}
        onCorrect={(tl) => handleRoundEnd(true, tl)}
        onSkip={() => handleRoundEnd(false)}
        onNewGame={handleNewGame}
      />
    );
  }

  if (phase === "round-result") {
    return (
      <RoundResult
        correct={lastRoundCorrect ?? false}
        word={currentWord}
        difficulty={lastDifficulty}
        teams={teams}
        teamColors={teams.map((_, i) => teamColor(i))}
        phases={["Word Reveal", "Acting", "Results"]}
        appName="Dumb Charades"
        actingTeamName={currentTeam?.name}
        actingTeamIdx={currentTeamIdx}
        pointsEarned={pointsLastRound}
        onNext={handleNextRound}
        onEndGame={handleEndGame}
        onNewGame={handleNewGame}
      />
    );
  }

  if (phase === "game-over") {
    return (
      <GameOver
        teams={teams}
        teamColors={teams.map((_, i) => teamColor(i))}
        phases={["Word Reveal", "Acting", "Results"]}
        appName="Dumb Charades"
        onPlayAgain={handleNewGame}
        onHome={goHome}
      />
    );
  }

  return null;
}
