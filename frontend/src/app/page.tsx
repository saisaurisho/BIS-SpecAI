"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout, HistoryItem } from "@/components/AppLayout";
import { SearchBox } from "@/components/SearchBox";
import { VersionAlertBanner } from "@/components/VersionAlertBanner";
import { PrimaryStandardCard } from "@/components/PrimaryStandardCard";
import { RelatedStandardsSection } from "@/components/RelatedStandardsSection";
import { CandidateStandardsList } from "@/components/CandidateStandardsList";
import { AnalysisDetailsCard } from "@/components/AnalysisDetailsCard";
import { StandardsGraphModal } from "@/components/StandardsGraphModal";
import { StandardDetailModal } from "@/components/StandardDetailModal";
import { CopyToTenderModal } from "@/components/CopyToTenderModal";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { ChatSidebar } from "@/components/ChatSidebar";
import { analyzeRequirement, uploadTenderPdf } from "@/lib/api";
import { AnalysisResponse, StandardMetadata } from "@/types";
import { DEFAULT_GEMINI_KEY } from "@/lib/gemini";
import { DiscoveredStandardsSection } from "@/components/DiscoveredStandardsSection";
import { Sparkles, AlertTriangle } from "lucide-react";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<StandardMetadata | null>(null);
  const [isClauseModalOpen, setIsClauseModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeRequirementIndex, setActiveRequirementIndex] = useState(0);
  const [apiKey, setApiKey] = useState(DEFAULT_GEMINI_KEY);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = localStorage.getItem("gemini_api_key");
      if (key) {
        setApiKey(key);
      } else {
        localStorage.setItem("gemini_api_key", DEFAULT_GEMINI_KEY);
      }
      const saved = localStorage.getItem("bis_history");
      if (saved) try { setHistory(JSON.parse(saved)); } catch {}
    }
  }, []);

  const pushHistory = useCallback((type: "search" | "chat", label: string) => {
    const item: HistoryItem = {
      id: Date.now().toString(), type, label,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setHistory(prev => {
      const next = [item, ...prev].slice(0, 30);
      localStorage.setItem("bis_history", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("gemini_api_key", key);
  };

  const handleAnalyze = async (customQuery?: string) => {
    const q = (customQuery ?? query).trim();
    if (!q) return;
    setIsLoading(true); setError(null); setResult(null); setActiveRequirementIndex(0);
    try {
      const data = await analyzeRequirement(q);
      setResult(data);
      pushHistory("search", q.length > 58 ? q.slice(0, 58) + "…" : q);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Is the backend running on port 8000?");
    } finally { setIsLoading(false); }
  };

  const handleUploadPdf = async (file: File) => {
    setIsLoading(true); setError(null); setResult(null);
    try {
      const data = await uploadTenderPdf(file);
      setResult(data);
      if (data.query) setQuery(data.query.slice(0, 200));
      pushHistory("search", file.name);
    } catch (err: any) {
      setError(err.message || "Failed to read PDF");
    } finally { setIsLoading(false); }
  };

  const isMulti = Boolean(result?.is_multi_requirement && result?.requirement_groups && result.requirement_groups.length > 1);
  const activeGroup = isMulti && result?.requirement_groups ? result.requirement_groups[activeRequirementIndex] ?? result.requirement_groups[0] : null;
  const currentPrimary = activeGroup ? activeGroup.primary_standard : result?.primary_standard;
  const currentRelated = activeGroup ? activeGroup.related_standards : result?.related_standards;
  const currentCandidates = activeGroup ? activeGroup.candidate_standards : result?.candidate_standards;
  const currentAlerts = activeGroup ? activeGroup.version_alerts : result?.version_alerts;
  const currentRequirements = activeGroup ? activeGroup.extracted_requirements : result?.extracted_requirements;
  const currentSemanticNote = activeGroup ? activeGroup.semantic_vs_keyword_note : result?.semantic_vs_keyword_note;
  const meetsThresh = activeGroup ? activeGroup.meets_recommendation_threshold : result?.meets_recommendation_threshold;
  const threshMsg = activeGroup ? activeGroup.threshold_message : result?.threshold_message;

  return (
    <AppLayout
      history={history}
      onNewSearch={() => { setQuery(""); setResult(null); setError(null); setIsChatOpen(false); }}
      onToggleChat={() => {
        if (!isChatOpen) pushHistory("chat", "AI Chat");
        setIsChatOpen(v => !v);
      }}
      isChatOpen={isChatOpen}
      onSelectHistory={(item) => { if (item.type === "chat") setIsChatOpen(true); else setQuery(item.label.replace("…", "")); }}
      onClearHistory={() => { setHistory([]); localStorage.removeItem("bis_history"); }}
      rightPanel={
        <ChatSidebar
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          searchResult={result}
          apiKey={apiKey}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />
      }
    >
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "52px 32px 100px" }}>

        {/* ── EMPTY STATE ──────────────────── */}
        {!result && !isLoading && !error && (
          <div style={{ marginBottom: 44 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.7)", border: "1px solid #C8BCEC",
              borderRadius: 20, padding: "4px 12px 4px 8px", marginBottom: 18,
            }}>
              <Sparkles size={13} color="#7C3AED" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#5B21B6" }}>
                AI-Powered · SIH 2026 Problem #26108
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1A0E40", margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              Find the right Indian Standard<br />
              <span style={{ color: "#5B21B6" }}>for your procurement</span>
            </h1>
            <p style={{ fontSize: 15, color: "#7C6EA8", margin: "0 0 36px", lineHeight: 1.7, maxWidth: 520 }}>
              Describe your product or requirement. The engine will match it against BIS standards, flag superseded editions, and surface related safety and testing codes.
            </p>
          </div>
        )}

        {/* ── RESULT CONTEXT ───────────────── */}
        {result && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9E8EC0", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>
              Results for
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#2D1A5E", margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>
              "{result.query?.slice(0, 120)}{(result.query?.length ?? 0) > 120 ? "…" : ""}"
            </p>
          </div>
        )}

        {/* ── SEARCH BOX ───────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <SearchBox query={query} setQuery={setQuery} onAnalyze={handleAnalyze} onUploadPdf={handleUploadPdf} isLoading={isLoading} />
        </div>

        {/* ── ERROR ────────────────────────── */}
        {error && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "14px 18px", background: "#FEF2F2",
            border: "1px solid #FCA5A5", borderRadius: 10, marginBottom: 28,
          }}>
            <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: "#B91C1C", lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* ── MULTI-REQUIREMENT TABS ─────────── */}
        {isMulti && result?.requirement_groups && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9E8EC0", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
              {result.requirement_groups.length} requirements detected
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {result.requirement_groups.map((g, idx) => (
                <button key={g.group_id} onClick={() => setActiveRequirementIndex(idx)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                    background: activeRequirementIndex === idx ? "#5B21B6" : "rgba(255,255,255,0.7)",
                    color: activeRequirementIndex === idx ? "#fff" : "#6B5E8C",
                    border: activeRequirementIndex === idx ? "1.5px solid #5B21B6" : "1.5px solid #C8BCEC",
                    boxShadow: activeRequirementIndex === idx ? "0 2px 8px rgba(91,33,182,0.3)" : "none",
                  }}>
                  {g.requirement_label || `Item ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS ──────────────────────── */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {currentAlerts && currentAlerts.length > 0 && <VersionAlertBanner alerts={currentAlerts} />}

            {(!currentPrimary || meetsThresh === false) && (
              <div style={{ padding: "18px 22px", background: "rgba(255,255,255,0.65)", border: "1px solid #FCD34D", borderRadius: 10 }}>
                <p style={{ fontWeight: 700, color: "#92400E", fontSize: 14, margin: "0 0 6px" }}>No matching standard in local prototype catalog (113 standards)</p>
                <p style={{ fontSize: 13, color: "#A16207", margin: 0, lineHeight: 1.6 }}>
                  {threshMsg || "The product is not covered in the local static database. The BIS Web Agent has automatically activated below to search all 20,000+ Indian Standards on the live national portal (services.bis.gov.in)."}
                </p>
              </div>
            )}

            {currentPrimary && (
              <PrimaryStandardCard standard={currentPrimary} semanticNote={currentSemanticNote}
                onOpenGraph={() => setIsGraphOpen(true)} onViewStandard={(std) => setSelectedStandard(std)}
                onOpenClause={() => setIsClauseModalOpen(true)}
                tenderClause={result?.tender_clause || undefined} />
            )}

            <AnalysisDetailsCard result={result} onSelectStandard={(std) => setSelectedStandard(std)} />
            {currentRelated && <RelatedStandardsSection related={currentRelated} onSelectStandard={(std) => setSelectedStandard(std)} />}
            {currentCandidates && currentCandidates.length > 0 && <CandidateStandardsList candidates={currentCandidates} onSelectStandard={(std) => setSelectedStandard(std)} />}

            {/* Live Web Agent: Automatically searches BIS portal on EVERY request */}
            <DiscoveredStandardsSection
              query={result.query || query}
              autoTrigger={true}
            />

            {/* Bottom bar */}
            {result.summary_explanation && (
              <div style={{
                marginTop: 8, paddingTop: 24, borderTop: "1px solid #D5CCEF",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap",
              }}>
                <p style={{ fontSize: 13, color: "#7C6EA8", margin: 0, maxWidth: 460, lineHeight: 1.65 }}>
                  {result.summary_explanation}
                </p>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setIsClauseModalOpen(true)}
                    style={{
                      padding: "8px 16px", background: "rgba(255,255,255,0.7)",
                      border: "1.5px solid #C8BCEC", borderRadius: 8, fontSize: 13,
                      color: "#6B5E8C", cursor: "pointer", fontFamily: "inherit",
                      fontWeight: 500, transition: "all 0.12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#A08DD8"; e.currentTarget.style.color = "#2D1A5E"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#C8BCEC"; e.currentTarget.style.color = "#6B5E8C"; }}
                  >Copy to tender</button>
                  <button onClick={() => setIsChatOpen(true)}
                    style={{
                      padding: "8px 16px", background: "#5B21B6", border: "none",
                      borderRadius: 8, fontSize: 13, color: "#fff", cursor: "pointer",
                      fontFamily: "inherit", fontWeight: 600,
                      boxShadow: "0 3px 10px rgba(91,33,182,0.35)", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#4C1D95"; e.currentTarget.style.boxShadow = "0 5px 18px rgba(91,33,182,0.45)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#5B21B6"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(91,33,182,0.35)"; }}
                  >Ask AI about this →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} apiKey={apiKey} onSaveApiKey={handleSaveApiKey} />
      {result?.graph_data && (
        <StandardsGraphModal isOpen={isGraphOpen} onClose={() => setIsGraphOpen(false)} graphData={result.graph_data} onSelectStandardMetadata={(std) => setSelectedStandard(std)} />
      )}
      <StandardDetailModal standard={selectedStandard} onClose={() => setSelectedStandard(null)} />
      {result && (
        <CopyToTenderModal
          isOpen={isClauseModalOpen}
          onClose={() => setIsClauseModalOpen(false)}
          clauseText={(result.requirement_groups?.[activeRequirementIndex]?.tender_clause) || result.tender_clause || ""}
          standardTitle={(result.requirement_groups?.[activeRequirementIndex]?.primary_standard?.title) || result.primary_standard?.title}
          isNumber={(result.requirement_groups?.[activeRequirementIndex]?.primary_standard?.is_number) || result.primary_standard?.is_number}
        />
      )}
    </AppLayout>
  );
}
