"use client";

import React from "react";
import { ListFilter, ChevronRight, CheckCircle2 } from "lucide-react";
import { StandardMetadata } from "@/types";

interface Props {
  candidates: StandardMetadata[];
  onSelectStandard: (std: StandardMetadata) => void;
}

export const CandidateStandardsList: React.FC<Props> = ({ candidates, onSelectStandard }) => {
  if (!candidates || candidates.length <= 1) return null;

  // Candidate standards other than rank #1
  const secondaryCandidates = candidates.slice(1);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 md:p-6 transition-all">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <ListFilter className="w-5 h-5 text-blue-700" />
            Alternative / Complementary Candidate Standards Evaluated
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Ranked candidate standards scored by the hybrid BM25 + dense semantic retrieval pipeline.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {secondaryCandidates.map((cand, idx) => (
          <div
            key={cand.id || idx}
            onClick={() => onSelectStandard(cand)}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer gap-3 group"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold text-slate-400">#{idx + 2}</span>
                <span className="font-mono text-base font-bold text-blue-900 group-hover:text-blue-700">
                  {cand.is_number}
                </span>
                <span className="text-sm text-slate-500">({cand.year})</span>
                <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200 font-medium">
                  {cand.domain}
                </span>
                {cand.status === "superseded" && (
                  <span className="text-xs px-2.5 py-0.5 bg-red-50 text-red-700 rounded-md border border-red-200 font-medium">
                    Superseded
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-slate-800 mt-1.5 leading-snug">
                {cand.title}
              </div>

              {cand.why_recommended && cand.why_recommended.length > 0 && (
                <div className="text-xs text-slate-600 mt-1.5 line-clamp-1">
                  ✓ {cand.why_recommended[0]}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-xs uppercase font-semibold text-slate-400">
                  Relevance
                </div>
                <div className="text-base font-bold text-slate-800">
                  {cand.ai_relevance_score}%
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
