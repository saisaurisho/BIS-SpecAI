import { AnalysisResponse, ExampleScenario, StandardMetadata } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function analyzeRequirement(query: string, topK: number = 5): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Network request failed" }));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function uploadTenderPdf(file: File, topK: number = 5): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("top_k", topK.toString());

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to process PDF" }));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function fetchExamples(): Promise<ExampleScenario[]> {
  const res = await fetch(`${API_BASE}/examples`);
  if (!res.ok) {
    throw new Error("Failed to load preset examples");
  }
  return res.json();
}

export async function fetchStandards(): Promise<StandardMetadata[]> {
  const res = await fetch(`${API_BASE}/standards`);
  if (!res.ok) {
    throw new Error("Failed to load standards catalog");
  }
  return res.json();
}

export async function verifyStandardOnPortal(
  isNumber: string,
  year?: number,
  title?: string
): Promise<import("@/types").StandardVerificationResult> {
  const res = await fetch(`${API_BASE}/agent/verify-standard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_number: isNumber, year, title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Verification failed" }));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function discoverStandardsOnPortal(
  query: string,
  limit: number = 8
): Promise<import("@/types").DiscoverStandardsResponse> {
  const res = await fetch(`${API_BASE}/agent/discover-standards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Standard discovery failed" }));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function exportStandardPdf(
  standard: StandardMetadata,
  tenderClause?: string
): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export-standard-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ standard, tender_clause: tenderClause }),
  });

  if (!res.ok) {
    throw new Error(`Failed to generate PDF (HTTP ${res.status})`);
  }

  return res.blob();
}
