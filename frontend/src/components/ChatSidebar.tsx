"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Sparkles, X, RefreshCw, BookOpen,
} from "lucide-react";
import { ChatMessage, sendGeminiChatMessage } from "@/lib/gemini";
import { AnalysisResponse } from "@/types";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  searchResult: AnalysisResponse | null;
  apiKey: string;
  onOpenApiKeyModal: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  searchResult,
  apiKey,
  onOpenApiKeyModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const primary = searchResult?.primary_standard;
      let greeting = "Hi! I'm your **BIS SpecAI Assistant**.\n\n";
      if (primary) {
        greeting += `I've loaded your search results for **${primary.is_number}: ${primary.title}** (${primary.ai_relevance_score}% match).\n\nAsk me to explain the standard, compare editions, or draft a tender clause.`;
      } else {
        greeting += "Run a search first and I'll read the results automatically. Or ask me anything about Indian Standards right now.";
      }
      setMessages([{ id: "welcome", sender: "assistant", text: greeting, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }
  }, [isOpen, searchResult]);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: "user", text, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const history = [...messages, userMsg];
    setMessages(history);
    if (!customText) setInput("");
    setIsLoading(true);
    try {
      const resp = await sendGeminiChatMessage(apiKey, text, history, searchResult);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: "assistant", text: resp, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: "assistant", text: `⚠️ ${err.message || "Gemini API error"}`, isError: true, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } finally {
      setIsLoading(false); }
  };

  const primary = searchResult?.primary_standard;
  const suggestions = primary
    ? [`Summarize ${primary.is_number}`, `Testing procedures for ${primary.is_number}`, "Draft tender clause"]
    : ["What is IS 12615:2018?", "Difference between PPC and OPC cement", "Earthing codes IS 3043"];

  return (
    <div style={{
      width: 360,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      background: "#FFFFFF",
      borderLeft: "1px solid #D5CCEF",
      overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{
        padding: "12px 16px",
        background: "#5B21B6",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bot size={17} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 30, height: 30, borderRadius: 7, border: "none", cursor: "pointer",
            background: "rgba(255,255,255,0.1)", color: "#E9D5FF", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        >
          <X size={15} />
        </button>
      </div>

      {/* Context strip */}
      <div style={{
        padding: "7px 14px",
        background: "#F3EEFF",
        borderBottom: "1px solid #DDD0F9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <BookOpen size={13} color="#7C3AED" />
          <span style={{ fontWeight: 600, color: "#4C1D95" }}>Context:</span>
          {primary
            ? <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#5B21B6", background: "#EDE8FC", padding: "1px 7px", borderRadius: 5 }}>{primary.is_number}</span>
            : <span style={{ fontSize: 11, color: "#9E8EC0", fontStyle: "italic" }}>No active search yet</span>
          }
        </div>
        {primary && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#D1FAE5", padding: "2px 7px", borderRadius: 10 }}>
            {primary.ai_relevance_score}% Match
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 12, background: "#FAF8FF" }}>
        {messages.map(msg => {
          const isUser = msg.sender === "user";
          return (
            <div key={msg.id} style={{ display: "flex", gap: 8, flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: isUser ? "#5B21B6" : "#EDE8FC",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isUser ? <User size={13} color="#fff" /> : <Bot size={13} color="#5B21B6" />}
              </div>
              <div style={{
                maxWidth: "82%",
                padding: "10px 13px",
                borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                fontSize: 13,
                lineHeight: 1.55,
                background: isUser ? "#5B21B6" : "#FFFFFF",
                color: isUser ? "#fff" : "#1A0E40",
                border: isUser ? "none" : "1px solid #E4DEFA",
                boxShadow: "0 1px 3px rgba(91,33,182,0.08)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                {msg.text}
                <div style={{ fontSize: 10, marginTop: 5, color: isUser ? "rgba(255,255,255,0.6)" : "#9E8EC0" }}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EDE8FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={13} color="#5B21B6" />
            </div>
            <div style={{ padding: "10px 13px", background: "#FFFFFF", border: "1px solid #E4DEFA", borderRadius: "14px 14px 14px 4px", display: "flex", alignItems: "center", gap: 8 }}>
              <RefreshCw size={12} color="#7C3AED" style={{ animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 12, color: "#7C6EA8" }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <div style={{ padding: "8px 12px", background: "#FFFFFF", borderTop: "1px solid #E4DEFA", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9E8EC0", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={10} color="#F59E0B" /> Try:
          </span>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => handleSend(s)} disabled={isLoading}
              style={{
                flexShrink: 0, padding: "4px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                background: "#F3EEFF", color: "#5B21B6", border: "1px solid #DDD0F9",
                fontFamily: "inherit", fontWeight: 500, whiteSpace: "nowrap",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#EDE8FC"}
              onMouseLeave={e => e.currentTarget.style.background = "#F3EEFF"}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", background: "#FFFFFF", borderTop: "1px solid #E4DEFA", flexShrink: 0 }}>
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={primary ? `Ask about ${primary.is_number}…` : "Ask Gemini anything…"}
            disabled={isLoading}
            style={{
              flex: 1, padding: "9px 14px", background: "#F3EEFF",
              border: "1.5px solid #D5CCEF", borderRadius: 10, fontSize: 13,
              color: "#1A0E40", outline: "none", fontFamily: "inherit",
            }}
            onFocus={e => e.target.style.borderColor = "#7C3AED"}
            onBlur={e => e.target.style.borderColor = "#D5CCEF"}
          />
          <button type="submit" disabled={isLoading || !input.trim()}
            style={{
              width: 36, height: 36, borderRadius: 9, border: "none",
              background: input.trim() ? "#5B21B6" : "#E4DEFA",
              color: input.trim() ? "#fff" : "#B8ACDA",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
            <Send size={14} />
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
