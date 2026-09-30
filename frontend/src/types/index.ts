export interface ScoringBreakdown {
  semantic_score: number;
  lexical_score: number;
  requirement_coverage: number;
  domain_score: number;
  version_score: number;
  final_score: number;
}

export interface LatencyBreakdown {
  nlp_extraction_ms: number;
  retrieval_ms: number;
  reranking_ms: number;
  graph_expansion_ms: number;
  total_ms: number;
}

export interface EvidenceItem {
  criterion: string;
  detail: string;
  match_status: string;
}

export interface ExtractedRequirements {
  product?: string;
  product_type?: string;
  application?: string;
  industry_domain?: string;
  voltage?: string;
  current?: string;
  power?: string;
  frequency?: string;
  phase?: string;
  dimensions?: string;
  materials: string[];
  temperature?: string;
  pressure?: string;
  ip_rating?: string;
  performance_requirements: string[];
  safety_requirements: string[];
  testing_requirements: string[];
  detected_standards: string[];
  ratings: Record<string, string>;
  compliance_needs: string[];
  subtype?: string;
  duty?: string;
  efficiency?: string;
  capacity?: string;
  installation_required?: boolean;
  operating_conditions?: string[];
  category?: string;
  domain?: string;
}

export interface AmendmentInfo {
  number: string;
  year: number;
  description: string;
}

export interface StandardMetadata {
  id: string;
  is_number: string;
  title: string;
  year: number;
  domain: string;
  scope: string;
  status: "current" | "superseded" | "withdrawn" | string;
  superseded_by?: string | null;
  supersedes: string[];
  amendments: AmendmentInfo[];
  normative_references: string[];
  test_methods: string[];
  safety_standards: string[];
  installation_standards: string[];
  related_standards: string[];
  certification: string[];
  technical_parameters: Record<string, any>;
  keywords: string[];
  chunks?: Record<string, string>;
  ai_relevance_score?: number;
  scoring_breakdown?: ScoringBreakdown;
  evidence_items?: EvidenceItem[];
  why_recommended?: string[];
  relationship_to_primary?: string;
  is_in_corpus?: boolean;
  semantic_insight?: string;
}

export interface VersionAlert {
  referenced_standard: string;
  status: string;
  current_replacement?: string;
  title?: string;
  recommendation: string;
  severity: "warning" | "error" | "info";
}

export interface RelatedStandardsCategorized {
  normative_references: StandardMetadata[];
  testing_standards: StandardMetadata[];
  safety_standards: StandardMetadata[];
  installation_standards: StandardMetadata[];
  related_products: StandardMetadata[];
  superseded_standards: StandardMetadata[];
}

export interface GraphNode {
  id: string;
  data: {
    is_number: string;
    title: string;
    year: number;
    domain: string;
    status: string;
    scope: string;
    category: string;
    ai_relevance_score?: number;
    is_primary: boolean;
    certification?: string[];
    amendments_count?: number;
    is_in_corpus?: boolean;
    corpus_note?: string;
  };
  position: { x: number; y: number };
  type?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CertificationScheme {
  scheme: string;
  authority: string;
  description: string;
  mandatory_items: string[];
}

export interface RequirementGroupResult {
  group_id: string;
  requirement_label: string;
  extracted_requirements: ExtractedRequirements;
  primary_standard?: StandardMetadata | null;
  candidate_standards: StandardMetadata[];
  related_standards: RelatedStandardsCategorized;
  version_alerts: VersionAlert[];
  meets_recommendation_threshold?: boolean;
  confidence?: "high" | "medium" | "low" | string;
  threshold_message?: string;
  semantic_vs_keyword_note?: string;
  tender_clause?: string;
}

export interface AnalysisResponse {
  query: string;
  extracted_requirements: ExtractedRequirements;
  primary_standard?: StandardMetadata | null;
  candidate_standards: StandardMetadata[];
  related_standards: RelatedStandardsCategorized;
  version_alerts: VersionAlert[];
  certifications: CertificationScheme[];
  graph_data: GraphData;
  summary_explanation: string;
  latency_breakdown?: LatencyBreakdown;
  dataset_label: string;
  meets_recommendation_threshold?: boolean;
  confidence?: "high" | "medium" | "low" | string;
  threshold_message?: string;
  semantic_vs_keyword_note?: string;
  is_multi_requirement?: boolean;
  requirement_groups?: RequirementGroupResult[];
  tender_clause?: string;
}


export interface ExampleScenario {
  id: string;
  label: string;
  category: string;
  query: string;
  expected_standard: string;
  notes: string;
}

export interface StandardVerificationResult {
  is_number: string;
  status: "ACTIVE_CURRENT" | "SUPERSEDED" | "WITHDRAWN" | "UNDER_REVISION" | string;
  status_label: string;
  latest_edition: string;
  published_year?: string | null;
  reaffirmed_year?: string | null;
  superseded_by?: string | null;
  verified_via: string;
  portal_url: string;
  is_valid_for_procurement: boolean;
  revisions_history: Array<{
    id?: string;
    label?: string;
    year?: string;
    reaffirm_year?: string;
  }>;
  amendments_count: number;
  verification_timestamp: string;
  agent_summary: string;
  linked_normative_standards: string[];
}

export interface DiscoveredStandard {
  is_number: string;
  title: string;
  year?: string | null;
  status: string;
  portal_url: string;
  is_in_local_catalog: boolean;
  relevance_note?: string | null;
}

export interface DiscoverStandardsResponse {
  query: string;
  discovered_standards: DiscoveredStandard[];
  total_found_on_portal: number;
  agent_analysis: string;
  portal_source: string;
  execution_time_ms: number;
}

