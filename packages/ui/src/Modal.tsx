"use client";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "./tokens";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
          tabIndex={-1}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, overflowY: "auto",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 400, width: "100%",
              background: tokens.white, borderRadius: 20,
              border: `1.5px solid ${tokens.border}`,
              boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
              padding: "24px 20px", position: "relative",
              fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
              zIndex: 201,
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: 16, right: 16,
                width: 32, height: 32, borderRadius: 8,
                border: "none", background: tokens.border,
                color: tokens.grey2, fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
