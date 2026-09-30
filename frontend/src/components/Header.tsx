"use client";

import React from "react";
import {
  Shield,
  Database,
  Bot
} from "lucide-react";

interface HeaderProps {
  apiHealthy: boolean;
  standardsCount: number;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiHealthy,
  standardsCount,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="bg-[#1E293B] border-b border-slate-700/80 sticky top-0 z-40 shadow-sm">
      {/* Top Government Accent Stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white tracking-tight">
                  BIS-SpecAI
                </h1>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/60">
                  SIH 2026 #26108
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-none mt-0.5">
                AI Recommendation & Obsolescence Engine for Indian Standards
              </p>
            </div>
          </div>

          {/* Right Status Badges & Sidebar Toggle */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>{standardsCount} Indian Standards</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium">
              <span className={`w-2 h-2 rounded-full ${apiHealthy ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
              <span className="text-slate-300">
                {apiHealthy ? "Engine Active" : "Connecting..."}
              </span>
            </div>

            {/* Sidebar Toggle Button */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition shadow-xs ${
                isSidebarOpen
                  ? "bg-slate-700 text-white border border-slate-600"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>{isSidebarOpen ? "Close AI Sidebar" : "AI Assistant"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
