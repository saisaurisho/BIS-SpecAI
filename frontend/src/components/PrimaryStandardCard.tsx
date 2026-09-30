"use client";

import React, { useState } from "react";
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  Network,
  Calendar,
  Sparkles,
  Download,
  FileCheck2,
} from "lucide-react";
import { StandardMetadata } from "@/types";
import { LiveVerificationBadge } from "./LiveVerificationBadge";
import { exportStandardPdf } from "@/lib/api";

interface Props {
  standard: StandardMetadata;
  semanticNote?: string;
  onOpenGraph: () => void;
  onViewStandard: (std: StandardMetadata) => void;
  onOpenClause?: () => void;
  tenderClause?: string;
}

export const PrimaryStandardCard: React.FC<Props> = ({
  standard,
  onOpenGraph,
  tenderClause,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const score = standard.ai_relevance_score || 85;

  // Distinguish lifecycle states accurately
  const isCurrent = standard.status === "current";
  const isSuperseded = standard.status === "superseded" || Boolean(standard.superseded_by);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const blob = await exportStandardPdf(standard, tenderClause);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanNum = standard.is_number.replace(/[^a-zA-Z0-9_\-]/g, "_");
      a.download = `BIS_Specification_${cleanNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert("Failed to export PDF: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border-2 border-blue-600/30 p-5 md:p-7 transition-all hover:border-blue-600/50 space-y-5">
      {/* 1. Header: Primary Badge + Lifecycle Badge + Relevance at top + Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-bold bg-blue-700 text-white shadow-2xs">
            <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
            PRIMARY APPLICABLE STANDARD
          </span>

          {/* Relevance at the top */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold bg-purple-50 text-purple-800 border border-purple-300">
            <Sparkles className="w-4 h-4 text-purple-600" />
            {score}% AI Relevance
          </span>

          {/* Lifecycle Status: Current vs Superseded */}
          {isCurrent ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Current / Active Edition
            </span>
          ) : isSuperseded ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-lg bg-red-50 text-red-800 border border-red-300">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              ⚠ Superseded Standard
            </span>
          ) : (
            <span className="text-sm font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-300">
              {standard.status}
            </span>
          )}
        </div>

        {/* Action Buttons: Export as PDF + Relationship Graph */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Generating PDF..." : "Export as PDF"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenGraph}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Network className="w-4 h-4 text-blue-700" />
            <span>Relationship Graph</span>
          </button>
        </div>
      </div>

      {/* 2. Standard Identification: IS Number & Title */}
      <div>
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight font-mono">
            {standard.is_number}
          </h3>
          <span className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            Edition: {standard.year}
          </span>
          <span className="text-sm px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200">
            {standard.domain} Domain
          </span>
        </div>

        <p className="text-xl font-bold text-slate-900 mt-2 leading-snug">
          {standard.title}
        </p>

        {/* Active Replacement Standard Notice if Superseded */}
        {isSuperseded && standard.superseded_by && (
          <div
            style={{
              marginTop: 12,
              marginBottom: 12,
              padding: "14px 18px",
              background: "#EFF6FF",
              border: "1.5px solid #93C5FD",
              borderRadius: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ⚡ Current Active Replacement Standard
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#DBEAFE", color: "#1D4ED8" }}>
                MANDATORY FOR TENDERS
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1E3A8A", fontFamily: "monospace" }}>
              {standard.superseded_by}
            </div>
            <div style={{ fontSize: 14.5, color: "#1E40AF", marginTop: 4, lineHeight: 1.55 }}>
              This cited standard is superseded. The active modern edition <strong>{standard.superseded_by}</strong> is the legally enforceable standard required under BIS Quality Control Orders (QCO) to prevent bid disqualification.
            </div>
          </div>
        )}

        {/* Live BIS Know Your Standards Agent Verification */}
        <LiveVerificationBadge
          isNumber={standard.is_number}
          year={standard.year}
          title={standard.title}
        />
      </div>

      {/* 3. PRIMARY EXPLANATION: "WHY THIS STANDARD?" */}
      <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            WHY THIS STANDARD?
          </h4>
          <span className="text-xs font-semibold text-slate-500">
            Automated Specification Verification
          </span>
        </div>

        {/* 4 Reason Cards in 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="font-bold text-slate-900 flex items-start gap-1.5">
              <span className="text-emerald-700 font-bold">✓</span>
              <div>
                <span>Product match: </span>
                <span className="font-normal text-slate-700">
                  Identified equipment and function directly match standard scope.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="font-bold text-slate-900 flex items-start gap-1.5">
              <span className="text-emerald-700 font-bold">✓</span>
              <div>
                <span>Technical specification match: </span>
                <span className="font-normal text-slate-700">
                  Operating parameters and electrical/mechanical ratings align with standard specifications.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="font-bold text-slate-900 flex items-start gap-1.5">
              <span className="text-emerald-700 font-bold">✓</span>
              <div>
                <span>Application / domain match: </span>
                <span className="font-normal text-slate-700">
                  Procurement application context matches official BIS {standard.domain} domain scope.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="font-bold text-slate-900 flex items-start gap-1.5">
              <span className="text-emerald-700 font-bold">✓</span>
              <div>
                <span>Requirement coverage: </span>
                <span className="font-normal text-slate-700">
                  Encompasses mandatory performance criteria, test protocols, and quality requirements.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5th reason: Version Status Confirmation */}
        <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs text-sm">
          <div className="font-bold text-slate-900 flex items-start gap-1.5">
            <span className="text-emerald-700 font-bold">✓</span>
            <div>
              <span>Current version status: </span>
              <span className="font-normal text-slate-700">
                {isCurrent
                  ? `Standard ${standard.is_number} is the current, active authoritative edition on record.`
                  : isSuperseded
                  ? `Note: ${standard.is_number} is superseded by ${standard.superseded_by}.`
                  : `Edition verified in official repository.`}
              </span>
            </div>
          </div>
        </div>

        {/* Verified Technical Parameters Display */}
        {standard.technical_parameters && Object.keys(standard.technical_parameters).length > 0 && (
          <div className="pt-2.5 border-t border-slate-200/60">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Verified Technical Parameters:
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(standard.technical_parameters).map(([key, val], idx) => {
                const valStr = Array.isArray(val) ? val.join(", ") : String(val);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium"
                  >
                    <span>{key}:</span>
                    <strong className="font-bold">{valStr}</strong>
                    <span className="text-emerald-600 font-bold">✓</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
