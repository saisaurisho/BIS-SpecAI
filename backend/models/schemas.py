from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class RequirementAnalysisRequest(BaseModel):
    query: str = Field(..., description="Natural language specification or tender text")
    top_k: int = Field(5, description="Number of candidate standards to return")

class ScoringBreakdown(BaseModel):
    semantic_score: float = Field(..., description="Cosine similarity score from dense sentence embeddings (0-1)")
    lexical_score: float = Field(..., description="Normalized BM25 keyword relevance score (0-1)")
    requirement_coverage: float = Field(..., description="Proportion of extracted parameters covered in standard scope (0-1)")
    domain_score: float = Field(..., description="Domain alignment coefficient (0-1)")
    version_score: float = Field(..., description="Lifecycle status validity weight (0-1)")
    final_score: float = Field(..., description="Composite weighted ranking score (0-1)")

class LatencyBreakdown(BaseModel):
    nlp_extraction_ms: float = Field(..., description="Time taken for dynamic parameter extraction (ms)")
    retrieval_ms: float = Field(..., description="Time taken for BM25 + dense semantic vector search (ms)")
    reranking_ms: float = Field(..., description="Time taken for candidate scoring and explainability (ms)")
    graph_expansion_ms: float = Field(..., description="Time taken for relationship DAG traversal (ms)")
    total_ms: float = Field(..., description="Total pipeline execution latency (ms)")

class EvidenceItem(BaseModel):
    criterion: str
    detail: str
    match_status: str = "verified"

class ExtractedRequirements(BaseModel):
    product: Optional[str] = None
    product_type: Optional[str] = None
    application: Optional[str] = None
    industry_domain: Optional[str] = None
    voltage: Optional[str] = None
    current: Optional[str] = None
    power: Optional[str] = None
    frequency: Optional[str] = None
    phase: Optional[str] = None
    dimensions: Optional[str] = None
    materials: List[str] = Field(default_factory=list)
    temperature: Optional[str] = None
    pressure: Optional[str] = None
    ip_rating: Optional[str] = None
    performance_requirements: List[str] = Field(default_factory=list)
    safety_requirements: List[str] = Field(default_factory=list)
    testing_requirements: List[str] = Field(default_factory=list)
    detected_standards: List[str] = Field(default_factory=list)
    
    capacity: Optional[str] = None
    duty: Optional[str] = None
    efficiency: Optional[str] = None
    subtype: Optional[str] = None
    installation_required: Optional[bool] = False
    operating_conditions: List[str] = Field(default_factory=list)
    
    # Generic dictionary of extracted ratings for flexible rendering
    ratings: Dict[str, str] = Field(default_factory=dict)
    compliance_needs: List[str] = Field(default_factory=list)

class AmendmentInfo(BaseModel):
    number: str
    year: int
    description: str

class StandardMetadata(BaseModel):
    id: str
    is_number: str
    title: str
    year: int
    domain: str
    scope: str
    status: str
    superseded_by: Optional[str] = None
    supersedes: List[str] = Field(default_factory=list)
    amendments: List[AmendmentInfo] = Field(default_factory=list)
    normative_references: List[str] = Field(default_factory=list)
    test_methods: List[str] = Field(default_factory=list)
    safety_standards: List[str] = Field(default_factory=list)
    installation_standards: List[str] = Field(default_factory=list)
    related_standards: List[str] = Field(default_factory=list)
    certification: List[str] = Field(default_factory=list)
    technical_parameters: Dict[str, Any] = Field(default_factory=dict)
    keywords: List[str] = Field(default_factory=list)
    chunks: Optional[Dict[str, str]] = None
    ai_relevance_score: Optional[float] = None
    scoring_breakdown: Optional[ScoringBreakdown] = None
    why_recommended: List[str] = Field(default_factory=list)
    evidence_items: List[EvidenceItem] = Field(default_factory=list)
    relationship_to_primary: Optional[str] = None
    is_in_corpus: bool = True
    semantic_insight: Optional[str] = None

class VersionAlert(BaseModel):
    referenced_standard: str
    status: str
    current_replacement: Optional[str] = None
    title: Optional[str] = None
    recommendation: str
    severity: str = "warning"

