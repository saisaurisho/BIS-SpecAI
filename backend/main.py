import os
import re
import json
import time
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.models.schemas import (
    RequirementAnalysisRequest,
    AnalysisResponse,
    StandardMetadata,
    GraphData,
    VersionAlert,
    RelatedStandardsCategorized,
    LatencyBreakdown,
    StandardVerificationRequest,
    StandardVerificationResult,
    DiscoverStandardsRequest,
    DiscoverStandardsResponse
)
from backend.services.nlp_extractor import extract_requirements
from backend.services.retrieval_engine import HybridRetrievalEngine
from backend.services.graph_service import StandardsGraphService
from backend.services.version_auditor import VersionAuditor
from backend.services.pdf_service import PDFParserService
from backend.services.bis_kys_agent import BISKnowYourStandardsAgent

app = FastAPI(
    title="BIS-SpecAI API",
    description="AI-Powered Recommendation Engine for Identifying Applicable Indian Standards for Procurement Specifications",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Core Services
retrieval_engine = HybridRetrievalEngine(standards_path="data/standards.json")
graph_service = StandardsGraphService(standards_path="data/standards.json", relationships_path="data/relationships.json")
version_auditor = VersionAuditor(standards_path="data/standards.json")
pdf_service = PDFParserService()
kys_agent = BISKnowYourStandardsAgent(standards_path="data/standards.json")

# Load Certifications & Examples
with open("data/certifications.json", "r", encoding="utf-8") as f:
    CERTIFICATIONS_DATA = json.load(f)

with open("data/examples.json", "r", encoding="utf-8") as f:
    EXAMPLES_DATA = json.load(f)

from backend.services.nlp_extractor import extract_requirements, segment_multi_requirements
from backend.models.schemas import RequirementGroupResult

def run_pipeline(query: str, top_k: int = 5, mode: str = "hybrid") -> AnalysisResponse:
    t_start = time.perf_counter()

    # 1. NLP Requirement Extraction & Multi-Requirement Grouping
    t0 = time.perf_counter()
    full_req = extract_requirements(query)
    groups = segment_multi_requirements(query)
    nlp_ms = round((time.perf_counter() - t0) * 1000.0, 2)

    # 2. Version and Supersession Audit
    version_alerts = version_auditor.audit_text_for_versions(query, full_req.detected_standards)

    # If multiple distinct requirement groups are identified (e.g. multi-product tender)
    if len(groups) > 1:
        t1 = time.perf_counter()
        group_results: List[RequirementGroupResult] = []
        all_clauses: List[str] = []

        for g in groups:
            g_req = g["requirements"]
            g_cands = retrieval_engine.retrieve_candidates(g["text"], g_req, top_k=top_k, mode=mode)
            g_meets, g_conf, g_msg = retrieval_engine.check_confidence(g_cands)
            g_alerts = version_auditor.audit_text_for_versions(g["text"], g_req.detected_standards)

            g_primary = g_cands[0] if (g_cands and g_meets) else None
            g_rel = graph_service.get_related_standards(g_primary) if g_primary else RelatedStandardsCategorized()
            g_clause = retrieval_engine.generate_tender_clause(g_primary, g_rel) if g_primary else None
            if g_clause:
                all_clauses.append(g_clause)

            group_results.append(RequirementGroupResult(
                group_id=g["group_id"],
                requirement_label=g["label"],
                extracted_requirements=g_req,
                primary_standard=g_primary,
                candidate_standards=g_cands,
                related_standards=g_rel,
                version_alerts=g_alerts,
                meets_recommendation_threshold=g_meets,
                confidence=g_conf,
                threshold_message=g_msg,
                semantic_vs_keyword_note=g_primary.semantic_insight if g_primary else None,
                tender_clause=g_clause
            ))

        retrieval_ms = round((time.perf_counter() - t1) * 1000.0, 2)

        # Primary anchor is from first qualifying group
        primary_group = next((gr for gr in group_results if gr.primary_standard is not None), group_results[0])
        primary_std = primary_group.primary_standard
        candidates = primary_group.candidate_standards
        related_standards = primary_group.related_standards
        graph_data = graph_service.build_react_flow_graph(primary_std, related_standards) if primary_std else GraphData(nodes=[], edges=[])

        total_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
        latency = LatencyBreakdown(
            nlp_extraction_ms=nlp_ms,
            retrieval_ms=retrieval_ms,
            reranking_ms=0.5,
            graph_expansion_ms=0.5,
            total_ms=total_ms
        )

        summary = (
            f"Identified {len(group_results)} distinct technical procurement requirements in specification. "
            f"Retrieved primary applicable standards, testing methods, and safety references for each item independently."
        )

        return AnalysisResponse(
            query=query,
            extracted_requirements=full_req,
            primary_standard=primary_std,
            candidate_standards=candidates,
            related_standards=related_standards,
            version_alerts=version_alerts,
            certifications=[],
            graph_data=graph_data,
            summary_explanation=summary,
            latency_breakdown=latency,
            meets_recommendation_threshold=primary_group.meets_recommendation_threshold,
            confidence=primary_group.confidence,
            threshold_message=primary_group.threshold_message,
            semantic_vs_keyword_note=primary_std.semantic_insight if primary_std else None,
            is_multi_requirement=True,
            requirement_groups=group_results,
            tender_clause="\n\n".join(all_clauses)
        )

    # 3. Single Requirement Flow (BM25 + Dense Semantic Vector Search + Chunk Max-Pooling)
    t1 = time.perf_counter()
    candidates = retrieval_engine.retrieve_candidates(query, full_req, top_k=top_k, mode=mode)
    retrieval_ms = round((time.perf_counter() - t1) * 1000.0, 2)

    t2 = time.perf_counter()
    meets_threshold, confidence, threshold_msg = retrieval_engine.check_confidence(candidates)

    if not candidates or not meets_threshold:
        empty_graph = GraphData(nodes=[], edges=[])
        empty_rel = RelatedStandardsCategorized()
        total_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
        latency = LatencyBreakdown(
            nlp_extraction_ms=nlp_ms,
            retrieval_ms=retrieval_ms,
            reranking_ms=0.0,
            graph_expansion_ms=0.0,
            total_ms=total_ms
        )
        return AnalysisResponse(
            query=query,
            extracted_requirements=full_req,
            primary_standard=None,
            candidate_standards=candidates,
            related_standards=empty_rel,
            version_alerts=version_alerts,
            certifications=[],
            graph_data=empty_graph,
            summary_explanation=threshold_msg or "No sufficiently relevant Indian Standards found for this specification in the prototype catalog.",
            latency_breakdown=latency,
            meets_recommendation_threshold=False,
            confidence="low",
            threshold_message=threshold_msg,
            is_multi_requirement=False,
            requirement_groups=[],
            tender_clause="No applicable standards clause available (query below recommendation threshold)."
        )

    # Primary recommended standard is candidate rank #1
    primary_std = candidates[0]
    reranking_ms = round((time.perf_counter() - t2) * 1000.0, 2)

    # 4. Traversal of Related Standards
    t3 = time.perf_counter()
    related_standards = graph_service.get_related_standards(primary_std)

    # 5. Build Interactive React Flow Graph
    graph_data = graph_service.build_react_flow_graph(primary_std, related_standards)
    graph_ms = round((time.perf_counter() - t3) * 1000.0, 2)

    # 6. Check applicable certification schemes
    applicable_certs = []
    for cert_scheme in CERTIFICATIONS_DATA:
        for item in cert_scheme.get("mandatory_items", []):
            if primary_std.is_number in item or (full_req.product and full_req.product.lower() in item.lower()):
                applicable_certs.append(cert_scheme)
                break

    # 7. Synthesize Transparent Summary Explanation
    prod_label = full_req.product if full_req.product else "specified item"
    app_label = f" in {full_req.application}" if full_req.application else ""
    summary = (
        f"Selected {primary_std.is_number} as the primary applicable standard with an "
        f"AI relevance score of {primary_std.ai_relevance_score}%. "
        f"The specification requires a {prod_label}{app_label}. "
        f"Mapped {len(related_standards.normative_references)} normative references, "
        f"{len(related_standards.testing_standards)} testing standards, and "
        f"{len(related_standards.safety_standards)} safety standards."
    )
    if version_alerts:
        summary += f" Detected {len(version_alerts)} obsolete or superseded standard references in the requirement text."

    # 8. Generate Tender Compliance Clause
    tender_clause = retrieval_engine.generate_tender_clause(primary_std, related_standards)

    total_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
    latency = LatencyBreakdown(
        nlp_extraction_ms=nlp_ms,
        retrieval_ms=retrieval_ms,
        reranking_ms=reranking_ms,
        graph_expansion_ms=graph_ms,
        total_ms=total_ms
    )

    return AnalysisResponse(
        query=query,
        extracted_requirements=full_req,
        primary_standard=primary_std,
        candidate_standards=candidates,
        related_standards=related_standards,
        version_alerts=version_alerts,
        certifications=applicable_certs,
        graph_data=graph_data,
        summary_explanation=summary,
        latency_breakdown=latency,
        meets_recommendation_threshold=True,
        confidence=confidence,
        threshold_message=threshold_msg,
        semantic_vs_keyword_note=primary_std.semantic_insight,
        is_multi_requirement=False,
        requirement_groups=[],
        tender_clause=tender_clause
    )


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BIS-SpecAI Engine",
        "standards_indexed": len(retrieval_engine.standards),
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "version": "1.0.0"
    }

