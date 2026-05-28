"use client";
import { useGame } from "@/games/wavelength/store";
import SetupScreen from "@/games/wavelength/components/SetupScreen";
import ClueScreen from "@/games/wavelength/components/ClueScreen";
import GuessScreen from "@/games/wavelength/components/GuessScreen";
import OpposingBetScreen from "@/games/wavelength/components/OpposingBetScreen";
import RevealScreen from "@/games/wavelength/components/RevealScreen";
import GameOverScreen from "@/games/wavelength/components/GameOverScreen";
import RulesModal from "@/games/wavelength/components/RulesModal";
import { TeamAssignScreen, GetReadyScreen } from "@/games/shared";
import { startGame } from "@/games/wavelength/engine";
import { WAVELENGTH_TEAM_META } from "@playhub/core";
import type { Player, TeamId } from "@/games/wavelength/types";
import { GameLobbyScreen, tokens, useGoHome } from "@playhub/ui";

const WAVELENGTH_TEAM_PALETTE = [
  WAVELENGTH_TEAM_META.A.color,
  WAVELENGTH_TEAM_META.B.color,
] as const;

const TEAM_IDS: TeamId[] = ["A", "B"];

interface WavelengthTeamSlot {
  name: string;
  players: string[];
}

export function WavelengthGame() {
  const { game, set, restartGame } = useGame();
  const goHome = useGoHome();

  if (game.phase === "lobby") {
    return (
      <GameLobbyScreen
        appName="Wavelength"
        tagline={<>Read minds.<br /><span style={{ color: tokens.coral }}>Find the wavelength.</span></>}
        description="Two teams. One spectrum. Give a clue, guess the position."
        howItWorks={[
          { icon: "🎯", title: "Pick a spectrum", desc: "Each round reveals a spectrum — Hot↔Cold, Fast↔Slow, Science↔Art." },
          { icon: "📡", title: "Give your clue", desc: "The psychic secretly places the target and gives one word hinting where it falls." },
          { icon: "🔮", title: "Dial in the guess", desc: "Your team moves the needle. Closer to center = more points." },
        ]}
        onSubmit={(name) => set({ phase: "setup", hostName: name })}
        onExit={goHome}
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
      />
    );
  }

  if (game.phase === "team-assign") {
    const wavelengthTeams: WavelengthTeamSlot[] = TEAM_IDS.map((id) => ({
      name: WAVELENGTH_TEAM_META[id].label,
      players: game.players.filter((p) => p.teamId === id).map((p) => p.name),
    }));

    const handleConfirm = async (reassigned: WavelengthTeamSlot[]) => {
      const updatedPlayers: Player[] = game.players.map((p) => ({
        ...p,
        teamId: (reassigned[0]!.players.includes(p.name) ? "A" : "B") as TeamId,
      }));
      const newState = await startGame(updatedPlayers, game.config);
      set({ ...newState, phase: "get-ready" });
    };

    return (
      <TeamAssignScreen<WavelengthTeamSlot>
        appName="Wavelength"
        teams={wavelengthTeams}
        teamPalette={WAVELENGTH_TEAM_PALETTE}
        minPlayersPerTeam={2}
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
        onConfirm={handleConfirm}
        onNewGame={restartGame}
      />
    );
  }

  if (game.phase === "get-ready") {
    const startingTeam = WAVELENGTH_TEAM_META[game.currentTeamId];
    const psychic = game.players.find((p) => p.id === game.currentPsychicId);
    return (
      <GetReadyScreen
        appName="Wavelength"
        accentColor={startingTeam.color}
        title="Tune the wavelength"
        subtitle={
          <>
            <strong style={{ color: startingTeam.color }}>{startingTeam.label}</strong> goes first
            {psychic && <> — {psychic.name} is the psychic.</>}
          </>
        }
        hints={[
          { icon: "📡", text: "Psychic sees the target, gives one clue word." },
          { icon: "🔮", text: "Teammates slide the needle to where they think it lands." },
        ]}
        buttonLabel="Start Round →"
        rulesModal={({ isOpen, onClose }) => <RulesModal isOpen={isOpen} onClose={onClose} />}
        onStart={() => set({ phase: "clue" })}
        onNewGame={restartGame}
      />
    );
  }
  if (game.phase === "clue") return <ClueScreen />;
  if (game.phase === "guess") return <GuessScreen />;
  if (game.phase === "opposing-bet") return <OpposingBetScreen />;
  if (game.phase === "reveal") return <RevealScreen />;
  if (game.phase === "game-over") return <GameOverScreen onPlayAgain={restartGame} />;

  return <SetupScreen />;
}
