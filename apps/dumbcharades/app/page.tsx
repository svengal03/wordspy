"use client";
import { useState, useCallback } from "react";
import { SetupScreen } from "@/components/SetupScreen";
import { WordReveal } from "@/components/WordReveal";
import { ActingScreen } from "@/components/ActingScreen";
import { RoundResult } from "@/components/RoundResult";
import { GameOver } from "@/components/GameOver";
import { WORD_PACKS } from "@/lib/wordPacks";
import type { GameState, Team, Difficulty } from "@/lib/types";

const TEAM_PALETTE = ["#E85D2F", "#4A6CF7", "#2BB34A", "#9333EA", "#F59E0B", "#06B6D4"];

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
        words.push(pair.civilian);
        words.push(pair.undercover);
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

export default function DumbCharadesPage() {
  const [state, setState] = useState<GameState>(defaultState);

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
      const nextActorIdx = (nextTeam.actorIdx + (nextTeamIdx === 0 ? 1 : 0)) % Math.max(nextTeam.players.length, 1);
      const updatedTeams = s.teams.map((team, i) =>
        i === nextTeamIdx ? { ...team, actorIdx: nextActorIdx } : team
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

  const { phase, teams, currentTeamIdx, timerDuration, currentWord, wordOptions, lastRoundCorrect, lastDifficulty } = state;
  const currentTeam = teams[currentTeamIdx];
  const currentActor = currentTeam?.players[currentTeam.actorIdx] ?? "Actor";
  const color = teamColor(currentTeamIdx);

  if (phase === "setup") return <SetupScreen onStart={handleStart} />;

  if (phase === "word-reveal" && currentTeam) {
    return (
      <WordReveal
        actorName={currentActor}
        teamName={currentTeam.name}
        teamColor={color}
        wordOptions={wordOptions}
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
        onPlayAgain={handleNewGame}
      />
    );
  }

  return null;
}
