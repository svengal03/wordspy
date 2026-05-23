"use client";
import { useState, useCallback, useEffect } from "react";
import { SetupScreen } from "./components/SetupScreen";
import { WordReveal } from "./components/WordReveal";
import { ActingScreen } from "./components/ActingScreen";
import { RulesModal } from "./components/RulesModal";
import { RoundResult } from "@playhub/ui/game";
import { GameOver } from "@playhub/ui/game";
import { useGoHome, GameLobbyScreen, tokens } from "@playhub/ui";
import { TEAM_PALETTE_DUMBCHARADES as TEAM_PALETTE } from "@playhub/core";
import type { GameState, Team, Difficulty } from "./lib/types";
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

export default function DumbCharadesPage() {
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
    if (state.phase === "lobby" || state.phase === "setup") {
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    }
  }, [state]);

  const handleStart = useCallback((teams: Team[], timerDuration: number, selectedPackIds: string[]) => {
    const pool = buildWordPool(selectedPackIds, dbRowsRef.current, true);
    if (pool.length === 0) return;
    const { options, remaining } = pickThree(pool, selectedPackIds, dbRowsRef.current, true);
    setState((s) => ({
      phase: "word-reveal",
      hostName: s.hostName,
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
    }));
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
    setState((s) => ({ ...defaultState, phase: "setup", hostName: s.hostName }));
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
        onSubmit={(name) => setState((s) => ({ ...s, phase: "setup", hostName: name }))}
        onExit={goHome}
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
      />
    );
  }

  if (phase === "setup") {
    if (wordsLoading) return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh", fontSize: 15, color: "#888" }}>
        Loading word packs…
      </div>
    );
    if (wordsError) return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", gap: 12 }}>
        <div style={{ fontSize: 15, color: "#CC3333" }}>Failed to load word packs</div>
        <div style={{ fontSize: 13, color: "#888" }}>{wordsError}</div>
      </div>
    );
    return <SetupScreen onStart={handleStart} onNewGame={handleNewGame} hostName={state.hostName} />;
  }

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
