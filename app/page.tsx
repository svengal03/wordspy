"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo, Btn, Card, tokens, Badge } from "@/components/ui";
import { useGameStore } from "@/lib/store";
import { createPlayer } from "@/lib/gameEngine";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: "easeOut" },
});

export default function HomeScreen() {
  const router = useRouter();
  const { setLocalPlayer, setRoomCode, setOffline, setGameState } = useGameStore();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<null | "create" | "join" | "offline">(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) return setError("Enter your name first");
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json();
      const player = createPlayer(name.trim(), true);
      setLocalPlayer(player);
      setRoomCode(data.roomCode);
      setGameState(data.gameState);
      router.push(`/room/${data.roomCode}`);
    } catch {
      setError("Failed to create room. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim()) return setError("Enter your name first");
    if (!joinCode.trim()) return setError("Enter a room code");
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", roomCode: joinCode.toUpperCase().trim() }),
      });
      if (!res.ok) return setError("Room not found. Check the code.");
      const data = await res.json();
      const player = createPlayer(name.trim(), false);
      setLocalPlayer(player);
      setRoomCode(joinCode.toUpperCase().trim());
      setGameState(data.gameState);
      router.push(`/room/${joinCode.toUpperCase().trim()}`);
    } catch {
      setError("Failed to join room. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOffline() {
    if (!name.trim()) return setError("Enter your name first");
    const player = createPlayer(name.trim(), true);
    setLocalPlayer(player);
    setOffline(true);
    router.push("/offline");
  }

  return (
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ flex: 1, padding: "48px 24px 24px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {/* Hero */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 8 }}>
          <Badge>🇮🇳 India Edition</Badge>
        </motion.div>
        <motion.div {...fadeUp(0.05)}>
          <div style={{ fontSize: 40, fontWeight: 800, color: tokens.black, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 10 }}>
            Find the<br />
            <span style={{ color: tokens.coral }}>Wordspy.</span>
          </div>
          <div style={{ fontSize: 15, color: tokens.grey2, lineHeight: 1.6, marginBottom: 32, maxWidth: 300 }}>
            Social deduction word game for 3–10 players. Bluff, deduce, expose the infiltrators.
          </div>
        </motion.div>

        {/* Name input — always shown */}
        <motion.div {...fadeUp(0.1)} style={{ marginBottom: 16 }}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Your Name
            </div>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Rahul, Priya…"
              maxLength={20}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: `1.5px solid ${tokens.border}`, fontSize: 15,
                fontFamily: "inherit", background: "#FAFAFA", outline: "none",
                color: tokens.black, boxSizing: "border-box",
              }}
            />
          </Card>
        </motion.div>

        {/* Mode buttons */}
        <motion.div {...fadeUp(0.15)} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          <Btn fullWidth onClick={() => { setMode("create"); setError(""); }} style={{ padding: "15px 24px", fontSize: 16 }}>
            🎮 Create Room
          </Btn>
          <Btn fullWidth variant="ghost" onClick={() => { setMode("join"); setError(""); }} style={{ padding: "15px 24px", fontSize: 16 }}>
            🔗 Join with Code
          </Btn>
          <Btn fullWidth variant="secondary" onClick={() => { setMode("offline"); setError(""); }} style={{ padding: "15px 24px", fontSize: 16 }}>
            📱 Play Offline (Pass Phone)
          </Btn>
        </motion.div>

        {/* Sub-form based on mode */}
        {mode === "create" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: tokens.grey2, margin: "0 0 14px" }}>
                A room will be created and you'll get a code to share with friends.
              </p>
              <Btn fullWidth onClick={handleCreate} disabled={loading}>
                {loading ? "Creating…" : "Create & Get Code →"}
              </Btn>
            </Card>
          </motion.div>
        )}

        {mode === "join" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Room Code
              </div>
              <input
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
                placeholder="e.g. ABC123"
                maxLength={6}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10,
                  border: `1.5px solid ${tokens.border}`, fontSize: 20, fontWeight: 700,
                  letterSpacing: 4, fontFamily: "inherit", background: "#FAFAFA",
                  outline: "none", color: tokens.coral, boxSizing: "border-box", marginBottom: 14,
                }}
              />
              <Btn fullWidth onClick={handleJoin} disabled={loading}>
                {loading ? "Joining…" : "Join Room →"}
              </Btn>
            </Card>
          </motion.div>
        )}

        {mode === "offline" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: tokens.grey2, margin: "0 0 14px" }}>
                Everyone plays on one phone. Pass the phone around for each player to see their secret word privately.
              </p>
              <Btn fullWidth onClick={handleOffline}>
                Start Offline Game →
              </Btn>
            </Card>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: tokens.redBg, border: `1.5px solid #FECACA`, borderRadius: 12, padding: "12px 16px", color: tokens.red, fontSize: 14, marginBottom: 16 }}>
            {error}
          </motion.div>
        )}

        {/* How it works */}
        <motion.div {...fadeUp(0.2)}>
          <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
            How it works
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "🃏", title: "Get your word", desc: "Everyone gets a secret word — except the Ghost who gets none." },
              { icon: "💬", title: "Give clues", desc: "Take turns describing your word without revealing it." },
              { icon: "🗳️", title: "Vote & expose", desc: "Find the infiltrators before they outlast the Civilians." },
            ].map((s, i) => (
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
      </div>

      <div style={{ textAlign: "center", padding: "16px 24px", color: tokens.grey4, fontSize: 12 }}>
        Wordspy · India Edition · Built with ❤️
      </div>
    </div>
  );
}