@app.get("/api/examples")
def get_examples():
    """Returns curated demo scenarios for evaluation."""
    return EXAMPLES_DATA

@app.get("/api/standards")
def get_all_standards():
    """Returns catalog of Indian Standards in prototype dataset."""
    return retrieval_engine.standards

@app.get("/api/standards/{std_id}")
def get_standard_detail(std_id: str):
    data = graph_service.get_relationships_for_standard_id(std_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Standard '{std_id}' not found in catalog.")
    return data

@app.get("/api/standards/{std_id}/relationships")
def get_standard_relationships(std_id: str):
    """Explicit endpoint for retrieving relationship DAG and categorized references for any standard."""
    data = graph_service.get_relationships_for_standard_id(std_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Standard '{std_id}' not found in catalog.")
    return data

@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze_requirement(req_input: RequirementAnalysisRequest):
    """
    Main endpoint:
    Natural language procurement query -> Extraction -> Hybrid Retrieval -> Scoring -> Explainability -> Graph.
    """
    if not req_input.query or len(req_input.query.strip()) < 3:
        raise HTTPException(status_code=400, detail="Query text is too short.")
    return run_pipeline(req_input.query, top_k=req_input.top_k)

@app.post("/api/upload", response_model=AnalysisResponse)
async def upload_tender_pdf(file: UploadFile = File(...), top_k: int = Form(5)):
    """
    Tender PDF upload endpoint:
    Extracts text using PyMuPDF -> Audits versions -> Runs recommendation pipeline.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        content = await file.read()
        if not content or len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        extracted_text = pdf_service.extract_text_from_pdf_bytes(content)
        if not extracted_text or len(extracted_text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Could not extract readable text from PDF. Document may be empty or image-only scanned.")
        return run_pipeline(extracted_text, top_k=top_k)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted PDF file: {str(e)}")


# =========================================================================
# Live BIS Know Your Standards Agent Endpoints
# =========================================================================

@app.post("/api/agent/verify-standard", response_model=StandardVerificationResult)
async def verify_standard_on_portal(req: StandardVerificationRequest):
    """
    Live BIS Know Your Standards Agent:
    Reverifies an Indian Standard against the official BIS portal (services.bis.gov.in).
    Checks active legal status, latest revisions, supersessions, and normative links.
    """
    if not req.is_number or len(req.is_number.strip()) < 2:
        raise HTTPException(status_code=400, detail="Invalid Indian Standard number.")
    return await kys_agent.verify_standard(req.is_number, req.year, req.title)


@app.post("/api/agent/discover-standards", response_model=DiscoverStandardsResponse)
async def discover_standards_on_web(req: DiscoverStandardsRequest):
    """
    Live BIS Know Your Standards Agent:
    Discovers newly published or related Indian Standards on the official BIS portal.
    """
    if not req.query or len(req.query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query text is too short.")
    return await kys_agent.discover_new_standards(req.query, limit=req.limit)


from fastapi.responses import Response
from backend.services.pdf_export_service import generate_standard_pdf_bytes

@app.post("/api/export-standard-pdf")
def export_standard_pdf(req: Dict[str, Any]):
    """
    Exports a publication-grade PDF technical specification sheet for the recommended Indian Standard.
    """
    std_data = req.get("standard", {})
    clause_text = req.get("tender_clause")
    pdf_bytes = generate_standard_pdf_bytes(std_data, clause_text)
    clean_num = re.sub(r'[^a-zA-Z0-9_\-]', '_', std_data.get('is_number', 'standard'))
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="BIS_Specification_{clean_num}.pdf"'
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

