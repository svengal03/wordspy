"use client";
import { useState, useCallback } from "react";
import { SetupScreen } from "@/components/SetupScreen";
import { WordReveal } from "@/components/WordReveal";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { RoundResult } from "@/components/RoundResult";
import { GameOver } from "@/components/GameOver";
import { WORD_PACKS } from "@/lib/wordPacks";
import type { GameState, Team, Phase } from "@/lib/types";

const TEAM_COLORS = ["#4A6CF7", "#E85D2F"];

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

const defaultState: GameState = {
  phase: "setup",
  teams: [],
  currentTeamIdx: 0,
  timerDuration: 60,
  selectedPackIds: [],
  currentWord: "",
  wordPool: [],
  lastRoundCorrect: null,
  roundNumber: 0,
};

export default function PictionaryPage() {
  const [state, setState] = useState<GameState>(defaultState);

  const handleStart = useCallback((teams: Team[], timerDuration: number, selectedPackIds: string[]) => {
    const pool = buildWordPool(selectedPackIds);
    setState({
      phase: "word-reveal",
      teams,
      currentTeamIdx: 0,
      timerDuration,
      selectedPackIds,
      currentWord: pool[0] ?? "Lagaan",
      wordPool: pool.slice(1),
      lastRoundCorrect: null,
      roundNumber: 1,
    });
  }, []);

  const handleDrawingStart = useCallback(() => {
    setState((s) => ({ ...s, phase: "drawing" }));
  }, []);

  const handleRoundEnd = useCallback((correct: boolean) => {
    setState((s) => {
      const newTeams = s.teams.map((team, i) => {
        if (i === s.currentTeamIdx && correct) {
          return { ...team, score: team.score + 1 };
        }
        return team;
      });
      return { ...s, phase: "round-result", lastRoundCorrect: correct, teams: newTeams };
    });
  }, []);

  const handleNextRound = useCallback(() => {
    setState((s) => {
      const nextTeamIdx = (s.currentTeamIdx + 1) % s.teams.length;
      const nextTeam = s.teams[nextTeamIdx]!;
      const nextDrawerIdx = (nextTeam.drawerIdx + (nextTeamIdx === 0 ? 1 : 0)) % nextTeam.players.length;

      const updatedTeams = s.teams.map((team, i) => {
        if (i === nextTeamIdx) {
          return { ...team, drawerIdx: nextDrawerIdx };
        }
        return team;
      });

      let pool = s.wordPool;
      let word = pool[0];
      if (!word) {
        pool = buildWordPool(s.selectedPackIds);
        word = pool[0] ?? "Dosa";
      }

      return {
        ...s,
        phase: "word-reveal",
        teams: updatedTeams,
        currentTeamIdx: nextTeamIdx,
        currentWord: word,
        wordPool: pool.slice(1),
        lastRoundCorrect: null,
        roundNumber: s.roundNumber + 1,
      };
    });
  }, []);

  const handleEndGame = useCallback(() => {
    setState((s) => ({ ...s, phase: "game-over" }));
  }, []);

  const handlePlayAgain = useCallback(() => {
    setState(defaultState);
  }, []);

  const { phase, teams, currentTeamIdx, timerDuration, currentWord, lastRoundCorrect } = state;
  const currentTeam = teams[currentTeamIdx];
  const currentDrawer = currentTeam?.players[currentTeam.drawerIdx] ?? "Drawer";

  if (phase === "setup") {
    return <SetupScreen onStart={handleStart} />;
  }

  if (phase === "word-reveal" && currentTeam) {
    return (
      <WordReveal
        drawerName={currentDrawer}
        teamName={currentTeam.name}
        teamColor={TEAM_COLORS[currentTeamIdx] ?? "#4A6CF7"}
        word={currentWord}
        onReady={handleDrawingStart}
      />
    );
  }

  if (phase === "drawing" && currentTeam) {
    return (
      <DrawingCanvas
        timerDuration={timerDuration}
        word={currentWord}
        drawerName={currentDrawer}
        teamColor={TEAM_COLORS[currentTeamIdx] ?? "#4A6CF7"}
        onCorrect={() => handleRoundEnd(true)}
        onSkip={() => handleRoundEnd(false)}
      />
    );
  }

  if (phase === "round-result") {
    return (
      <RoundResult
        correct={lastRoundCorrect ?? false}
        word={currentWord}
        teams={teams}
        teamColors={TEAM_COLORS}
        onNext={handleNextRound}
        onEndGame={handleEndGame}
      />
    );
  }

  if (phase === "game-over") {
    return (
      <GameOver
        teams={teams}
        teamColors={TEAM_COLORS}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return null;
}
