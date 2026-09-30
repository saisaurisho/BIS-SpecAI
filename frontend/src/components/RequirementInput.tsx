"use client";

import React, { useState, useRef } from "react";
import {
  Search,
  UploadCloud,
  FileText,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap,
  Play,
  X
} from "lucide-react";
import { ExampleScenario } from "@/types";

interface RequirementInputProps {
  query: string;
  setQuery: (q: string) => void;
  onAnalyze: (customQuery?: string) => void;
  onUploadPdf: (file: File) => void;
  isLoading: boolean;
  examples: ExampleScenario[];
}

export const RequirementInput: React.FC<RequirementInputProps> = ({
  query,
  setQuery,
  onAnalyze,
  onUploadPdf,
  isLoading,
  examples,
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      onUploadPdf(file);
    }
  };

  const handleSelectExample = (example: ExampleScenario, autoRun: boolean = true) => {
    setQuery(example.query);
    setSelectedFileName(null);
    if (autoRun) {
      onAnalyze(example.query);
    }
  };

  const primaryDemos = examples.slice(0, 5);
  const additionalDemos = examples.slice(5);

  return (
    <div className="bg-[#1E293B] rounded-3xl shadow-md border border-slate-700/80 p-6 md:p-8 space-y-5 transition-all relative">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700/60 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Hybrid Search & Audit Engine
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Search Indian Standards for Procurement Specifications
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
            Type technical requirements (voltage, rating, material, application) or upload tender NIT PDFs to identify applicable Indian Standards and audit superseded editions.
          </p>
        </div>

        {/* Upload Tender PDF Button */}
        <div className="shrink-0 self-start sm:self-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl shadow-xs transition"
          >
            <UploadCloud className="w-4 h-4 text-blue-400" />
            <span>{selectedFileName ? `PDF: ${selectedFileName}` : "Upload Tender PDF"}</span>
          </button>
        </div>
      </div>

      {/* Search Box Input Area */}
      <div className="relative z-10 space-y-3">
        <div className="relative group">
          <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-400 transition">
            <Search className="w-5 h-5" />
          </div>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter technical requirement specification (e.g., '15 kW three-phase induction motor, 415 V, 50 Hz for industrial operation')..."
            rows={3}
            className="w-full text-xs sm:text-sm font-medium text-white bg-[#0F172A] rounded-2xl border-2 border-slate-700 pl-12 pr-12 pt-3.5 pb-3.5 focus:outline-none focus:border-blue-500 shadow-inner transition-all placeholder:text-slate-500 font-sans leading-relaxed"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Submit Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
            {selectedFileName ? (
              <span className="text-xs text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-800 flex items-center gap-1.5 font-bold">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Tender PDF Uploaded: {selectedFileName}
              </span>
            ) : (
              <span>Indexes 113 authentic Indian Standards across Electrical, Civil, PPE & Solar domains.</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAnalyze()}
            disabled={isLoading || (!query.trim() && !selectedFileName)}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition transform"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Searching Standards...</span>
              </>
            ) : (
              <>
                <span>Search Standards</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Scenarios Grid */}
      <div className="pt-3 border-t border-slate-700/80 relative z-10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            Quick Demo Scenarios (One-Click Search):
          </span>

          {additionalDemos.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">More Domains:</span>
              <select
                className="text-xs bg-[#0F172A] hover:bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-slate-200 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const ex = examples.find((x) => x.id === e.target.value);
                  if (ex) handleSelectExample(ex, true);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Select Domain (Transformers, Rebar, PPE, Solar...)...
                </option>
                {additionalDemos.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 5 Preset Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {primaryDemos.map((ex, idx) => {
            const isMatch = query.trim() === ex.query.trim();
            const badgeLabel = [
              "1. Motor Specs",
              "2. PPC Cement",
              "3. Multi-Item Tender",
              "4. Version Audit",
              "5. Non-Catalog Item"
            ][idx] || ex.category;

            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectExample(ex, true)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between group ${
                  isMatch
                    ? "bg-blue-600 text-white border-blue-500 shadow-md"
                    : "bg-[#0F172A] hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:border-slate-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isMatch ? "bg-white/20 text-white" : "bg-blue-950 text-blue-300 border border-blue-800/50"
                      }`}
                    >
                      {badgeLabel}
                    </span>
                    <Play className={`w-3 h-3 ${isMatch ? "text-amber-300" : "text-slate-400 group-hover:text-blue-400"}`} />
                  </div>
                  <div className={`text-xs font-bold line-clamp-1 ${isMatch ? "text-white" : "text-slate-100"}`}>
                    {ex.label.split(": ")[1] || ex.label}
                  </div>
                  <div className={`text-[11px] line-clamp-2 mt-0.5 leading-snug ${isMatch ? "text-blue-100" : "text-slate-400"}`}>
                    "{ex.query}"
                  </div>
                </div>
                <div className={`mt-2 text-[10px] font-bold ${isMatch ? "text-amber-300" : "text-blue-400"}`}>
                  → Click to Search
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
