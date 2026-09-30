"use client";

import React, { useState } from "react";
import {
  Activity,
  Cpu,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Clock,
  CheckCircle2,
  HelpCircle,
  FileCode,
} from "lucide-react";
import { AnalysisResponse, StandardMetadata } from "@/types";

interface Props {
  result: AnalysisResponse;
  onSelectStandard?: (std: StandardMetadata) => void;
}

export const AnalysisDetailsCard: React.FC<Props> = ({ result, onSelectStandard }) => {
  const [isOpen, setIsOpen] = useState(false);
  const latency = result.latency_breakdown;
  const primary = result.primary_standard;
  const scoring = primary?.scoring_breakdown;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden transition-all">
      {/* Clickable Header / Toggle Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition text-left border-b border-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>View Technical Details & Algorithmic Scoring</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                Transparent AI
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect dense vector cosine metrics, BM25 keyword matching, latency profiling, and multi-factor ranking weights.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {latency && (
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>
                Pipeline Latency: <strong>{latency.total_ms} ms</strong>
              </span>
            </div>
          )}
          <div className="p-1.5 rounded-md text-slate-500 hover:text-slate-800">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Expandable Technical Panel */}
      {isOpen && (
        <div className="p-5 md:p-6 space-y-6 text-sm text-slate-700 divide-y divide-slate-100 animate-in fade-in-50 duration-200">
          {/* Section 0: Complete Algorithmic Pipeline Flow */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5 mb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              Complete End-to-End Pipeline Execution Flow
            </h4>
            <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold">
              <span className="px-2.5 py-1 bg-white rounded-md border border-slate-300 text-slate-800 shadow-2xs">
                1. Input Query / PDF
              </span>
              <span className="text-slate-400 font-bold">➔</span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-slate-300 text-slate-800 shadow-2xs">
                2. 16-Param NLP Parse
              </span>
              <span className="text-slate-400 font-bold">➔</span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md border border-blue-200 shadow-2xs">
                3. Hybrid Retrieval (BM25 + all-MiniLM-L6-v2)
              </span>
              <span className="text-slate-400 font-bold">➔</span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-slate-300 text-slate-800 shadow-2xs">
                4. Multi-Factor Rerank
              </span>
              <span className="text-slate-400 font-bold">➔</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 shadow-2xs">
                5. Primary Standard Output
              </span>
              <span className="text-slate-400 font-bold">➔</span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-slate-300 text-slate-800 shadow-2xs">
                6. DAG Relationship Traversal
              </span>
              <span className="text-slate-400 font-bold">➔</span>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-900 rounded-md border border-amber-200 shadow-2xs">
                7. Version Audit
              </span>
            </div>
          </div>

          {/* Section 1: Execution Latency Profiling */}
          {latency && (
            <div className="pt-5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5 mb-3">
                <Clock className="w-4 h-4 text-blue-600" />
                Pipeline Execution Profile (Honest Latency Tracking)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">1. NLP Extraction</div>
                  <div className="text-base font-black text-slate-800 mt-0.5">{latency.nlp_extraction_ms} ms</div>
                  <div className="text-xs text-slate-400">Regex & entity parsing</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">2. Hybrid Retrieval</div>
                  <div className="text-base font-black text-slate-800 mt-0.5">{latency.retrieval_ms} ms</div>
                  <div className="text-xs text-slate-400">BM25 + Dense Vectors</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">3. Multi-Factor Rerank</div>
                  <div className="text-base font-black text-slate-800 mt-0.5">{latency.reranking_ms} ms</div>
                  <div className="text-xs text-slate-400">Coverage & Domain math</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">4. Graph Traversal</div>
                  <div className="text-base font-black text-slate-800 mt-0.5">{latency.graph_expansion_ms} ms</div>
                  <div className="text-xs text-slate-400">Normative DAG walk</div>
                </div>
                <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 col-span-2 sm:col-span-1">
                  <div className="text-xs text-blue-800 font-bold">Total Execution</div>
                  <div className="text-base font-black text-blue-900 mt-0.5">{latency.total_ms} ms</div>
                  <div className="text-xs text-blue-700">Sub-50ms CPU speed</div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: 5-Factor Scoring Breakdown for Primary Candidate */}
          {scoring && primary && (
            <div className="pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                  Multi-Factor Scoring Breakdown for Primary ({primary.is_number})
                </h4>
                <span className="text-[11px] font-mono text-slate-500">
                  Score = (0.35×Sem) + (0.30×BM25) + (0.20×Cov) + (0.10×Dom) + (0.05×Ver)
                </span>
              </div>

              <div className="space-y-3">
                {/* 1. Semantic Embedding */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      Dense Semantic Similarity (SentenceTransformer all-MiniLM-L6-v2)
                      <span className="text-[10px] text-slate-400 font-normal">Weight: 35%</span>
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {(scoring.semantic_score * 100).toFixed(1)}% (raw: {scoring.semantic_score.toFixed(4)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, scoring.semantic_score * 100))}%` }}
                    />
                  </div>
                </div>

                {/* 2. BM25 Lexical */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      BM25 Okapi Keyword Relevance
                      <span className="text-[10px] text-slate-400 font-normal">Weight: 30%</span>
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {(scoring.lexical_score * 100).toFixed(1)}% (raw: {scoring.lexical_score.toFixed(4)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, scoring.lexical_score * 100))}%` }}
                    />
                  </div>
                </div>

                {/* 3. Parameter Coverage */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      Extracted Parameter Scope Coverage
                      <span className="text-[10px] text-slate-400 font-normal">Weight: 20%</span>
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {(scoring.requirement_coverage * 100).toFixed(1)}% (raw: {scoring.requirement_coverage.toFixed(4)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, scoring.requirement_coverage * 100))}%` }}
                    />
                  </div>
                </div>

                {/* 4. Domain Score */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      Domain Alignment Coefficient
                      <span className="text-[10px] text-slate-400 font-normal">Weight: 10%</span>
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {(scoring.domain_score * 100).toFixed(1)}% (raw: {scoring.domain_score.toFixed(4)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, scoring.domain_score * 100))}%` }}
                    />
                  </div>
                </div>

                {/* 5. Version Validity */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      Lifecycle Validity (Active edition bonus / Superseded penalty)
                      <span className="text-[10px] text-slate-400 font-normal">Weight: 5%</span>
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {(scoring.version_score * 100).toFixed(1)}% (raw: {scoring.version_score.toFixed(4)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, scoring.version_score * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Itemized Algorithmic Evidence */}
          {primary?.evidence_items && primary.evidence_items.length > 0 && (
            <div className="pt-5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Itemized Verification Proofs
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {primary.evidence_items.map((ev, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2 text-xs"
                  >
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 shrink-0">
                      {ev.criterion}
                    </span>
                    <span className="text-slate-700">{ev.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Full Candidate Scoring Matrix */}
          {result.candidate_standards && result.candidate_standards.length > 0 && (
            <div className="pt-5">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-3">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                Candidate Ranking Comparison Matrix
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2 px-3">Rank</th>
                      <th className="py-2 px-3">Standard</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Semantic</th>
                      <th className="py-2 px-3 text-right">BM25</th>
                      <th className="py-2 px-3 text-right">Coverage</th>
                      <th className="py-2 px-3 text-right">Domain</th>
                      <th className="py-2 px-3 text-right font-bold text-slate-900">Final Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {result.candidate_standards.map((cand, idx) => {
                      const sb = cand.scoring_breakdown;
                      return (
                        <tr
                          key={cand.id}
                          onClick={() => onSelectStandard && onSelectStandard(cand)}
                          className={`hover:bg-blue-50/50 cursor-pointer transition ${
                            idx === 0 ? "bg-blue-50/20 font-medium" : ""
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-500 font-mono">#{idx + 1}</td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-blue-700">{cand.is_number}</span>
                            <span className="block text-[10px] text-slate-500 truncate max-w-xs">{cand.title}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                cand.status === "current"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "bg-red-50 text-red-800"
                              }`}
                            >
                              {cand.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {sb ? `${(sb.semantic_score * 100).toFixed(1)}%` : "—"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {sb ? `${(sb.lexical_score * 100).toFixed(1)}%` : "—"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {sb ? `${(sb.requirement_coverage * 100).toFixed(1)}%` : "—"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {sb ? `${(sb.domain_score * 100).toFixed(1)}%` : "—"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-blue-900">
                            {cand.ai_relevance_score}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transparent Dataset Disclaimer Footer */}
          <div className="pt-4 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="italic">
              * The "AI Relevance Score" represents algorithmic specification relevance, not official statutory compliance.
            </span>
            <span className="font-semibold text-slate-600">
              Prototype Knowledge Base (113 Indian Standards) • SentenceTransformer all-MiniLM-L6-v2 + BM25 Okapi
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