class RelatedStandardsCategorized(BaseModel):
    normative_references: List[StandardMetadata] = Field(default_factory=list)
    testing_standards: List[StandardMetadata] = Field(default_factory=list)
    safety_standards: List[StandardMetadata] = Field(default_factory=list)
    installation_standards: List[StandardMetadata] = Field(default_factory=list)
    related_products: List[StandardMetadata] = Field(default_factory=list)
    superseded_standards: List[StandardMetadata] = Field(default_factory=list)

class GraphNode(BaseModel):
    id: str
    data: Dict[str, Any]
    position: Dict[str, float]
    type: Optional[str] = "custom"

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: Optional[bool] = False
    style: Optional[Dict[str, Any]] = None

class GraphData(BaseModel):
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)

class RequirementGroupResult(BaseModel):
    group_id: str
    requirement_label: str
    extracted_requirements: ExtractedRequirements
    primary_standard: Optional[StandardMetadata] = None
    candidate_standards: List[StandardMetadata] = Field(default_factory=list)
    related_standards: RelatedStandardsCategorized
    version_alerts: List[VersionAlert] = Field(default_factory=list)
    meets_recommendation_threshold: bool = True
    confidence: str = "high"
    threshold_message: Optional[str] = None
    semantic_vs_keyword_note: Optional[str] = None
    tender_clause: Optional[str] = None

class AnalysisResponse(BaseModel):
    query: str
    extracted_requirements: ExtractedRequirements
    primary_standard: Optional[StandardMetadata] = None
    candidate_standards: List[StandardMetadata] = Field(default_factory=list)
    related_standards: RelatedStandardsCategorized
    version_alerts: List[VersionAlert] = Field(default_factory=list)
    certifications: List[Dict[str, Any]] = Field(default_factory=list)
    graph_data: GraphData
    summary_explanation: str
    latency_breakdown: Optional[LatencyBreakdown] = None
    dataset_label: str = "Prototype Dataset • Curated Standards for Demonstration"
    meets_recommendation_threshold: bool = True
    confidence: str = "high"
    threshold_message: Optional[str] = None
    semantic_vs_keyword_note: Optional[str] = None
    is_multi_requirement: bool = False
    requirement_groups: List[RequirementGroupResult] = Field(default_factory=list)
    tender_clause: Optional[str] = None

# =========================================================================
# BIS Know Your Standards Live Web Agent Schemas
# =========================================================================

class StandardVerificationRequest(BaseModel):
    is_number: str = Field(..., description="Indian Standard number (e.g. 'IS 12615', 'IS 325', 'IS 456')")
    year: Optional[int] = Field(None, description="Year of referenced standard, if known")
    title: Optional[str] = Field(None, description="Title of standard, if known")

class StandardVerificationResult(BaseModel):
    is_number: str
    status: str = Field(..., description="ACTIVE_CURRENT, SUPERSEDED, WITHDRAWN, or UNDER_REVISION")
    status_label: str
    latest_edition: str
    published_year: Optional[str] = None
    reaffirmed_year: Optional[str] = None
    superseded_by: Optional[str] = None
    verified_via: str = "BIS Know Your Standards Portal (services.bis.gov.in)"
    portal_url: str
    is_valid_for_procurement: bool
    revisions_history: List[Dict[str, Any]] = Field(default_factory=list)
    amendments_count: int = 0
    verification_timestamp: str
    agent_summary: str
    linked_normative_standards: List[str] = Field(default_factory=list)

class DiscoverStandardsRequest(BaseModel):
    query: str = Field(..., description="Keywords or procurement need to search live on BIS portal")
    limit: int = Field(10, description="Max new standards to retrieve")

class DiscoveredStandard(BaseModel):
    is_number: str
    title: str
    year: Optional[str] = None
    status: str = "Active"
    portal_url: str
    is_in_local_catalog: bool = False
    relevance_note: Optional[str] = None

class DiscoverStandardsResponse(BaseModel):
    query: str
    discovered_standards: List[DiscoveredStandard] = Field(default_factory=list)
    total_found_on_portal: int
    agent_analysis: str
    portal_source: str = "https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/"
    execution_time_ms: float

