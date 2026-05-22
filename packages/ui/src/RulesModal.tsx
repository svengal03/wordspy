"use client";
import { ReactNode } from "react";
import { Modal } from "./Modal";
import { tokens } from "./tokens";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subtitle: string;
  children: ReactNode;
}

export function RulesModal({ isOpen, onClose, subtitle, children }: Props) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <div style={{ fontSize: 20, fontWeight: 800, color: tokens.black, marginBottom: 4 }}>
        How to Play
      </div>
      <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 20 }}>{subtitle}</div>
      {children}
      <button
        onClick={onClose}
        style={{
          marginTop: 20, width: "100%", padding: "12px 0",
          background: tokens.accentBg, color: tokens.accent,
          border: "none", borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}
      >
        Got it
      </button>
    </Modal>
  );
}
