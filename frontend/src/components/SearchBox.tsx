"use client";

import React, { useRef, useState } from "react";
import { Paperclip, ArrowUp, X } from "lucide-react";

interface SearchBoxProps {
  query: string;
  setQuery: (q: string) => void;
  onAnalyze: (q?: string) => void;
  onUploadPdf: (file: File) => void;
  isLoading: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  query,
  setQuery,
  onAnalyze,
  onUploadPdf,
  isLoading,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFileName(f.name); onUploadPdf(f); }
  };

  const canSubmit = !!(query.trim() || fileName) && !isLoading;

  return (
    <div style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}>

      {fileName && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 16px",
          marginBottom: -1,
          background: "#DDD6F8",
          borderRadius: "10px 10px 0 0",
          border: "1.5px solid #C0AEED",
          borderBottom: "none",
        }}>
          <Paperclip size={12} color="#7C5FC4" />
          <span style={{ fontSize: 12, color: "#5B21B6", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{fileName}</span>
          <button onClick={() => setFileName(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9E8EC0", display: "flex", padding: 0 }}>
            <X size={12} />
          </button>
        </div>
      )}

      <div style={{
        background: "#FFFFFF",
        borderRadius: fileName ? "0 0 14px 14px" : 14,
        border: `1.5px solid ${focused ? "#7C3AED" : "#C8BCEC"}`,
        boxShadow: focused
          ? "0 0 0 4px rgba(124,58,237,0.15), 0 8px 30px rgba(91,33,182,0.12)"
          : "0 4px 20px rgba(91,33,182,0.1)",
        transition: "border-color 0.15s, box-shadow 0.15s",
        overflow: "hidden",
      }}>
        <textarea
          ref={textareaRef}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
          }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAnalyze(); } }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Describe your procurement requirement — e.g. '15 kW three-phase induction motor, 415V, 50Hz'…"
          rows={2}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            padding: "18px 20px 10px",
            fontSize: 16,
            color: "#1A0E40",
            resize: "none",
            lineHeight: 1.6,
            fontFamily: "inherit",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px 14px" }}>
          <div>
            <input type="file" ref={fileRef} onChange={handleFile} accept=".pdf" style={{ display: "none" }} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 12px",
                background: "none",
                border: "1px solid #D5CCEF",
                borderRadius: 8,
                fontSize: 13,
                color: "#6D5898",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F0ECFE"; e.currentTarget.style.color = "#5B21B6"; e.currentTarget.style.borderColor = "#A08DD8"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6D5898"; e.currentTarget.style.borderColor = "#D5CCEF"; }}
            >
              <Paperclip size={14} /> Attach tender PDF
            </button>
          </div>

          <button
            onClick={() => onAnalyze()}
            disabled={!canSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              background: canSubmit ? "#5B21B6" : "#E4DEFA",
              color: canSubmit ? "#fff" : "#B8ACDA",
              border: "none",
              borderRadius: 10,
              fontSize: 14.5,
              fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.15s",
              boxShadow: canSubmit ? "0 3px 12px rgba(91,33,182,0.35)" : "none",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={e => { if (canSubmit) { e.currentTarget.style.background = "#4C1D95"; e.currentTarget.style.boxShadow = "0 5px 18px rgba(91,33,182,0.45)"; } }}
            onMouseLeave={e => { if (canSubmit) { e.currentTarget.style.background = "#5B21B6"; e.currentTarget.style.boxShadow = "0 3px 12px rgba(91,33,182,0.35)"; } }}
          >
            {isLoading ? (
              <>
                <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Searching…
              </>
            ) : (
              <>Search <ArrowUp size={14} /></>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
