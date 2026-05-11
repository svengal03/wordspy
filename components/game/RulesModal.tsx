"use client";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "@/components/ui";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const rules = [
    {
      title: "🎯 Objective",
      desc: "Civilians try to expose the Undercover and Ghost. Undercover blends in. Ghost has no word and must bluff — then guess the civilians' word if eliminated.",
    },
    {
      title: "🃏 Roles",
      items: [
        "Civilian: You know the secret word — give clues that prove it without being too obvious",
        "Undercover: You have a similar but different word — blend in without being exposed",
        "Ghost: You have NO word — listen carefully to others' clues and try to figure out the word",
      ],
    },
    {
      title: "💬 Clue Phase",
      items: [
        "Players take turns giving ONE clue per round (eliminated players skip)",
        "Clues must relate to your word but cannot be the word itself",
        "Duplicating another player's clue is not allowed",
      ],
    },
    {
      title: "🗳️ Vote Phase",
      items: [
        "Vote to eliminate the player you think is the Undercover or Ghost",
        "The player with the most votes is eliminated",
        "Ties: if Tie Breaker is on, tied players re-clue and the group revotes; otherwise a random tied player is eliminated",
      ],
    },
    {
      title: "👻 Ghost Guess",
      items: [
        "If the Ghost is eliminated, they get one chance to guess the civilians' word",
        "Correct guess = Ghost wins immediately",
        "Wrong guess = game continues into the next round",
      ],
    },
    {
      title: "🏆 Winning",
      items: [
        "Civilians WIN: All Undercovers and the Ghost are eliminated",
        "Undercover WINS: Undercovers equal or outnumber Civilians + Ghost (they control the vote)",
        "Ghost WINS: Correctly guesses the civilians' word after being eliminated",
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1000,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: 480,
              width: "90vw",
              maxHeight: "85vh",
              overflowY: "auto",
              background: tokens.white,
              borderRadius: 24,
              border: `1.5px solid ${tokens.border}`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              zIndex: 1001,
              padding: "28px 20px",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: tokens.border,
                color: tokens.grey2,
                fontSize: 20,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            {/* Title */}
            <div style={{ fontSize: 24, fontWeight: 800, color: tokens.black, marginBottom: 24 }}>
              How to Play
            </div>

            {/* Rules */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {rules.map((section, i) => (
                <div key={i}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: tokens.black, marginBottom: 8 }}>
                    {section.title}
                  </div>
                  {section.desc && (
                    <div style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.6 }}>
                      {section.desc}
                    </div>
                  )}
                  {section.items && (
                    <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                      {section.items.map((item, j) => (
                        <li key={j} style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Close button at bottom */}
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "12px 16px",
                marginTop: 24,
                borderRadius: 12,
                border: "none",
                background: tokens.coralBg,
                color: tokens.coral,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Got it!
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
