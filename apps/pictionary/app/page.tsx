"use client";
import { useState, useCallback, useEffect } from "react";
import { SetupScreen } from "@/components/SetupScreen";
import { WordReveal } from "@/components/WordReveal";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { RoundResult } from "@/components/RoundResult";
import { GameOver } from "@/components/GameOver";
import { WORD_PACKS, TEAM_PALETTE_PICTIONARY as TEAM_PALETTE } from "@playhub/core";
import type { GameState, Team, Difficulty } from "@/lib/types";

function teamColor(idx: number) {
  return TEAM_PALETTE[idx % TEAM_PALETTE.length]!;
}

function calcScore(timeLeft: number, timerDuration: number, difficulty: Difficulty): number {
  if (difficulty === "easy") return 1;
  const frac = timeLeft / timerDuration;
  if (difficulty === "medium") {
    if (frac >= 0.66) return 3;
    if (frac >= 0.33) return 2;
    return 1;
  }
  // hard: bigger range, higher floor
  if (frac >= 0.66) return 5;
  if (frac >= 0.33) return 3;
  return 2;
}

function buildWordPool(packIds: string[]): string[] {
  const words: string[] = [];
  for (const pack of WORD_PACKS) {
    if (packIds.includes(pack.id)) {
      for (const pair of pack.pairs) {
        words.push(pair.word1);
        words.push(pair.word2);
      }
    }
  }
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j]!, words[i]!];
  }
  return words;
}

function pickThree(pool: string[], fallback: string[]): { options: [string, string, string]; remaining: string[] } {
  let p = pool.length >= 3 ? pool : [...pool, ...buildWordPool(fallback)];
  // degenerate guard: if pack is tiny, cycle words rather than crash
  while (p.length < 3) p = [...p, ...p];
  const options: [string, string, string] = [p[0]!, p[1]!, p[2]!];
  return { options, remaining: p.slice(3) };
}

const defaultState: GameState = {
  phase: "setup",
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

export default function PictionaryPage() {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window === "undefined") return defaultState;
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved) as GameState) : defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    if (state.phase === "setup") {
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    }
  }, [state]);

  const handleStart = useCallback((teams: Team[], timerDuration: number, selectedPackIds: string[]) => {
    const pool = buildWordPool(selectedPackIds);
    const { options, remaining } = pickThree(pool, selectedPackIds);
    setState({
      phase: "word-reveal",
      teams,
      currentTeamIdx: 0,
      timerDuration,
      selectedPackIds,
      currentWord: "",
      wordOptions: options,
      wordPool: remaining,
      lastRoundCorrect: null,
      roundNumber: 1,
      currentDifficulty: "medium",
      lastDifficulty: null,
    });
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
      const { options, remaining } = pickThree(s.wordPool, s.selectedPackIds);
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
    setState(defaultState);
  }, []);

  const handleSkip = useCallback(() => handleRoundEnd(false), [handleRoundEnd]);

  const { phase, teams, currentTeamIdx, timerDuration, currentWord, wordOptions, lastRoundCorrect, lastDifficulty } = state;
  const currentTeam = teams[currentTeamIdx];
  const currentDrawer = currentTeam?.players[currentTeam.drawerIdx] ?? "Drawer";
  const color = teamColor(currentTeamIdx);

  if (phase === "setup") return <SetupScreen onStart={handleStart} />;

  if (phase === "word-reveal" && currentTeam) {
    return (
      <WordReveal
        drawerName={currentDrawer}
        teamName={currentTeam.name}
        teamColor={color}
        wordOptions={wordOptions}
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
      />
    );
  }

  return null;
}
