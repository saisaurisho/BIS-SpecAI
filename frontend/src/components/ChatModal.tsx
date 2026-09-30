"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Key,
  X,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  FileText,
  ShieldCheck,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { ChatMessage, sendGeminiChatMessage } from "@/lib/gemini";
import { AnalysisResponse } from "@/types";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchResult: AnalysisResponse | null;
  apiKey: string;
  onOpenApiKeyModal: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Seed welcome message when search result changes or modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const primary = searchResult?.primary_standard;
      let initialGreeting = "Hello! I am **BIS SpecAI Assistant**, powered by Gemini LLM.\n\n";

      if (primary) {
        initialGreeting += `I have ingested your active search results for **${primary.is_number}: ${primary.title}** (${primary.ai_relevance_score}% relevance match).\n\nYou can ask me to summarize standards, explain testing procedures, analyze compliance, or draft tender clauses!`;
      } else {
        initialGreeting += `I am ready to assist you with Indian Standards (BIS) and procurement specifications. Type your search query or ask any technical standard question!`;
      }

      setMessages([
        {
          id: "welcome",
          sender: "assistant",
          text: initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, searchResult]);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const queryText = (customText || input).trim();
    if (!queryText || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!customText) setInput("");
    setIsLoading(true);

    try {
      const responseText = await sendGeminiChatMessage(
        apiKey,
        queryText,
        newHistory,
        searchResult
      );

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: `⚠️ **Error:** ${err.message || "Failed to reach Gemini API. Please check your API key."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  const primary = searchResult?.primary_standard;

  const suggestedPrompts = primary ? [
    `Summarize the key requirements & scope of ${primary.is_number}`,
    `List mandatory testing standards for ${primary.is_number}`,
    `Draft a technical compliance clause for tender NIT`,
    `Explain the parameters matched from my query`,
  ] : [
    "What is IS 12615:2018 used for?",
    "Explain difference between PPC cement and OPC cement standards",
    "What are mandatory earthing safety codes under IS 3043?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-2xl h-full sm:h-[92vh] sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Top Navigation Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">BIS SpecAI Chatbot</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono">
                  Gemini LLM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Grounded on Search Results</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                apiKey
                  ? "bg-emerald-950/50 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/50"
                  : "bg-amber-950/50 text-amber-300 border-amber-700/50 hover:bg-amber-900/50"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{apiKey ? "API Key Configured" : "Add Gemini Key"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Context Banner */}
        {primary && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 px-4 py-2.5 border-b border-blue-100 flex items-center justify-between text-xs text-slate-700 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-900">Active Document Context:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md truncate">
                {primary.is_number}: {primary.title}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0 hidden sm:inline">
              {primary.ai_relevance_score}% Match
            </span>
          </div>
        )}

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-xs ${
                    isUser
                      ? "bg-slate-800"
                      : "bg-gradient-to-tr from-blue-600 to-indigo-600"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs relative group ${
                    isUser
                      ? "bg-blue-600 text-white rounded-tr-none font-sans"
                      : msg.isError
                      ? "bg-red-50 text-red-900 border border-red-200 rounded-tl-none"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                  }`}
                >
                  {/* Markdown formatted text rendering */}
                  <div className="prose prose-xs max-w-none whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  <div
                    className={`mt-2 text-[10px] flex items-center justify-between gap-4 ${
                      isUser ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 hover:text-slate-700"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Gemini is reading standards context and generating answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Quick Prompts:
            </span>
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="shrink-0 px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs transition font-medium text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                primary
                  ? `Ask Gemini about ${primary.is_number} or your search requirements...`
                  : "Ask Gemini any question about Indian Standards..."
              }
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-md transition shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Powered by Google Gemini LLM API</span>
            {messages.length > 1 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="hover:text-red-600 transition flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Chat</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
