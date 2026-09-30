"use client";

import React, { useState } from "react";
import {
  Globe,
  Sparkles,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { discoverStandardsOnPortal } from "@/lib/api";
import { DiscoverStandardsResponse, DiscoveredStandard } from "@/types";

interface DiscoveredStandardsSectionProps {
  query: string;
  autoTrigger?: boolean;
}

export const DiscoveredStandardsSection: React.FC<DiscoveredStandardsSectionProps> = ({
  query,
  autoTrigger = false,
}) => {
  const [data, setData] = useState<DiscoverStandardsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(autoTrigger);

  const handleDiscover = React.useCallback(async () => {
    if (!query || !query.trim()) return;
    setIsLoading(true);
    setError(null);
    setIsOpen(true);
    try {
      const res = await discoverStandardsOnPortal(query.trim(), 8);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to search BIS portal");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  React.useEffect(() => {
    if (autoTrigger && query && query.trim()) {
      handleDiscover();
    }
  }, [autoTrigger, query, handleDiscover]);

  return (
    <div style={{ marginTop: 24, marginBottom: 12 }}>
      {/* Banner / Trigger */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "#FFFFFF",
          border: "1.5px solid #D5CCEF",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(91,33,182,0.06)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "#EDE8FC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Globe size={18} color="#5B21B6" />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1A0E40", display: "flex", alignItems: "center", gap: 8 }}>
              <span>BIS Know Your Standards Live Web Agent</span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: "#DCFCE7",
                  color: "#15803D",
                }}
              >
                LIVE PORTAL
              </span>
            </div>
            <div style={{ fontSize: 13, color: autoTrigger ? "#5B21B6" : "#7C6EA8", fontWeight: autoTrigger ? 600 : 400, marginTop: 2 }}>
              {autoTrigger
                ? "⚡ Auto-Fallback Active: No match in local 113 catalog — Agent is searching all 20,000+ national standards on services.bis.gov.in"
                : "Check for newly published Indian Standards on official BIS portal (services.bis.gov.in)"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDiscover}
          disabled={isLoading || !query.trim()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 18px",
            background: isLoading ? "#E4DEFA" : "#5B21B6",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: isLoading || !query.trim() ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(91,33,182,0.25)",
            transition: "all 0.15s ease",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.background = "#4C1D95";
          }}
          onMouseLeave={(e) => {
            if (!isLoading) e.currentTarget.style.background = "#5B21B6";
          }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} />
              <span>Scanning BIS Portal...</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Check for New Standards on Web</span>
            </>
          )}
        </button>
      </div>

      {/* Discovered Standards Results Drawer */}
      {isOpen && (
        <div
          style={{
            marginTop: 12,
            background: "#FFFFFF",
            border: "1.5px solid #D5CCEF",
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 4px 14px rgba(91,33,182,0.08)",
          }}
        >
          {isLoading && (
            <div style={{ padding: "24px 0", textAlign: "center", color: "#6D28D9" }}>
              <RefreshCw size={22} style={{ animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Querying official BIS Know Your Standards portal repository...
              </div>
              <div style={{ fontSize: 11, color: "#9E8EC0", marginTop: 4 }}>
                Comparing results against local 113-standards catalog
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div style={{ padding: "12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontSize: 13 }}>
              {error}
            </div>
          )}

          {data && !isLoading && (
            <div>
              {/* Agent Analysis */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 14px",
                  background: "#F3EEFF",
                  borderRadius: 8,
                  marginBottom: 14,
                  fontSize: 12,
                  color: "#4C1D95",
                  lineHeight: 1.6,
                }}
              >
                <ShieldCheck size={16} color="#7C3AED" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <span style={{ fontWeight: 700 }}>Agent Report: </span>
                  {data.agent_analysis}
                </div>
              </div>

              {/* List of Discovered Standards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.discovered_standards.map((std, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: std.is_in_local_catalog ? "#FAF8FF" : "#F0FDF4",
                      border: `1px solid ${std.is_in_local_catalog ? "#E4DEFA" : "#86EFAC"}`,
                      borderRadius: 8,
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: "#1A0E40", fontFamily: "monospace" }}>
                          {std.is_number}
                        </span>
                        {std.year && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "#EDE8FC",
                              color: "#5B21B6",
                            }}
                          >
                            <Calendar size={10} />
                            {std.year}
                          </span>
                        )}
                        {std.is_in_local_catalog ? (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#E2E8F0", color: "#475569" }}>
                            In Local Catalog
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#DCFCE7", color: "#15803D" }}>
                            ✨ New on BIS Portal
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                        {std.title}
                      </div>
                      {std.relevance_note && (
                        <div style={{ fontSize: 11, color: "#15803D", marginTop: 2, fontWeight: 500 }}>
                          • {std.relevance_note}
                        </div>
                      )}
                    </div>

                    <a
                      href={std.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 10px",
                        borderRadius: 6,
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#4338CA",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
                    >
                      <span>View on BIS Portal</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 11,
                  color: "#64748B",
                  borderTop: "1px solid #E4DEFA",
                  paddingTop: 8,
                }}
              >
                <span>Live records from Bureau of Indian Standards (BIS) e-Services</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748B",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Hide
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
