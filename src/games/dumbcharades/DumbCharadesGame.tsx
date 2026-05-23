"use client";
import { useState, useCallback, useEffect } from "react";
import { TeamSetupScreen, TeamAssignScreen, WordReveal } from "@/games/shared";
import { ActingScreen } from "@/games/dumbcharades/components/ActingScreen";
import { RulesModal } from "@/games/dumbcharades/components/RulesModal";
import { RoundResult } from "@playhub/ui/game";
import { GameOver } from "@playhub/ui/game";
import { useGoHome, GameLobbyScreen, tokens, LoadingScreen, EmptyState, Btn } from "@playhub/ui";
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
  roundNumber: 0,
  currentDifficulty: "medium",
  lastDifficulty: null,
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
    if (state.phase === "lobby" || state.phase === "setup" || state.phase === "team-assign") {
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
      phase: "word-reveal",
      hostName: s.hostName,
      teams,
      currentTeamIdx: 0,
      timerDuration: s.timerDuration,
      selectedPackIds: s.selectedPackIds,
      currentWord: "",
      wordOptions: options,
      wordPool: remaining,
      lastRoundCorrect: null,
      roundNumber: 1,
      currentDifficulty: "medium",
      lastDifficulty: null,
    }));
  }, [state.selectedPackIds]);

  const handleActingStart = useCallback((word: string, difficulty: Difficulty) => {
    setState((s) => ({ ...s, phase: "acting", currentWord: word, currentDifficulty: difficulty }));
  }, []);

  const handleRoundEnd = useCallback((correct: boolean, timeLeft = 0) => {
    setState((s) => {
      const points = correct ? calcScore(timeLeft, s.timerDuration, s.currentDifficulty) : 0;
      const newTeams = s.teams.map((team, i) =>
        i === s.currentTeamIdx && correct ? { ...team, score: team.score + points } : team
      );
      return { ...s, phase: "round-result", lastRoundCorrect: correct, teams: newTeams, lastDifficulty: s.currentDifficulty };
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
        roundNumber: s.roundNumber + 1,
        lastDifficulty: null,
      };
    });
  }, []);

  const handleEndGame = useCallback(() => {
    setState((s) => ({ ...s, phase: "game-over" }));
  }, []);

  const handleNewGame = useCallback(() => {
    setState((s) => ({
      ...defaultState,
      phase: "setup",
      hostName: s.hostName,
      teams: s.teams.map((t) => ({ ...t, score: 0, actorIdx: 0 })),
    }));
  }, []);

  const { phase, teams, currentTeamIdx, timerDuration, currentWord, wordOptions, lastRoundCorrect, lastDifficulty } = state;
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
        onSubmit={(name) => setState((s) => ({ ...s, phase: "setup", hostName: name }))}
        onExit={goHome}
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
      />
    );
  }

  if (phase === "setup") {
    if (wordsLoading) return <LoadingScreen label="Loading word packs…" />;
    if (wordsError) return (
      <EmptyState
        icon="⚠️"
        title="Failed to load word packs"
        body={wordsError}
        action={<Btn onClick={goHome} variant="ghost">Go home</Btn>}
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
