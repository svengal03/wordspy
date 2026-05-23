"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GAMES } from "@playhub/config";
import { tokens, Btn } from "@playhub/ui";

const FILTERS = [
  { label: "All games", value: "all" },
  { label: "Deduction", value: "deduction" },
  { label: "Drawing", value: "drawing" },
  { label: "Acting", value: "acting" },
  { label: "Teams", value: "teams" },
];

export default function HomePage() {
  const router = useRouter();
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [hoveredHtp, setHoveredHtp] = useState<string | null>(null);
  const [activeGameplay, setActiveGameplay] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredGames =
    activeFilter === "all"
      ? GAMES
      : GAMES.filter((g) => (g.tags ?? []).includes(activeFilter));

  const activeGame = GAMES.find((g) => g.name === activeGameplay) ?? null;

  function openModal(name: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setActiveGameplay(name);
  }

  function closeModal() {
    setActiveGameplay(null);
  }

  function navigateToGame() {
    if (!activeGame) return;
    closeModal();
    router.push(`/${activeGame.slug}`);
  }

  return (
    <>
      <main
        style={{
          minHeight: "100dvh",
          background: tokens.bg,
          fontFamily: "'DM Sans', sans-serif",
          maxWidth: 520,
          margin: "0 auto",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Inner padded content */}
        <div style={{ padding: "32px 20px 0" }}>
          {/* Header */}
          <header style={{ marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginBottom: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 2.5, marginRight: 5 }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: tokens.coral }} />
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: tokens.coral, opacity: 0.55 }} />
                <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: tokens.coral, opacity: 0.25 }} />
              </span>
              <span style={{ fontSize: 28, fontWeight: 800, color: tokens.black, letterSpacing: -0.6, lineHeight: 1 }}>play</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: tokens.coral, letterSpacing: -0.6, lineHeight: 1 }}>hub</span>
            </div>
            <p style={{ margin: "0", fontSize: 14, color: tokens.grey2, fontWeight: 400 }}>
              Party games for groups
            </p>
          </header>
        </div>

        {/* Filter bar — full bleed with side padding so it scrolls edge-to-edge */}
        <div style={{
          overflowX: "auto",
          overflowY: "visible",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", gap: 7, padding: "0 20px", width: "max-content" }}>
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  style={{
                    flexShrink: 0,
                    fontSize: 12, fontWeight: 700,
                    padding: "5px 13px",
                    borderRadius: 20,
                    border: isActive ? `1.5px solid ${tokens.coral}` : `1.5px solid ${tokens.border}`,
                    background: isActive ? tokens.coral : tokens.white,
                    color: isActive ? "#fff" : tokens.grey2,
                    cursor: "pointer", fontFamily: "inherit",
                    letterSpacing: "0.02em",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Padded game grid + footer */}
        <div style={{ padding: "0 20px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "stretch" }}>
          {filteredGames.map((game) => {
            const isHovered = hoveredGame === game.name;
            const isHtpHovered = hoveredHtp === game.name;
            const isFeatured = !!game.featured;
            return (
              <Link
                key={game.name}
                href={`/${game.slug}`}
                aria-label={`Play ${game.name}`}
                onMouseEnter={() => setHoveredGame(game.name)}
                onMouseLeave={() => setHoveredGame(null)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: isFeatured ? "#FAECE7" : tokens.white,
                  border: `1.5px solid ${isFeatured ? "#D85A30" : isHovered ? "#D4CFC9" : tokens.border}`,
                  borderRadius: tokens.radius.xl,
                  padding: "20px 16px",
                  textDecoration: "none",
                  transition: "border-color 0.15s ease, transform 0.15s ease",
                  transform: isHovered ? "translateY(-1px)" : "translateY(0)",
                  boxSizing: "border-box",
                }}
              >
                {/* Featured badge */}
                {isFeatured && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10, fontWeight: 800, color: "#D85A30",
                    background: "#F5C4B3", borderRadius: 20,
                    padding: "2px 8px", marginBottom: 10,
                    alignSelf: "flex-start", letterSpacing: "0.04em",
                  }}>
                    ⭐ Popular
                  </div>
                )}

                {/* Emoji icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: isFeatured ? "#F5C4B3" : tokens.coralBg,
                  border: `1.5px solid ${tokens.coral}20`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, marginBottom: 14, flexShrink: 0,
                }}>
                  <span aria-hidden="true">{game.emoji}</span>
                </div>

                {/* Name */}
                <div style={{ fontSize: 14, fontWeight: 800, color: tokens.black, letterSpacing: -0.3, marginBottom: 4 }}>
                  <span>{game.split[0]}</span>
                  <span style={{ color: tokens.coral }}>{game.split[1]}</span>
                </div>

                {/* Description */}
                <p style={{ margin: "0 0 14px", fontSize: 13, color: tokens.grey2, lineHeight: 1.45, fontWeight: 400, flex: 1 }}>
                  {game.description}
                </p>

                {/* Footer badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: tokens.coral,
                    background: tokens.accentBg, border: `1px solid ${tokens.coral}40`,
                    borderRadius: tokens.radius.sm, padding: "3px 8px", letterSpacing: "0.04em",
                    textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    <span aria-hidden="true">👥</span>
                    {game.players}
                  </span>
                  <button
                    onClick={(e) => openModal(game.name, e)}
                    onMouseEnter={() => setHoveredHtp(game.name)}
                    onMouseLeave={() => setHoveredHtp(null)}
                    style={{
                      fontSize: 11, fontWeight: 700,
                      color: isHtpHovered ? "#D85A30" : tokens.grey2,
                      background: tokens.inputBg,
                      border: `1px solid ${isHtpHovered ? "#D85A30" : tokens.border}`,
                      borderRadius: tokens.radius.sm, padding: "3px 8px", letterSpacing: "0.04em",
                      textTransform: "uppercase", cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "color 0.15s, border-color 0.15s",
                    }}
                  >
                    How to play
                  </button>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: 32,
          paddingTop: 20,
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          borderTop: `1px solid ${tokens.border}`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 13, color: tokens.grey2, fontWeight: 500 }}>
            Made in haste, play with a straight face. © R3GUn
          </div>
        </footer>
        </div>{/* end padded wrapper */}
      </main>

      {/* Gameplay bottom-sheet modal */}
      <AnimatePresence>
        {activeGame && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: tokens.zIndex.modal,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <motion.div
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sheet-title"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 340 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 520,
                maxHeight: "82dvh",
                background: tokens.white,
                borderRadius: "24px 24px 0 0",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              {/* Drag handle */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: tokens.grey4 }} />
              </div>

              {/* Modal header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 20px 16px", flexShrink: 0,
                borderBottom: `1px solid ${tokens.border}`,
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13,
                  background: `${activeGame.themeColor}15`,
                  border: `1.5px solid ${activeGame.themeColor}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 23, flexShrink: 0,
                }}>
                  {activeGame.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div id="sheet-title" style={{ fontSize: 17, fontWeight: 800, color: tokens.black, letterSpacing: -0.3, lineHeight: 1.2 }}>
                    <span>{activeGame.split[0]}</span>
                    <span style={{ color: activeGame.themeColor }}>{activeGame.split[1]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 2 }}>How to play</div>
                </div>
                <button
                  onClick={closeModal}
                  aria-label="Close"
                  style={{
                    background: tokens.inputBg, border: "none",
                    borderRadius: tokens.radius.sm, width: 32, height: 32, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, color: tokens.grey2, flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Steps — scrollable */}
              <div style={{
                flex: 1, minHeight: 0, overflowY: "auto",
                padding: "16px 20px 0",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                {activeGame.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: tokens.radius.sm,
                      background: `${activeGame.themeColor}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, color: activeGame.themeColor,
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {i + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: tokens.grey1, lineHeight: 1.55, paddingTop: 2 }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{
                padding: "16px 20px",
                paddingBottom: "max(20px, env(safe-area-inset-bottom))",
                flexShrink: 0,
                borderTop: `1px solid ${tokens.border}`,
              }}>
                <Btn
                  fullWidth
                  onClick={navigateToGame}
                  color={activeGame.themeColor}
                  style={{ padding: "16px", fontSize: 15 }}
                >
                  Play {activeGame.split[0]}{activeGame.split[1]} →
                </Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
