"use client";
import { useGame } from "@/lib/store";
import SetupScreen from "@/components/game/SetupScreen";
import TeamAssignScreen from "@/components/game/TeamAssignScreen";
import ClueScreen from "@/components/game/ClueScreen";
import GuessScreen from "@/components/game/GuessScreen";
import OpposingBetScreen from "@/components/game/OpposingBetScreen";
import RevealScreen from "@/components/game/RevealScreen";
import GameOverScreen from "@/components/game/GameOverScreen";

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
