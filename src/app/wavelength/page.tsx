"use client";
import { useGame } from "./lib/store";
import SetupScreen from "./components/SetupScreen";
import TeamAssignScreen from "./components/TeamAssignScreen";
import ClueScreen from "./components/ClueScreen";
import GuessScreen from "./components/GuessScreen";
import OpposingBetScreen from "./components/OpposingBetScreen";
import RevealScreen from "./components/RevealScreen";
import GameOverScreen from "./components/GameOverScreen";

export default function WavelengthApp() {
  const { game, reset } = useGame();

  if (game.phase === "team-assign") return <TeamAssignScreen />;
  if (game.phase === "clue") return <ClueScreen />;
  if (game.phase === "guess") return <GuessScreen />;
  if (game.phase === "opposing-bet") return <OpposingBetScreen />;
  if (game.phase === "reveal") return <RevealScreen />;
  if (game.phase === "game-over") return <GameOverScreen onPlayAgain={reset} />;

  return <SetupScreen />;
}
