"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMindFieldStore } from "./store";
import { useMindFieldRoom } from "./useRoom";
import { submitClue, endTurn, toggleFlag, revealTile, resetForPlayAgain } from "./engine";
import type { GameState, TeamColor, PlayerRole } from "./types";

import { ConfirmDialog } from "@playhub/ui";
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
  // Derive from gameState.players so role/team updates are always fresh
  const effectivePlayer = (gameState && localPlayer)
    ? (gameState.players.find(p => p.id === localPlayer.id) ?? localPlayer)
    : localPlayer;

  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showBomb, setShowBomb] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const leavingRef = useRef(false);
  const joinedRef = useRef(false);

  function syncShowBomb(s: GameState) {
    const ended = s.phase === "round-over" || s.phase === "game-over";
    const last = s.roundHistory[s.roundHistory.length - 1];
    setShowBomb(ended && last?.bombTriggered === true);
  }

  const { pushState, sendFlagBroadcast } = useMindFieldRoom(roomId, roomCode, (incoming) => {
    syncShowBomb(incoming);
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
    if (joinedRef.current) return;
    joinedRef.current = true;
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
          if (joinData.player.id !== localPlayer.id) {
            setLocalPlayer(joinData.player);
          }
          setGameState(joinData.gameState);
          // Join response includes roomId — skip the extra state fetch
          if (joinData.roomId) {
            setRoomId(joinData.roomId);
            return;
          }
        }

        // Spectator (no localPlayer) or legacy fallback — fetch roomId via state endpoint
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
    // Reset role on any team change so a spymaster swapping teams doesn't bring the role
    // along (would otherwise produce two spymasters on the destination team).
    const players = gameState.players.map(p => {
      if (p.id !== playerId) return p;
      const switchingTeam = team !== p.team;
      const nextRole: PlayerRole | null = team
        ? switchingTeam ? "agent" : (p.role ?? "agent")
        : null;
      return { ...p, team, role: nextRole };
    });
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
    if (!gameState || isStarting) return;
    setIsStarting(true);
    try {
      const res = await fetch(`/api/mindfield/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setGameState(data.gameState);
    } catch {} finally {
      setIsStarting(false);
    }
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
    if (!gameState || !effectivePlayer) return;
    if (effectivePlayer.role !== "spymaster") return;
    if (gameState.currentTeam !== effectivePlayer.team) return;
    const updated = submitClue(gameState, clue, num, effectivePlayer.name);
    await push(updated);
  }

  async function handleRevealTile(tileId: number) {
    if (!gameState || !effectivePlayer) return;
    if (effectivePlayer.role !== "agent") return;
    if (gameState.currentTeam !== effectivePlayer.team) return;
    if (gameState.turnPhase !== "guessing") return;

    // Optimistic update — show result instantly
    const prev = gameState;
    const optimistic = revealTile(gameState, tileId);
    setGameState(optimistic);
    syncShowBomb(optimistic);

    try {
      const res = await fetch(`/api/mindfield/rooms/${roomCode}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tileId }),
      });
      const data = await res.json();
      // 409 = tile already revealed by concurrent click — server returns fresh state
      if (!res.ok) {
        const reverted = (data.gameState as GameState) ?? prev;
        setGameState(reverted);
        syncShowBomb(reverted);
        return;
      }
      const confirmed = data.gameState as GameState;
      setGameState(confirmed);
      syncShowBomb(confirmed);
    } catch {
      setGameState(prev);
      syncShowBomb(prev);
    }
  }

  function handleFlagTile(tileId: number) {
    if (!gameState || !effectivePlayer) return;
    if (effectivePlayer.role !== "agent") return;
    if (gameState.currentTeam !== effectivePlayer.team) return;
    if (gameState.turnPhase !== "guessing") return;
    // Flags are ephemeral within a turn — engine.endTurn() clears them. Skip persistence;
    // realtime broadcast is enough for teammates' devices, and late joiners simply start
    // with no flags. Saves a PATCH /state per flag click.
    const newState = toggleFlag(gameState, tileId);
    setGameState(newState);
    sendFlagBroadcast(newState.flaggedTiles);
  }

  async function handlePass() {
    if (!gameState || !effectivePlayer) return;
    if (effectivePlayer.role !== "agent") return;
    if (gameState.currentTeam !== effectivePlayer.team) return;
    if (gameState.turnPhase !== "guessing") return;
    const updated = endTurn(gameState);
    await push(updated);
  }

  // ── Round/Game transitions ────────────────────────────────────────────────
  async function handleNextRound() {
    if (!gameState || isStarting) return;
    setShowBomb(false);
    setIsStarting(true);
    try {
      const res = await fetch(`/api/mindfield/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next-round" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setGameState(data.gameState);
    } catch {} finally {
      setIsStarting(false);
    }
  }

  async function handlePlayAgain() {
    if (!gameState) return;
    await push(resetForPlayAgain(gameState));
  }

  function handleLeave() {
    if (!localPlayer) return;
    setShowLeaveDialog(true);
  }

  async function confirmLeave() {
    if (!localPlayer) return;
    setShowLeaveDialog(false);
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
    const isError = !!roomError || !!isKicked;
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
        <button
          onClick={() => router.push("/mindfield")}
          style={{
            marginTop: 8, padding: "10px 24px", borderRadius: 10, border: "1.5px solid #ddd",
            background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
          }}
        >
          ← PlayHub
        </button>
      </div>
    );
  }

  const { phase } = gameState;
  const leaveLabel = localPlayer.isHost ? "End game?" : "Leave this game?";

  let content: React.ReactNode = null;

  // ── Bomb overlay ──────────────────────────────────────────────────────────
  if (showBomb && gameState.bombTriggeredBy) {
    const bombTile = gameState.tiles.find(t => t.color === "bomb" && t.revealed);
    content = (
      <>
        <BombReveal triggeredBy={gameState.bombTriggeredBy} word={bombTile?.word ?? "???"} />
        <div style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 300 }}>
          {localPlayer.isHost ? (
            <button
              onClick={phase === "game-over" ? handlePlayAgain : handleNextRound}
              disabled={isStarting}
              style={{
                padding: "14px 32px", borderRadius: 14, background: "#CC785C", color: "#fff",
                border: "none", fontSize: 16, fontWeight: 700, cursor: isStarting ? "default" : "pointer",
                fontFamily: "inherit", opacity: isStarting ? 0.6 : 1,
              }}
            >
              {isStarting ? "Loading…" : phase === "game-over" ? "Play Again →" : "Next Round →"}
            </button>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Waiting for host…</div>
          )}
          <button
            onClick={handleLeave}
            style={{
              padding: "8px 20px", borderRadius: 10, background: "transparent", color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Leave Game
          </button>
        </div>
      </>
    );
  } else if (phase === "lobby") {
    // ── Lobby ─────────────────────────────────────────────────────────────
    content = (
      <LobbyScreen
        gameState={gameState}
        localPlayer={localPlayer}
        onAssignTeam={handleAssignTeam}
        onAssignSpymaster={handleAssignSpymaster}
        onUpdatePackId={handleUpdatePackId}
        onUpdateTargetWins={handleUpdateTargetWins}
        onStart={handleStart}
        isStarting={isStarting}
        onRemovePlayer={handleRemovePlayer}
        onLeave={handleLeave}
      />
    );
  } else if (effectivePlayer) {
    // ── Playing ─────────────────────────────────────────────────────────────
    const newGame = effectivePlayer.isHost ? handlePlayAgain : undefined;

    if (phase === "playing") {
      content = effectivePlayer.role === "spymaster" ? (
        <SpymasterView
          gameState={gameState}
          localPlayer={effectivePlayer}
          onSubmitClue={handleSubmitClue}
          onLeave={handleLeave}
          onNewGame={newGame}
        />
      ) : (
        <AgentView
          gameState={gameState}
          localPlayer={effectivePlayer}
          onRevealTile={handleRevealTile}
          onFlagTile={handleFlagTile}
          onPass={handlePass}
          onLeave={handleLeave}
          onNewGame={newGame}
        />
      );
    } else if (phase === "round-over") {
      content = (
        <RoundOverScreen
          gameState={gameState}
          localPlayer={effectivePlayer}
          onNextRound={handleNextRound}
          onLeave={handleLeave}
          onNewGame={newGame}
        />
      );
    } else if (phase === "game-over") {
      content = (
        <GameOverScreen
          gameState={gameState}
          localPlayer={effectivePlayer}
          onPlayAgain={handlePlayAgain}
          onLeave={handleLeave}
        />
      );
    }
  }

  return (
    <>
      {content}
      <ConfirmDialog
        open={showLeaveDialog}
        title={leaveLabel}
        confirmLabel={localPlayer.isHost ? "End Game" : "Leave"}
        cancelLabel="Stay"
        dangerous
        onConfirm={confirmLeave}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </>
  );
}
