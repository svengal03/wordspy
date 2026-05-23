"use client";
import { ReactNode, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "./tokens";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId();
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
            background: "rgba(0,0,0,0.45)", zIndex: tokens.zIndex.modal,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, overflowY: "auto",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(400px, calc(100vw - 40px))", width: "100%",
              maxHeight: "calc(100dvh - 40px)", overflowY: "auto",
              background: tokens.white, borderRadius: tokens.radius.xl,
              border: `1.5px solid ${tokens.border}`,
              boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
              padding: "24px 20px", position: "relative",
              fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
              zIndex: tokens.zIndex.modal + 1,
            }}
          >
            {title && (
              <div id={titleId} style={{ fontSize: 16, fontWeight: 800, color: tokens.black, marginBottom: 16, paddingRight: 40 }}>
                {title}
              </div>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute", top: 16, right: 16,
                width: 32, height: 32, borderRadius: tokens.radius.md,
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
