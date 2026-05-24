"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMindFieldStore } from "./store";
import { useMindFieldRoom } from "./useRoom";
import { submitClue, endTurn, resetForPlayAgain } from "./engine";
import type { GameState, TeamColor, PlayerRole } from "./types";

import LobbyScreen from "./components/LobbyScreen";
import SpymasterView from "./components/SpymasterView";
import AgentView from "./components/AgentView";
import RoundOverScreen from "./components/RoundOverScreen";
import GameOverScreen from "./components/GameOverScreen";
import BombReveal from "./components/BombReveal";

export function MindFieldRoom() {
  const params = useParams();
  const roomCode = params.code as string;
  const router = useRouter();

  const { localPlayer, gameState, setGameState, setRoomCode, setLocalPlayer, reset } = useMindFieldStore();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [showBomb, setShowBomb] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const leavingRef = useRef(false);

  const { pushState } = useMindFieldRoom(roomId, roomCode, (incoming) => {
    // If bomb was just triggered, show overlay briefly
    if (incoming.phase === "round-over" && incoming.roundHistory.length > 0) {
      const last = incoming.roundHistory[incoming.roundHistory.length - 1];
      if (last.bombTriggered) setShowBomb(true);
    }
    setGameState(incoming);
  });

  async function push(state: GameState) {
    const prev = gameState;
    setGameState(state);
    const ok = await pushState(roomCode, state);
    if (!ok && prev) setGameState(prev);
  }

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    setRoomCode(roomCode);

    (async () => {
      try {
        if (localPlayer) {
          // Atomic server-side join: handles dedup by ID, name collision, and new players
          const joinRes = await fetch("/api/mindfield/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "join", roomCode, playerData: localPlayer }),
          });

          if (joinRes.status === 409) {
            setRoomError("Game already in progress — can't join mid-game.");
            setTimeout(() => router.push("/mindfield"), 3000);
            return;
          }
          if (!joinRes.ok) {
            setRoomError("Room not found — the session may have ended.");
            setTimeout(() => router.push("/mindfield"), 3000);
            return;
          }

          const joinData = await joinRes.json();
          // Server may return a different player object (e.g. name collision rejoined existing seat)
          if (joinData.player.id !== localPlayer.id) {
            setLocalPlayer(joinData.player);
          }
          setGameState(joinData.gameState);
        }

        // Fetch roomId for realtime subscription (separate from join — always needed)
        const stateRes = await fetch(`/api/mindfield/rooms/${roomCode}/state`);
        if (!stateRes.ok) {
          if (!localPlayer) {
            setRoomError("Room not found — the session may have ended.");
            setTimeout(() => router.push("/mindfield"), 3000);
          }
          return;
        }
        const stateData = await stateRes.json();
        setRoomId(stateData.roomId);

        // If no localPlayer (direct URL access without going through home), just show state
        if (!localPlayer) {
          setGameState(stateData.gameState as GameState);
        }
      } catch {
        setRoomError("Connection error — taking you home…");
        setTimeout(() => router.push("/mindfield"), 3000);
      } finally {
        setIsLoadingRoom(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // ── Lobby actions ─────────────────────────────────────────────────────────
  async function handleAssignTeam(playerId: string, team: TeamColor | null) {
    if (!gameState) return;
    const players = gameState.players.map(p =>
      p.id !== playerId ? p : { ...p, team, role: team ? (p.role ?? "agent") as PlayerRole : null }
    );
    await push({ ...gameState, players });
  }

  async function handleAssignSpymaster(playerId: string) {
    if (!gameState) return;
    const target = gameState.players.find(p => p.id === playerId);
    if (!target?.team) return;
    const isAlreadySpy = target.role === "spymaster";
    const players = gameState.players.map(p => {
      if (p.id === playerId) return { ...p, role: isAlreadySpy ? "agent" as const : "spymaster" as const };
      if (!isAlreadySpy && p.team === target.team && p.role === "spymaster") return { ...p, role: "agent" as const };
      return p;
    });
    await push({ ...gameState, players });
  }

  async function handleUpdatePackId(packId: string) {
    if (!gameState) return;
    await push({ ...gameState, config: { ...gameState.config, packId } });
  }

  async function handleUpdateTargetWins(n: number) {
    if (!gameState) return;
    await push({ ...gameState, config: { ...gameState.config, targetWins: n } });
  }

  async function handleStart() {
    if (!gameState) return;
    try {
      const res = await fetch(`/api/mindfield/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setGameState(data.gameState);
    } catch {}
  }

  async function handleRemovePlayer(id: string) {
    if (!gameState) return;
    const removedPlayer = gameState.players.find(p => p.id === id);
    let remaining = gameState.players.filter(p => p.id !== id);
    if (removedPlayer?.isHost && remaining.length > 0) {
      remaining = remaining.map((p, i) => i === 0 ? { ...p, isHost: true } : p);
    }
    await push({ ...gameState, players: remaining });
  }

  // ── Playing actions ───────────────────────────────────────────────────────
  async function handleSubmitClue(clue: string, num: number) {
    if (!gameState || !localPlayer) return;
    if (localPlayer.role !== "spymaster") return;
    if (gameState.currentTeam !== localPlayer.team) return;
    const updated = submitClue(gameState, clue, num);
    await push(updated);
  }

  async function handleRevealTile(tileId: number) {
    if (!gameState || !localPlayer) return;
    if (localPlayer.role !== "agent") return;
    if (gameState.currentTeam !== localPlayer.team) return;
    if (gameState.turnPhase !== "guessing") return;
    try {
      const res = await fetch(`/api/mindfield/rooms/${roomCode}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tileId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      // Show bomb overlay if applicable
      const newState = data.gameState as GameState;
      if (newState.phase === "round-over" || newState.phase === "game-over") {
        const last = newState.roundHistory[newState.roundHistory.length - 1];
        if (last?.bombTriggered) setShowBomb(true);
      }
      setGameState(newState);
    } catch {}
  }

  async function handlePass() {
    if (!gameState) return;
    const updated = endTurn(gameState);
    await push(updated);
  }

  // ── Round/Game transitions ────────────────────────────────────────────────
  async function handleNextRound() {
    if (!gameState) return;
    setShowBomb(false);
    try {
      const res = await fetch(`/api/mindfield/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next-round" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setGameState(data.gameState);
    } catch {}
  }

  async function handlePlayAgain() {
    if (!gameState) return;
    await push(resetForPlayAgain(gameState));
  }

  async function handleLeave() {
    if (!localPlayer) return;
    const msg = localPlayer.isHost ? "End game and return home?" : "Leave this game?";
    if (!window.confirm(msg)) return;
    leavingRef.current = true;
    await handleRemovePlayer(localPlayer.id);
    reset();
    router.push("/mindfield");
  }

  // ── Loading / error states ────────────────────────────────────────────────
  // Only check kicked AFTER initial load — prevents false positive when gameState
  // hasn't been populated yet (e.g. first navigation, refresh).
  const isKicked = !isLoadingRoom && !leavingRef.current && gameState && localPlayer
    && gameState.phase === "lobby"
    && !gameState.players.find(p => p.id === localPlayer.id);

  if (isLoadingRoom || !gameState || !localPlayer || isKicked) {
    const isError = !!roomError || isKicked;
    const msg = isKicked
      ? "You were removed from the room."
      : roomError ?? "Loading room…";
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 12, fontFamily: "system-ui",
      }}>
        <div style={{ fontSize: 32 }}>{isError ? "😔" : "🧠"}</div>
        <div style={{ color: isError ? "#EF4444" : "#888", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>{msg}</div>
      </div>
    );
  }

  const { phase } = gameState;

  // ── Bomb overlay ──────────────────────────────────────────────────────────
  if (showBomb && gameState.bombTriggeredBy) {
    const bombTile = gameState.tiles.find(t => t.color === "bomb" && t.revealed);
    return (
      <>
        <BombReveal triggeredBy={gameState.bombTriggeredBy} word={bombTile?.word ?? "???"} />
        {/* Host still needs to advance — show next round button beneath overlay if host */}
        {localPlayer.isHost && (
          <button
            onClick={phase === "game-over" ? handlePlayAgain : handleNextRound}
            style={{
              position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)",
              padding: "14px 32px", borderRadius: 14, background: "#CC785C", color: "#fff",
              border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", zIndex: 300,
            }}
          >
            {phase === "game-over" ? "Play Again →" : "Next Round →"}
          </button>
        )}
      </>
    );
  }

  // ── Lobby ─────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <LobbyScreen
        gameState={gameState}
        localPlayer={localPlayer}
        onAssignTeam={handleAssignTeam}
        onAssignSpymaster={handleAssignSpymaster}
        onUpdatePackId={handleUpdatePackId}
        onUpdateTargetWins={handleUpdateTargetWins}
        onStart={handleStart}
        onRemovePlayer={handleRemovePlayer}
        onLeave={handleLeave}
      />
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  const newGame = localPlayer.isHost ? handlePlayAgain : undefined;

  if (phase === "playing") {
    if (localPlayer.role === "spymaster") {
      return (
        <SpymasterView
          gameState={gameState}
          localPlayer={localPlayer}
          onSubmitClue={handleSubmitClue}
          onLeave={handleLeave}
          onNewGame={newGame}
        />
      );
    }
    return (
      <AgentView
        gameState={gameState}
        localPlayer={localPlayer}
        onRevealTile={handleRevealTile}
        onPass={handlePass}
        onLeave={handleLeave}
        onNewGame={newGame}
      />
    );
  }

  // ── Round over ────────────────────────────────────────────────────────────
  if (phase === "round-over") {
    return (
      <RoundOverScreen
        gameState={gameState}
        localPlayer={localPlayer}
        onNextRound={handleNextRound}
        onLeave={handleLeave}
        onNewGame={newGame}
      />
    );
  }

  // ── Game over ─────────────────────────────────────────────────────────────
  if (phase === "game-over") {
    return (
      <GameOverScreen
        gameState={gameState}
        localPlayer={localPlayer}
        onPlayAgain={handlePlayAgain}
        onLeave={handleLeave}
      />
    );
  }

  return null;
}
