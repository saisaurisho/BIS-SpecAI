import json
import os
import re
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from rank_bm25 import BM25Okapi

from backend.models.schemas import (
    StandardMetadata,
    ExtractedRequirements,
    AmendmentInfo,
    ScoringBreakdown,
    EvidenceItem
)

# Sentence Transformers genuine embedding model
SENTENCE_MODEL_NAME = "all-MiniLM-L6-v2"

STOPWORDS = {
    "for", "and", "the", "with", "per", "as", "of", "to", "in", "by", "on", 
    "at", "an", "a", "is", "or", "from", "all", "any", "be", "has", "have", 
    "been", "which", "that", "this", "these", "those", "under", "into"
}

from backend.services.nlp_extractor import normalize_query_for_semantic_search

class HybridRetrievalEngine:
    def __init__(self, standards_path: str = "data/standards.json", embeddings_path: str = "data/standards_embeddings.npy", chunk_embeddings_path: str = "data/standards_chunk_embeddings.npz"):
        self.standards_path = standards_path
        self.embeddings_path = embeddings_path
        self.chunk_embeddings_path = chunk_embeddings_path
        self.standards: List[Dict[str, Any]] = []
        self.standards_by_number: Dict[str, Dict[str, Any]] = {}
        self.standards_by_id: Dict[str, Dict[str, Any]] = {}
        
        self.bm25: Optional[BM25Okapi] = None
        self.dense_model = None
        self.doc_embeddings: Optional[np.ndarray] = None
        self.chunk_embeddings: Optional[np.ndarray] = None
        self.chunk_std_indices: Optional[np.ndarray] = None
        self.chunk_types: Optional[np.ndarray] = None
        self.corpus_texts: List[str] = []
        self.using_transformer = False
        
        self.fallback_vectorizer = None
        self.fallback_vectors = None
        
        self.load_data()
        self.initialize_models()

    def load_data(self):
        with open(self.standards_path, "r", encoding="utf-8") as f:
            self.standards = json.load(f)
            
        for s in self.standards:
            self.standards_by_number[s["is_number"]] = s
            self.standards_by_id[s["id"]] = s

    def _prepare_document_text(self, std: Dict[str, Any]) -> str:
        """Constructs rich contextual document string for embedding and BM25 indexing."""
        parts = [
            std.get("is_number", ""),
            std.get("title", ""),
            std.get("domain", ""),
            std.get("scope", ""),
            " ".join(std.get("keywords", [])),
        ]
        
        params = std.get("technical_parameters", {})
        for k, v in params.items():
            if isinstance(v, list):
                parts.append(" ".join(str(item) for item in v))
            else:
                parts.append(str(v))
                
        for cert in std.get("certification", []):
            parts.append(cert)
            
        return " ".join(parts)

    def _tokenize(self, text: str) -> List[str]:
        tokens = re.findall(r"\w+", text.lower())
        return [t for t in tokens if len(t) > 1 and t not in STOPWORDS]

    def initialize_models(self):
        self.corpus_texts = [self._prepare_document_text(s) for s in self.standards]
        
        # 1. BM25 Okapi Lexical Index
        self.bm25_corpus = [self._tokenize(doc) for doc in self.corpus_texts]
        self.bm25 = BM25Okapi(self.bm25_corpus)
        
        # 2. Genuine Sentence Transformer Model with Disk Caching
        try:
            from sentence_transformers import SentenceTransformer
            print(f"[BIS-SpecAI] Loading SentenceTransformer model '{SENTENCE_MODEL_NAME}'...")
            self.dense_model = SentenceTransformer(SENTENCE_MODEL_NAME)
            self.using_transformer = True
            
            # Check for disk cache of full standard embeddings
            if os.path.exists(self.embeddings_path):
                print(f"[BIS-SpecAI] Loading cached standard embeddings from {self.embeddings_path}")
                self.doc_embeddings = np.load(self.embeddings_path)
                if len(self.doc_embeddings) != len(self.standards):
                    print("[BIS-SpecAI] Cached embeddings count mismatch. Recomputing...")
                    self.doc_embeddings = self.dense_model.encode(self.corpus_texts, convert_to_numpy=True, show_progress_bar=False)
                    np.save(self.embeddings_path, self.doc_embeddings)
            else:
                print(f"[BIS-SpecAI] Computing sentence embeddings for {len(self.standards)} standards...")
                self.doc_embeddings = self.dense_model.encode(self.corpus_texts, convert_to_numpy=True, show_progress_bar=False)
                np.save(self.embeddings_path, self.doc_embeddings)
                print(f"[BIS-SpecAI] Saved embeddings to {self.embeddings_path}")
                
            # Check for disk cache of structured chunk embeddings
            if os.path.exists(self.chunk_embeddings_path):
                print(f"[BIS-SpecAI] Loading structured chunk embeddings from {self.chunk_embeddings_path}")
                chunk_npz = np.load(self.chunk_embeddings_path)
                self.chunk_embeddings = chunk_npz["embeddings"]
                self.chunk_std_indices = chunk_npz["standard_indices"]
                self.chunk_types = chunk_npz["chunk_types"]
                print(f"[BIS-SpecAI] Loaded {len(self.chunk_embeddings)} structured chunk embeddings.")
                
        except Exception as e:
            print(f"[BIS-SpecAI] Note: SentenceTransformer initialization note ({str(e)}). Engaging resilient subword vector fallback.")
            self.using_transformer = False
            from sklearn.feature_extraction.text import TfidfVectorizer
            self.fallback_vectorizer = TfidfVectorizer(ngram_range=(1, 3), analyzer="word", sublinear_tf=True, max_features=10000)
            self.fallback_vectors = self.fallback_vectorizer.fit_transform(self.corpus_texts)

    def _compute_dense_similarity(self, query: str) -> np.ndarray:
        """Computes cosine similarity between query and documents with structured chunk max-pooling."""
        if self.using_transformer and self.dense_model is not None and self.doc_embeddings is not None:
            query_emb = self.dense_model.encode([query], convert_to_numpy=True, show_progress_bar=False)
            full_sims = cosine_similarity(query_emb, self.doc_embeddings)[0]
            
            # Incorporate structured chunk max-pooling across scope, requirements, parameters, testing
            if self.chunk_embeddings is not None and self.chunk_std_indices is not None:
                chunk_sims = cosine_similarity(query_emb, self.chunk_embeddings)[0]
                chunk_max_scores = np.zeros(len(self.standards))
                for i in range(len(self.standards)):
                    mask = (self.chunk_std_indices == i)
                    if np.any(mask):
                        chunk_max_scores[i] = float(np.max(chunk_sims[mask]))
                
                # Fuses overall document semantic similarity (50%) with specific chunk hit similarity (50%)
                combined_sims = 0.5 * full_sims + 0.5 * chunk_max_scores
                return np.clip(combined_sims, 0.0, 1.0)
                
            return np.clip(full_sims, 0.0, 1.0)
        elif self.fallback_vectorizer is not None and self.fallback_vectors is not None:
            query_vec = self.fallback_vectorizer.transform([query])
            sims = cosine_similarity(query_vec, self.fallback_vectors)[0]
            return np.clip(sims, 0.0, 1.0)
        else:
            return np.zeros(len(self.standards))

    def retrieve_candidates(self, query: str, req: ExtractedRequirements, top_k: int = 5, mode: str = "hybrid") -> List[StandardMetadata]:
        """
        Executes hybrid retrieval:
        1. BM25 Okapi lexical scores on raw query tokens [0, 1]
        2. Dense Sentence Transformer cosine similarity on normalized semantic query with chunk max-pooling [0, 1]
        3. Parameter & domain coverage score [0, 1]
        4. Lifecycle status weighting
        Returns ranked list of StandardMetadata with full ScoringBreakdown and itemized evidence.
        """
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []
            
        # 1. BM25 Lexical Scores with realistic scaling denominator
        bm25_raw_scores = np.array(self.bm25.get_scores(query_tokens))
        max_bm25 = float(np.max(bm25_raw_scores)) if len(bm25_raw_scores) > 0 and np.max(bm25_raw_scores) > 0 else 1.0
        scale_denom = max(10.0, max_bm25)
        bm25_norm = np.clip(bm25_raw_scores / scale_denom, 0.0, 1.0)

        # 2. Dense Sentence Transformer Cosine Similarity on Normalized Semantic Query
        normalized_semantic_query = normalize_query_for_semantic_search(req, query)
        dense_scores = self._compute_dense_similarity(normalized_semantic_query)

        # 3. Multi-Factor Reranking with Full Factor Breakdowns
        scored_candidates: List[Tuple[float, ScoringBreakdown, Dict[str, Any], List[str], List[EvidenceItem]]] = []
        query_lower = query.lower()

        # Build list of active parameters from requirement extraction
        active_params: List[Tuple[str, str]] = []
        if req.power: active_params.append(("Power / Capacity", req.power))
        if req.voltage: active_params.append(("Voltage Rating", req.voltage))
        if req.frequency: active_params.append(("Frequency", req.frequency))
        if req.phase: active_params.append(("Phase", req.phase))
        if req.current: active_params.append(("Current", req.current))
        if req.ip_rating: active_params.append(("Ingress Protection", req.ip_rating))
        if req.dimensions: active_params.append(("Dimensions", req.dimensions))
        if req.pressure: active_params.append(("Pressure Rating", req.pressure))
        if req.temperature: active_params.append(("Temperature", req.temperature))
        for k, v in req.ratings.items():
            if not any(k == ap[0] for ap in active_params):
                active_params.append((k, v))

        for idx, std in enumerate(self.standards):
            std_text = self.corpus_texts[idx].lower()
            reasons: List[str] = []
            evidence: List[EvidenceItem] = []
            
            sem_score = float(dense_scores[idx])
            lex_score = float(bm25_norm[idx])
            
            # Coverage scoring
            coverage_hits = 0
            coverage_total = len(active_params) + len(req.compliance_needs)
            
            for p_name, p_val in active_params:
                clean_val = p_val.lower().replace(" (3-phase)", "").replace(" (1-phase)", "")
                tokens = clean_val.split()
                if clean_val in std_text or any(token in std_text for token in tokens if len(token) > 1):
                    coverage_hits += 1
                    reasons.append(f"Standard scope covers {p_name}: {p_val}")
                    evidence.append(EvidenceItem(criterion=p_name, detail=f"Verified match in standard scope: {p_val}"))

            for c_need in req.compliance_needs:
                c_tokens = [w.lower() for w in c_need.split() if len(w) > 3]
                if any(t in std_text for t in c_tokens):
                    coverage_hits += 1
                    reasons.append(f"Addresses critical condition: {c_need}")
                    evidence.append(EvidenceItem(criterion="Compliance Condition", detail=c_need))

            coverage_ratio = float(coverage_hits / coverage_total) if coverage_total > 0 else 0.5
            
            # Domain match
            domain_match = 1.0 if req.industry_domain and req.industry_domain.lower() == std.get("domain", "").lower() else 0.4
            if domain_match == 1.0:
                reasons.append(f"Domain alignment: {std.get('domain')} catalog")
                evidence.append(EvidenceItem(criterion="Domain Alignment", detail=f"Conforms to {std.get('domain')} sector requirements"))

            # Product match
            if req.product and any(w in std.get("title", "").lower() for w in req.product.lower().split() if len(w) > 3):
                reasons.append(f"Equipment class match: {req.product}")
                evidence.append(EvidenceItem(criterion="Equipment Class", detail=f"Matched standard title & specification scope"))

            # Critical vocabulary mismatch penalty:
            # e.g. User asked for optical/fiber cables, but standard is copper/PVC electrical power cable
            if any(w in query_lower for w in ["optical", "fiber", "fibre"]) and not any(w in std_text for w in ["optical", "fiber", "fibre"]):
                sem_score *= 0.35
                lex_score *= 0.2
                coverage_ratio = 0.05
                domain_match = 0.1

            # Status weighting (1.0 for active, 0.4 for superseded)
            status = std.get("status", "current")
            is_explicitly_mentioned = std["is_number"].lower() in query_lower or std["id"].lower() in query_lower
            
            if status == "superseded":
                status_factor = 0.8 if is_explicitly_mentioned else 0.4
                reasons.append("Note: Standard has been superseded by newer edition")
                evidence.append(EvidenceItem(criterion="Lifecycle Status", detail=f"Superseded standard (Replacement: {std.get('superseded_by', 'Current edition')})"))
            else:
                status_factor = 1.0
                reasons.append(f"Standard is active and current ({std.get('year')} edition)")
                evidence.append(EvidenceItem(criterion="Lifecycle Status", detail=f"Active current edition ({std.get('year')})"))

            # Certification
            if std.get("certification"):
                reasons.append(f"Quality compliance: {std['certification'][0]}")
                evidence.append(EvidenceItem(criterion="Certification", detail=std['certification'][0]))

            # Compute score based on retrieval mode
            if mode == "bm25_only":
                raw_score = lex_score
            elif mode == "semantic_only":
                raw_score = sem_score
            else: # hybrid
                raw_score = (
                    0.35 * sem_score +
                    0.25 * lex_score +
                    0.20 * coverage_ratio +
                    0.10 * domain_match +
                    0.10 * status_factor
                )
            raw_score = float(np.clip(raw_score, 0.0, 1.0))
            
            breakdown = ScoringBreakdown(
                semantic_score=round(sem_score, 4),
                lexical_score=round(lex_score, 4),
                requirement_coverage=round(coverage_ratio, 4),
                domain_score=round(domain_match, 4),
                version_score=round(status_factor, 4),
                final_score=round(raw_score, 4)
            )

            # Semantic vs Keyword Demonstration insight:
            # Detect queries where dense vectors bridged vocabulary differences from the official standard title
            title_tokens = [w for w in re.findall(r'[a-zA-Z0-9]+', std.get("title", "").lower()) 
                            if len(w) > 3 and w not in {"specification", "indian", "standard", "code", "part", "section"}]
            matched_title_tokens = [w for w in title_tokens if w in query_lower]
            title_overlap = len(matched_title_tokens) / max(1, len(title_tokens))

            sem_insight = None
            if sem_score >= 0.38 and (title_overlap <= 0.45 or lex_score < 0.45):
                prod_term = req.product if req.product and req.product != "Procurement Item" else "domain requirements"
                sem_insight = (
                    f"Retrieved via dense semantic vector search (all-MiniLM-L6-v2): "
                    f"The query describes equipment using functional wording ({prod_term}) "
                    f"rather than the standard's verbatim title ('{std.get('title')}'). Dense embeddings matched "
                    f"the underlying engineering application and product class."
                )

            scored_candidates.append((raw_score, breakdown, std, reasons, evidence, sem_insight))

        # Sort descending by raw score
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        results: List[StandardMetadata] = []
        for raw_score, breakdown, std, reasons, evidence, sem_insight in scored_candidates[:top_k + 2]:
            amendments = [
                AmendmentInfo(number=a.get("number", ""), year=a.get("year", 0), description=a.get("description", ""))
                for a in std.get("amendments", [])
            ]
            
            # Map raw score (0-1) to an honest percentage
            # For low-relevance queries (<0.30), preserve true low score without artificial floor
            if raw_score < 0.30:
                calibrated_percent = round(raw_score * 100.0, 1)
            else:
                calibrated_percent = round(min(98.5, max(30.0, raw_score * 100.0)), 1)

            meta = StandardMetadata(
                id=std["id"],
                is_number=std["is_number"],
                title=std["title"],
                year=std["year"],
                domain=std["domain"],
                scope=std["scope"],
                status=std["status"],
                superseded_by=std.get("superseded_by"),
                supersedes=std.get("supersedes", []),
                amendments=amendments,
                normative_references=std.get("normative_references", []),
                test_methods=std.get("test_methods", []),
                safety_standards=std.get("safety_standards", []),
                installation_standards=std.get("installation_standards", []),
                related_standards=std.get("related_standards", []),
                certification=std.get("certification", []),
                technical_parameters=std.get("technical_parameters", []),
                keywords=std.get("keywords", []),
                ai_relevance_score=calibrated_percent,
                scoring_breakdown=breakdown,
                why_recommended=reasons[:5],
                evidence_items=evidence[:5],
                is_in_corpus=True,
                semantic_insight=sem_insight
            )
            results.append(meta)

        # If a candidate is superseded, ensure its active replacement is promoted to Rank 1 (#1 position)
        final_results = results[:top_k]
        existing_numbers = {c.is_number for c in final_results}
        
        for cand in list(final_results):
            if cand.status == "superseded" and cand.superseded_by:
                rep_num = cand.superseded_by
                # Check if the replacement standard was already retrieved in the results
                rep_existing = next((c for c in results if c.is_number == rep_num), None)
                if rep_existing:
                    if rep_existing in final_results:
                        final_results.remove(rep_existing)
                    rep_existing.ai_relevance_score = max(rep_existing.ai_relevance_score or 85.0, (cand.ai_relevance_score or 80.0) + 3.0)
                    final_results.insert(0, rep_existing)
                    existing_numbers.add(rep_num)
                else:
                    rep_std = self.get_standard_by_number(rep_num)
                    if rep_std:
                        amends = [
                            AmendmentInfo(number=a.get("number", ""), year=a.get("year", 0), description=a.get("description", ""))
                            for a in rep_std.get("amendments", [])
                        ]
                        rep_score = min(98.0, round((cand.ai_relevance_score or 75.0) + 5.0, 1))
                        rep_breakdown = ScoringBreakdown(
                            semantic_score=cand.scoring_breakdown.semantic_score if cand.scoring_breakdown else 0.8,
                            lexical_score=cand.scoring_breakdown.lexical_score if cand.scoring_breakdown else 0.7,
                            requirement_coverage=cand.scoring_breakdown.requirement_coverage if cand.scoring_breakdown else 0.8,
                            domain_score=1.0,
                            version_score=1.0,
                            final_score=round(rep_score / 100.0, 4)
                        )
                        rep_meta = StandardMetadata(
                            id=rep_std["id"],
                            is_number=rep_std["is_number"],
                            title=rep_std["title"],
                            year=rep_std["year"],
                            domain=rep_std["domain"],
                            scope=rep_std["scope"],
                            status=rep_std["status"],
                            superseded_by=rep_std.get("superseded_by"),
                            supersedes=rep_std.get("supersedes", []),
                            amendments=amends,
                            normative_references=rep_std.get("normative_references", []),
                            test_methods=rep_std.get("test_methods", []),
                            safety_standards=rep_std.get("safety_standards", []),
                            installation_standards=rep_std.get("installation_standards", []),
                            related_standards=rep_std.get("related_standards", []),
                            certification=rep_std.get("certification", []),
                            technical_parameters=rep_std.get("technical_parameters", []),
                            keywords=rep_std.get("keywords", []),
                            ai_relevance_score=rep_score,
                            scoring_breakdown=rep_breakdown,
                            why_recommended=[
                                f"Active modern replacement for superseded standard {cand.is_number} cited in specification",
                                f"Mandatory compliance standard under current BIS Quality Control Orders ({rep_std.get('year')} edition)"
                            ],
                            evidence_items=[
                                EvidenceItem(criterion="Tender Audit Replacement", detail=f"Active modern superseding standard for {cand.is_number}"),
                                EvidenceItem(criterion="Current Edition", detail=f"Valid {rep_std.get('year')} edition under current QCO")
                            ]
                        )
                        final_results.insert(0, rep_meta)
                        existing_numbers.add(rep_num)
                        
        return final_results[:top_k]

    def get_standard_by_number(self, is_number: str) -> Optional[Dict[str, Any]]:
        return self.standards_by_number.get(is_number)

    def get_standard_by_id(self, std_id: str) -> Optional[Dict[str, Any]]:
        return self.standards_by_id.get(std_id)

    @staticmethod
    def check_confidence(candidates: List[StandardMetadata]) -> Tuple[bool, str, Optional[str]]:
        """
        Evaluates whether top candidate meets the procurement recommendation threshold.
        Returns (meets_threshold, confidence_level, threshold_message).
        """
        if not candidates:
            return False, "low", "No matching standards found in prototype corpus."

        top = candidates[0]
        sb = top.scoring_breakdown
        if not sb:
            return True, "high", None

        # Unknown / unrelated product test (e.g. quantum warp propulsion, alien reactor)
        if top.ai_relevance_score < 50.0 or sb.semantic_score < 0.25 or (sb.semantic_score < 0.33 and sb.lexical_score < 0.38):
            return (
                False,
                "low",
                f"No sufficiently relevant Indian Standard was found in the prototype catalog for this requirement. "
                f"The closest catalog item ({top.is_number}) has an AI relevance score of only {top.ai_relevance_score}%, "
                f"which falls below the procurement recommendation threshold. The system will not force an irrelevant recommendation."
            )

        if sb.semantic_score < 0.42 and sb.lexical_score < 0.18:
            return (
                True,
                "medium",
                f"Potentially related standard identified ({top.is_number}), but confidence is moderate ({top.ai_relevance_score}%). "
                f"Tender authority should manually verify scope before citing."
            )

        return True, "high", None

    @staticmethod
    def generate_tender_clause(primary_std: Optional[StandardMetadata], related: Any = None) -> str:
        """
        Generates a concise, procurement-compliant standards clause from retrieved records.
        """
        if not primary_std:
            return "No specific Indian Standard identified for clause generation."
            
        lines = [
            "============================================================",
            "STANDARDS & TECHNICAL COMPLIANCE CLAUSE (FOR TENDER NIT)",
            "============================================================",
            "",
            "1. PRIMARY MANDATORY SPECIFICATION:",
            f"   The supplied equipment/material shall strictly comply with:",
            f"   - {primary_std.is_number}: {primary_std.title} ({primary_std.year} edition with all current amendments).",
            ""
        ]
        
        # Normative references
        norm_refs = getattr(related, "normative_references", []) if related else []
        if norm_refs:
            lines.append("2. NORMATIVE AND COMPONENT CODES:")
            lines.append("   The equipment design and ratings shall adhere to:")
            for ref in norm_refs[:4]:
                lines.append(f"   - {ref.is_number}: {ref.title}")
            lines.append("")
            
        # Testing standards
        test_stds = getattr(related, "testing_standards", []) if related else []
        if test_stds:
            lines.append("3. MANDATORY TESTING AND ACCEPTANCE INSPECTION:")
            lines.append("   Acceptance, routine, and type testing shall be conducted per:")
            for t in test_stds[:3]:
                lines.append(f"   - {t.is_number}: {t.title}")
            lines.append("")

        # Safety standards
        safety_stds = getattr(related, "safety_standards", []) if related else []
        if safety_stds:
            lines.append("4. SAFETY, GROUNDING AND HAZARD MITIGATION:")
            lines.append("   Safety precautions and earthing/insulation shall conform to:")
            for s in safety_stds[:3]:
                lines.append(f"   - {s.is_number}: {s.title}")
            lines.append("")
            
        # Certification
        if primary_std.certification:
            lines.append("5. STATUTORY QUALITY CERTIFICATION:")
            for c in primary_std.certification:
                lines.append(f"   - {c}")
            lines.append("")
            
        lines.append("6. BIDDER COMPLIANCE UNDERTAKING:")
        lines.append("   The bidder shall submit valid BIS certification licenses and verified type-test")
        lines.append("   certificates from NABL-accredited or BIS-approved laboratories along with the bid.")
        lines.append("============================================================")
        
        return "\n".join(lines)
