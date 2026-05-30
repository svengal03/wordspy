"use client";
import { useState, useCallback, useEffect } from "react";
import { TeamSetupScreen, TeamAssignScreen, WordReveal, GetReadyScreen } from "@/games/shared";
import { DrawingCanvas } from "@/games/pictionary/components/DrawingCanvas";
import { RulesModal } from "@/games/pictionary/components/RulesModal";
import { RoundResult } from "@playhub/ui/game";
import { GameOver } from "@playhub/ui/game";
import { useGoHome, GameLobbyScreen, tokens, LoadingScreen, EmptyState, Btn } from "@playhub/ui";
import { TEAM_PALETTE_PICTIONARY as TEAM_PALETTE } from "@playhub/core";
import type { GameState, Team, Difficulty } from "@/games/pictionary/types";
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

const SESSION_KEY = "pictionary-game-state";

export function PictionaryGame() {
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

  const { dbRowsRef, loading: wordsLoading, error: wordsError } = useWordPackCache("pictionary");

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
      roundNumber: 1,
      currentDifficulty: "medium",
      lastDifficulty: null,
    }));
  }, [state.selectedPackIds]);

  const handleGetReadyConfirm = useCallback(() => {
    setState((s) => ({ ...s, phase: "word-reveal" }));
  }, []);

  const handleDrawingStart = useCallback((word: string, difficulty: Difficulty) => {
    setState((s) => ({ ...s, phase: "drawing", currentWord: word, currentDifficulty: difficulty }));
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
      const nextDrawerIdx = (nextTeam.drawerIdx + 1) % Math.max(nextTeam.players.length, 1);
      const updatedTeams = s.teams.map((team, i) =>
        i === nextTeamIdx ? { ...team, drawerIdx: nextDrawerIdx } : team
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
      teams: s.teams.map((t) => ({ ...t, score: 0, drawerIdx: 0 })),
    }));
  }, []);

  const handleSkip = useCallback(() => handleRoundEnd(false), [handleRoundEnd]);

  const { phase, teams, currentTeamIdx, timerDuration, currentWord, wordOptions, lastRoundCorrect, lastDifficulty } = state;
  const currentTeam = teams[currentTeamIdx];
  const currentDrawer = currentTeam?.players[currentTeam.drawerIdx] ?? "Drawer";
  const color = teamColor(currentTeamIdx);

  if (phase === "lobby") {
    return (
      <GameLobbyScreen
        appName="Pictionary"
        tagline={<>Draw it. Guess it.<br /><span style={{ color: tokens.coral }}>Pure pictionary.</span></>}
        description="Shapes, stick figures, chaos. No words, no letters."
        howItWorks={[
          { icon: "🖌️", title: "Pick your teams and a category", desc: "Split into teams and pick what to draw from." },
          { icon: "✏️", title: "One player draws, no letters allowed", desc: "Shapes, arrows, stick figures — anything except actual words." },
          { icon: "⏱️", title: "Your team guesses before time runs out", desc: "Get it right for points before the timer hits zero." },
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
        action={<Btn onClick={goHome} variant="ghost">← PlayHub</Btn>}
      />
    );
    return (
      <TeamSetupScreen<Team>
        appName="Pictionary"
        game="pictionary"
        teamPalette={TEAM_PALETTE}
        defaultPackIds={["bollywood", "tollywood", "street-food", "south-indian-usa"]}
        tagline={<>Draw it. Guess it. Pure<br /><span style={{ color: tokens.coral }}>pictionary</span>.</>}
        description="Draw a masterpiece, watch them guess 'stick figure'. Chaotic artistry."
        buildTeam={(draft, idx) => ({
          name: draft.name || `Team ${idx + 1}`,
          score: 0,
          players: draft.players.filter(Boolean),
          drawerIdx: 0,
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
        appName="Pictionary"
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
        appName="Pictionary"
        accentColor={color}
        title="Time to draw"
        subtitle={<>First up: <strong style={{ color }}>{currentTeam.name}</strong> — {currentDrawer} is drawing.</>}
        hints={[
          { icon: "✏️", text: "Shapes and arrows only — no letters or words." },
          { icon: "📱", text: "Pass the phone to the drawer when ready." },
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
        appName="Pictionary"
        playerName={currentDrawer}
        teamName={currentTeam.name}
        teamColor={color}
        wordOptions={wordOptions}
        phases={["Word Reveal", "Drawing", "Results"]}
        actionLabel="Start Drawing →"
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
        onReady={handleDrawingStart}
        onNewGame={handleNewGame}
      />
    );
  }

  if (phase === "drawing" && currentTeam) {
    return (
      <DrawingCanvas
        key={state.roundNumber}
        timerDuration={timerDuration}
        word={currentWord}
        difficulty={state.currentDifficulty}
        drawerName={currentDrawer}
        teamColor={color}
        onCorrect={(tl) => handleRoundEnd(true, tl)}
        onSkip={handleSkip}
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
        phases={["Word Reveal", "Drawing", "Results"]}
        appName="Pictionary"
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
        phases={["Word Reveal", "Drawing", "Results"]}
        appName="Pictionary"
        onPlayAgain={handleNewGame}
        onHome={goHome}
      />
    );
  }

  return null;
}
