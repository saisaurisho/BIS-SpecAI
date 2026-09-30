"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe,
  FileCheck2,
} from "lucide-react";
import { verifyStandardOnPortal } from "@/lib/api";
import { StandardVerificationResult } from "@/types";

interface LiveVerificationBadgeProps {
  isNumber: string;
  year?: number;
  title?: string;
}

export const LiveVerificationBadge: React.FC<LiveVerificationBadgeProps> = ({
  isNumber,
  year,
  title,
}) => {
  const [result, setResult] = useState<StandardVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await verifyStandardOnPortal(isNumber, year, title);
      setResult(data);
      setIsExpanded(true);
    } catch (err: any) {
      setError(err.message || "Failed to reach BIS Know Your Standards portal");
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperseded = result?.status === "SUPERSEDED";
  const isValid = result?.is_valid_for_procurement;

  return (
    <div style={{ marginTop: 12, marginBottom: 8 }}>
      {/* Trigger Button if not yet verified */}
      {!result && !isLoading && (
        <button
          type="button"
          onClick={handleVerify}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "#F5F3FF",
            color: "#6D28D9",
            border: "1.5px solid #DDD6FE",
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#EDE9FE";
            e.currentTarget.style.borderColor = "#C4B5FD";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#F5F3FF";
            e.currentTarget.style.borderColor = "#DDD6FE";
          }}
        >
          <Globe size={15} color="#7C3AED" />
          <span>Re-verify on BIS Know Your Standards Portal</span>
        </button>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "#F5F3FF",
            color: "#6D28D9",
            border: "1px solid #DDD6FE",
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} />
          <span>Agent querying official BIS Know Your Standards Portal (services.bis.gov.in)...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            fontSize: 13,
            color: "#991B1B",
          }}
        >
          <AlertTriangle size={15} color="#DC2626" />
          <span>{error}</span>
          <button
            onClick={handleVerify}
            style={{
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#B91C1C",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Verification Result Card */}
      {result && !isLoading && (
        <div
          style={{
            background: isSuperseded ? "#FFF5F5" : "#F0FDF4",
            border: `1.5px solid ${isSuperseded ? "#FCA5A5" : "#86EFAC"}`,
            borderRadius: 10,
            padding: "14px 18px",
            fontSize: 14,
            color: "#1E293B",
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              {isSuperseded ? (
                <ShieldAlert size={20} color="#DC2626" />
              ) : (
                <ShieldCheck size={20} color="#16A34A" />
              )}
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 14.5,
                  color: isSuperseded ? "#991B1B" : "#14532D",
                }}
              >
                {isSuperseded ? "⚠ Superseded on BIS Portal" : "✓ Verified Active on BIS Know Your Standards Portal"}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "2px 9px",
                  borderRadius: 12,
                  background: isSuperseded ? "#FEE2E2" : "#DCFCE7",
                  color: isSuperseded ? "#B91C1C" : "#15803D",
                }}
              >
                {result.status_label}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                {result.verification_timestamp}
              </span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${isSuperseded ? "#FECACA" : "#BBF7D0"}` }}>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: isSuperseded ? "#7F1D1D" : "#166534",
                  marginBottom: 12,
                }}
              >
                {result.agent_summary}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div style={{ background: "rgba(255,255,255,0.75)", padding: "8px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 750, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Latest Recorded Edition
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                    {result.latest_edition}
                  </div>
                </div>

                {result.reaffirmed_year && (
                  <div style={{ background: "rgba(255,255,255,0.75)", padding: "8px 12px", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 750, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Reaffirmed Year
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                      {result.reaffirmed_year}
                    </div>
                  </div>
                )}

                <div style={{ background: "rgba(255,255,255,0.75)", padding: "8px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 750, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Procurement Validity
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      marginTop: 2,
                      color: isValid ? "#15803D" : "#B91C1C",
                    }}
                  >
                    {isValid ? "Compliant for Tenders" : "Non-Compliant (Superseded)"}
                  </div>
                </div>
              </div>

              {/* Linked Normative Standards from Live Portal */}
              {result.linked_normative_standards && result.linked_normative_standards.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 750, color: "#334155", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <FileCheck2 size={14} color="#0284C7" />
                    <span>Normative & Testing Standards Linked on Official Portal:</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.linked_normative_standards.map((linkStd, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 6,
                          background: "rgba(255,255,255,0.85)",
                          border: "1px solid #CBD5E1",
                          color: "#1E293B",
                        }}
                      >
                        {linkStd}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portal External Link */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <a
                  href={result.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#4338CA",
                    textDecoration: "underline",
                  }}
                >
                  <span>Open Record on BIS Know Your Standards Portal (services.bis.gov.in)</span>
                  <ExternalLink size={13} />
                </a>

                <button
                  type="button"
                  onClick={handleVerify}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#64748B",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Re-check</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
