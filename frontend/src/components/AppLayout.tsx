"use client";

import React from "react";
import { Shield, Search, Clock, Plus, Trash2, MessageSquare, Bot } from "lucide-react";

export interface HistoryItem {
  id: string;
  type: "search" | "chat";
  label: string;
  timestamp: string;
}

interface LayoutProps {
  history: HistoryItem[];
  onNewSearch: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
  rightPanel?: React.ReactNode;   // The chat sidebar rendered here
  children: React.ReactNode;
}

export const AppLayout: React.FC<LayoutProps> = ({
  history,
  onNewSearch,
  onToggleChat,
  isChatOpen,
  onSelectHistory,
  onClearHistory,
  rightPanel,
  children,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#EDE8FC" }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{
        height: 56,
        background: "#FFFFFF",
        borderBottom: "1px solid #D5CCEF",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        flexShrink: 0,
        boxShadow: "0 1px 4px rgba(91,33,182,0.08)",
        gap: 12,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          width: 34, height: 34,
          background: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)",
          borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 3px 10px rgba(91,33,182,0.4)", flexShrink: 0,
        }}>
          <Shield size={17} color="#FCD34D" />
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#1A0E40", letterSpacing: "-0.02em" }}>BIS-SpecAI</span>
          <span style={{ fontSize: 12, color: "#9E8EC0", marginLeft: 10 }}>Indian Standards · SIH 2026</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#A08DD8" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 0 2px #BBF7D0" }} />
          113 standards
        </div>
      </header>

      {/* ── BODY ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* LEFT SIDEBAR */}
        <aside style={{
          width: 220,
          background: "#E4DEFA",
          borderRight: "1px solid #D5CCEF",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          <div style={{ padding: "14px 12px 10px" }}>
            <button
              onClick={onNewSearch}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "9px 12px", background: "#5B21B6", color: "#fff", border: "none",
                borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 3px 10px rgba(91,33,182,0.35)", fontFamily: "inherit",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#4C1D95"}
              onMouseLeave={e => e.currentTarget.style.background = "#5B21B6"}
            >
              <Plus size={14} /> New Search
            </button>
          </div>

          <div style={{ height: 1, background: "#C8BCEC" }} />

          {/* History */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
            {history.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 6px 10px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9E8EC0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Recent
                </span>
                <button onClick={onClearHistory} style={{ background: "none", border: "none", cursor: "pointer", color: "#B8ACDA", display: "flex", padding: 2 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E11D48")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#B8ACDA")}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            {history.length === 0 ? (
              <div style={{ padding: "40px 12px", textAlign: "center" }}>
                <Clock size={22} color="#C0AEED" style={{ margin: "0 auto 10px", display: "block" }} />
                <p style={{ fontSize: 12, color: "#A08DD8", margin: 0, lineHeight: 1.6 }}>
                  Your searches will<br />appear here
                </p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectHistory(item)}
                  style={{
                    width: "100%", display: "block", textAlign: "left", padding: "7px 10px",
                    background: "none", border: "none", cursor: "pointer", borderRadius: 8,
                    marginBottom: 2, fontFamily: "inherit",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.5)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    {item.type === "search"
                      ? <Search size={11} color="#9E8EC0" />
                      : <MessageSquare size={11} color="#9E8EC0" />
                    }
                    <span style={{ fontSize: 12, color: "#2D1A5E", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#A08DD8", paddingLeft: 17 }}>{item.timestamp}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {/* Chat toggle — only shown when chat is CLOSED */}
          {!isChatOpen && (
            <div style={{ position: "absolute", top: 14, right: 20, zIndex: 5 }}>
              <button
                onClick={onToggleChat}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px",
                  background: "#FFFFFF",
                  color: "#5B21B6",
                  border: "1.5px solid #C8BCEC",
                  borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 2px 8px rgba(91,33,182,0.1)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#F3EEFF"; e.currentTarget.style.borderColor = "#A08DD8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#C8BCEC"; }}
              >
                <Bot size={15} />
                Ask AI
              </button>
            </div>
          )}

          <main style={{ flex: 1, overflowY: "auto", background: "#EDE8FC" }}>
            {children}
          </main>
        </div>

        {/* RIGHT CHAT PANEL — part of the flex row, not an overlay */}
        {isChatOpen && rightPanel}
      </div>
    </div>
  );
};
