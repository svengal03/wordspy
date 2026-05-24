"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Btn, Card, tokens, PlayerNameInput, useGoHome, PlayHubLogo } from "@playhub/ui";
import RulesModal from "./components/RulesModal";
import { useMindFieldStore } from "./store";
import { createPlayer } from "./engine";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: "easeOut" },
});

export function MindFieldHome() {
  const router = useRouter();
  const goHome = useGoHome();
  const { setLocalPlayer, setRoomCode } = useMindFieldStore();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<null | "create" | "join">(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return setError("Enter your name");
    setLoading(true);
    try {
      const res = await fetch("/api/mindfield/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      if (!res.ok) { setError("Failed to create room. Try again."); return; }
      const data = await res.json();
      const player = createPlayer(name.trim(), true);
      setLocalPlayer(player);
      setRoomCode(data.roomCode);
      router.push(`/mindfield/room/${data.roomCode}`);
    } catch {
      setError("Failed to create room. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return setError("Enter a room code");
    if (!name.trim()) return setError("Enter your name");
    setLoading(true);
    try {
      const res = await fetch("/api/mindfield/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", roomCode: code }),
      });
      if (!res.ok) { setError("Room not found. Check the code."); return; }
      await res.json();
      const player = createPlayer(name.trim(), false);
      setLocalPlayer(player);
      setRoomCode(code);
      router.push(`/mindfield/room/${code}`);
    } catch {
      setError("Failed to join room. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function back() {
    setMode(null);
    setError("");
    setName("");
    setJoinCode("");
  }

  const HOW_IT_WORKS = [
    { icon: "🧠", title: "Spymaster gives one-word hints", desc: "Each team's Spymaster knows which words belong to their team and gives clues to guide their agents." },
    { icon: "🃏", title: "Agents guess the right words", desc: "Your team taps cards to find your words. Guess wrong and you might help the other side — or hit the bomb." },
    { icon: "💣", title: "Avoid the bomb to win", desc: "First team to find all their words wins — unless someone hits the bomb, which ends the game instantly." },
  ];

  return (
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* TopBar */}
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <PlayHubLogo />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowRules(true)}
            style={{
              padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${tokens.border}`,
              background: tokens.white, cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: tokens.grey1, fontFamily: "inherit",
            }}
          >Rules</button>
        </div>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 20px 32px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        {/* Hero */}
        {!mode && (
          <motion.div {...fadeUp(0)} style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🧠</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: tokens.black, margin: 0, letterSpacing: -1 }}>
              mind<span style={{ color: tokens.coral }}>field</span>
            </h1>
            <p style={{ color: tokens.grey2, fontSize: 15, marginTop: 10, lineHeight: 1.5 }}>
              Two-team word deduction. Spymaster hints, agents guess. Don&rsquo;t hit the bomb.
            </p>
          </motion.div>
        )}

        {/* Mode selector */}
        {!mode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <motion.div {...fadeUp(0.05)}>
              <Btn fullWidth onClick={() => setMode("create")} style={{ padding: "15px", fontSize: 16 }}>
                Create Room
              </Btn>
            </motion.div>
            <motion.div {...fadeUp(0.1)}>
              <Btn variant="ghost" fullWidth onClick={() => setMode("join")} style={{ padding: "15px", fontSize: 16 }}>
                Join with Code
              </Btn>
            </motion.div>
          </div>
        )}

        {/* How it works */}
        {!mode && (
          <motion.div {...fadeUp(0.15)} style={{ marginTop: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
              How it works
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {HOW_IT_WORKS.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: "#F5F0ED",
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
        )}

        {/* Create form */}
        {mode === "create" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div style={{ fontSize: 18, fontWeight: 800, color: tokens.black, marginBottom: 16 }}>Create Room</div>
              <PlayerNameInput
                value={name}
                onChange={setName}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="Your name…"
              />
              {error && <div style={{ fontSize: 13, color: "#DC2626", marginTop: 6 }}>{error}</div>}
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <Btn variant="ghost" onClick={back} style={{ flex: 1, padding: "13px" }}>← Back</Btn>
                <Btn onClick={handleCreate} disabled={loading || !name.trim()} style={{ flex: 2, padding: "13px" }}>
                  {loading ? "Creating…" : "Create →"}
                </Btn>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Join form */}
        {mode === "join" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div style={{ fontSize: 18, fontWeight: 800, color: tokens.black, marginBottom: 16 }}>Join Room</div>
              <div style={{ marginBottom: 10 }}>
                <input
                  type="text"
                  placeholder="Room code (e.g. AB3X7Z)"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
                  maxLength={6}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: `1.5px solid ${tokens.border}`, fontSize: 18, fontWeight: 700,
                    fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: 3,
                    background: tokens.inputBg, color: tokens.black, outline: "none",
                    boxSizing: "border-box",
                  }}
                  autoCapitalize="characters"
                  autoComplete="off"
                />
              </div>
              <PlayerNameInput
                value={name}
                onChange={setName}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                placeholder="Your name…"
              />
              {error && <div style={{ fontSize: 13, color: "#DC2626", marginTop: 6 }}>{error}</div>}
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <Btn variant="ghost" onClick={back} style={{ flex: 1, padding: "13px" }}>← Back</Btn>
                <Btn onClick={handleJoin} disabled={loading || !name.trim() || !joinCode.trim()} style={{ flex: 2, padding: "13px" }}>
                  {loading ? "Joining…" : "Join →"}
                </Btn>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
