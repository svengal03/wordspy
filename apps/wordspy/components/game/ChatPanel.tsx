"use client";
import { useState, useRef, useEffect } from "react";
import { ChatMessage, Player } from "@/lib/types";
import { tokens, Card } from "@/components/ui";

const EMOJIS = ["😂", "👀", "🤔", "😱", "🕵️", "🤫", "😅", "🔥", "💀", "🫣"];

interface Props {
  messages: ChatMessage[];
  localPlayer: Player;
  onSend: (text: string) => void;
}

export default function ChatPanel({ messages, localPlayer, onSend }: Props) {
  const [text, setText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  function sendEmoji(emoji: string) {
    onSend(emoji);
  }

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
        💬 Chat
      </div>

      {/* Messages */}
      <div ref={containerRef} style={{
        maxHeight: 200, overflowY: "auto", display: "flex",
        flexDirection: "column", gap: 8, marginBottom: 12,
      }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 13, color: tokens.grey4, textAlign: "center", padding: "12px 0" }}>
            No messages yet. Say something!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.playerId === localPlayer.id;
          const isSystem = msg.type === "system";
          if (isSystem) {
            return (
              <div key={msg.id} style={{ textAlign: "center", fontSize: 12, color: tokens.grey4, fontStyle: "italic" }}>
                {msg.text}
              </div>
            );
          }
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
              {!isMe && (
                <div style={{
                  width: 24, height: 24, borderRadius: 6, background: "#F0EDE9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: tokens.grey2, flexShrink: 0,
                }}>
                  {msg.playerName[0].toUpperCase()}
                </div>
              )}
              <div style={{ maxWidth: "75%" }}>
                {!isMe && (
                  <div style={{ fontSize: 11, color: tokens.grey3, marginBottom: 2, paddingLeft: 2 }}>
                    {msg.playerName}
                  </div>
                )}
                <div style={{
                  padding: "8px 12px", borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: isMe ? tokens.coral : "#F0F0F0",
                  color: isMe ? "#fff" : tokens.black, fontSize: 14, lineHeight: 1.4,
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Emoji quick-send */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => sendEmoji(e)}
            style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: 3, borderRadius: 6 }}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Say something…"
          maxLength={120}
          style={{
            flex: 1, padding: "10px 13px", borderRadius: 10,
            border: `1.5px solid ${tokens.border}`, fontSize: 14,
            fontFamily: "inherit", outline: "none", color: tokens.black,
            background: "#FAFAFA",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: "10px 16px", borderRadius: 10, background: tokens.coral,
            border: "none", color: "#fff", fontSize: 16, cursor: "pointer",
          }}
        >↑</button>
      </div>
    </Card>
  );
}
