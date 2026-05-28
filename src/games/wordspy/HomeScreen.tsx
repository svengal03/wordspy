"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Btn, Card, TopBar, NavBtn, Screen, ErrorBox, tokens, PlayerNameInput, useGoHome } from "@playhub/ui";
import RulesModal from "@/games/wordspy/components/RulesModal";
import { useGameStore } from "@/games/wordspy/store";
import { createPlayer } from "@/games/wordspy/engine";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: "easeOut" },
});

export function WordspyHome() {
  const router = useRouter();
  const goHome = useGoHome();
  const { setLocalPlayer, setRoomCode, setOffline, setGameState } = useGameStore();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<null | "create" | "join" | "offline">(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return setError("Enter your name");
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      if (!res.ok) { setError("Failed to create room. Try again."); return; }
      const data = await res.json();
      const player = createPlayer(name.trim(), true);
      setLocalPlayer(player);
      setRoomCode(data.roomCode);
      setGameState(data.gameState);
      router.push(`/wordspy/room/${data.roomCode}`);
    } catch {
      setError("Failed to create room. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return setError("Enter a room code");
    if (!name.trim()) return setError("Enter your name");
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", roomCode: joinCode.toUpperCase().trim() }),
      });
      if (!res.ok) { setLoading(false); return setError("Room not found. Check the code."); }
      const data = await res.json();
      const trimmedName = name.trim().toLowerCase();
      const duplicate = (data.gameState.players as import("./types").Player[]).find(
        (p) => p.name.toLowerCase() === trimmedName
      );
      if (duplicate) {
        setLocalPlayer(duplicate);
        setRoomCode(joinCode.toUpperCase().trim());
        setGameState(data.gameState);
        router.push(`/wordspy/room/${joinCode.toUpperCase().trim()}`);
        setLoading(false);
        return;
      }
      const player = createPlayer(name.trim(), false);
      setLocalPlayer(player);
      setRoomCode(joinCode.toUpperCase().trim());
      setGameState(data.gameState);
      router.push(`/wordspy/room/${joinCode.toUpperCase().trim()}`);
    } catch {
      setError("Failed to join room. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOffline() {
    if (!name.trim()) return setError("Enter your name");
    const player = createPlayer(name.trim(), true);
    setLocalPlayer(player);
    setOffline(true);
    router.push("/wordspy/offline");
  }

  function back() {
    setMode(null);
    setError("");
    setName("");
    setJoinCode("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    if (mode === "create") handleCreate();
    else if (mode === "join") handleJoin();
    else if (mode === "offline") handleOffline();
  }

  return (
    <Screen style={{ display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <TopBar
        appName="Wordspy"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <NavBtn onClick={goHome}>Exit</NavBtn>
          </div>
        }
      />

      <div style={{ flex: 1, maxWidth: 480, margin: "0 auto", width: "100%", padding: "0 24px 40px", boxSizing: "border-box" }}>

        {mode === null ? (
          <>
            <motion.div {...fadeUp(0.05)} style={{ paddingTop: 32, marginBottom: 24 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: tokens.black, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 10 }}>
                Words, bluffs, one<br />
                <span style={{ color: tokens.coral }}>wordspy</span>.
              </div>
              <div style={{ fontSize: 15, color: tokens.grey2, lineHeight: 1.6, marginBottom: 32, maxWidth: 300 }}>
                Social deduction word game for 3–10 players. Bluff, deduce, expose the infiltrators.
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.15)} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              <Btn fullWidth onClick={() => { setMode("create"); setError(""); }} style={{ padding: "15px 24px", fontSize: 16 }}>
                Create Room
              </Btn>
              <Btn fullWidth variant="ghost" onClick={() => { setMode("join"); setError(""); }} style={{ padding: "15px 24px", fontSize: 16 }}>
                Join with Code
              </Btn>
              <Btn fullWidth variant="secondary" onClick={() => { setMode("offline"); setError(""); }} style={{ padding: "15px 24px", fontSize: 16 }}>
                Play Offline
              </Btn>
            </motion.div>

            <motion.div {...fadeUp(0.2)}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
                How it works
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { icon: "🃏", title: "Get your word", desc: "Everyone gets a secret word — except Mr. Phantom who gets none." },
                  { icon: "💬", title: "Give clues", desc: "Take turns describing your word without revealing it." },
                  { icon: "🗳️", title: "Vote & expose", desc: "Eliminate Undercovers and Mr. Phantom before they outnumber the Civilians." },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, background: tokens.iconBg,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                    }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>{s.title}</div>
                      <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={back}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, color: tokens.grey2,
                padding: "8px 0 24px", fontFamily: "inherit",
              }}
            >
              ← Back
            </button>

            {mode === "join" && (
              <Card style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                  Room Code
                </div>
                <input
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  autoFocus
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                  aria-label="Room code"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: `1.5px solid ${tokens.border}`, fontSize: 20, fontWeight: 700,
                    letterSpacing: 4, fontFamily: "inherit", background: tokens.inputBg,
                    outline: "none", color: tokens.coral, boxSizing: "border-box",
                    textTransform: "uppercase",
                  }}
                />
              </Card>
            )}

            <Card style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Your Name
              </div>
              <PlayerNameInput
                value={name}
                onChange={(val) => { setName(val); setError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Rahul, Priya…"
                autoFocus={mode !== "join"}
                style={{ fontSize: 15, padding: "12px 14px" }}
              />
            </Card>

            {error && <ErrorBox>{error}</ErrorBox>}

            <Btn
              fullWidth
              onClick={mode === "create" ? handleCreate : mode === "join" ? handleJoin : handleOffline}
              disabled={loading}
              style={{ padding: "15px 24px", fontSize: 16 }}
            >
              {loading
                ? (mode === "create" ? "Creating…" : mode === "join" ? "Joining…" : "Starting…")
                : mode === "create" ? "Create Room →"
                : mode === "join" ? "Join Room →"
                : "Play Offline →"}
            </Btn>
          </motion.div>
        )}
      </div>

      <div style={{ textAlign: "center", padding: "16px 24px", color: tokens.grey4, fontSize: 12 }}>
        Part of{" "}
        <Link href="/" style={{ color: tokens.grey3, fontWeight: 600, textDecoration: "none" }}>
          PlayHub
        </Link>{" "}
        · All games, one place
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </Screen>
  );
}
