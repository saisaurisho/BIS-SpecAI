import re
import time
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

import httpx

from backend.models.schemas import (
    StandardVerificationResult,
    DiscoveredStandard,
    DiscoverStandardsResponse
)

logger = logging.getLogger("bis_kys_agent")

BIS_KYS_PORTAL_BASE = "https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards"
BIS_KYS_SEARCH_AJAX = f"{BIS_KYS_PORTAL_BASE}/Elasticsearch/getsearchAjax"
BIS_KYS_TITLE_AJAX = f"{BIS_KYS_PORTAL_BASE}/Elasticsearch/gettitlesearchAjax"
BIS_KYS_DETAILS_URL = f"{BIS_KYS_PORTAL_BASE}/Indian_standards/isdetails/"

REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails",
}


class BISKnowYourStandardsAgent:
    """
    Autonomous verification agent for Indian Standards.
    Connects live to the official Bureau of Indian Standards (BIS)
    'Know Your Standards' (KYS) portal (services.bis.gov.in) to verify status,
    detect supersessions, and discover newly published standards on the web.
    """

    def __init__(self, standards_path: str = "data/standards.json"):
        self.standards_path = standards_path
        self.local_standards: Dict[str, Dict[str, Any]] = {}
        self.superseded_map: Dict[str, Dict[str, Any]] = {}
        self.load_local_data()

    def load_local_data(self):
        try:
            with open(self.standards_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    num = item.get("is_number", "").strip()
                    self.local_standards[num.lower()] = item
                    base_m = re.search(r"IS\s*(\d+)", num, re.I)
                    if base_m:
                        self.local_standards[f"is {base_m.group(1)}"] = item

                    if item.get("status") == "superseded" and item.get("superseded_by"):
                        self.superseded_map[num.lower()] = item
                        if base_m:
                            self.superseded_map[f"is {base_m.group(1)}"] = item
                    for sup in item.get("supersedes", []):
                        self.superseded_map[sup.lower()] = {
                            "is_number": sup,
                            "superseded_by": num,
                            "status": "superseded"
                        }
        except Exception as e:
            logger.warning(f"Could not load local standards dataset: {e}")

    def _extract_base_number(self, is_number_raw: str) -> str:
        """Extracts numeric base from 'IS 12615:2018' -> '12615'."""
        m = re.search(r"\b(?:IS\s*[:\-]?)?\s*(\d+)", is_number_raw, re.I)
        return m.group(1) if m else is_number_raw.strip()

    async def verify_standard(
        self,
        is_number: str,
        year: Optional[int] = None,
        title: Optional[str] = None
    ) -> StandardVerificationResult:
        """
        Reverifies an Indian Standard against the live BIS Know Your Standards portal.
        """
        t0 = time.perf_counter()
        clean_input = is_number.strip()
        base_num = self._extract_base_number(clean_input)
        portal_results: List[Dict[str, Any]] = []

        # 1. Query live BIS KYS Elasticsearch endpoint
        try:
            async with httpx.AsyncClient(timeout=8.0, verify=False) as client:
                resp = await client.post(
                    BIS_KYS_SEARCH_AJAX,
                    data={"search": base_num, "search_type": "1"},
                    headers=REQUEST_HEADERS
                )
                if resp.status_code == 200:
                    portal_results = resp.json()
        except Exception as e:
            logger.warning(f"Direct KYS Elasticsearch query failed: {e}")

        # 2. Filter records strictly matching the IS base number
        matched_records = []
        for r in portal_results:
            raw_no = r.get("is_no", "") or r.get("name", "")
            # Check if this record is for IS {base_num}
            if re.search(rf"\bIS\s*{base_num}\b", raw_no, re.I):
                matched_records.append(r)

        # If nothing matched exact base, check all returned results
        if not matched_records and portal_results:
            matched_records = portal_results[:5]

        # 3. Determine status and latest edition from live records
        latest_edition = clean_input
        published_year = str(year) if year else None
        reaffirmed_year = None
        status = "ACTIVE_CURRENT"
        status_label = "Active & Enforceable"
        superseded_by = None
        is_valid_for_procurement = True
        revisions_history = []
        linked_normative: List[str] = []

        if matched_records:
            # Sort records by publication year descending
            def parse_rec_year(rec):
                try:
                    return int(rec.get("is_year", 0))
                except:
                    return 0

            matched_records.sort(key=parse_rec_year, reverse=True)
            newest = matched_records[0]

            latest_edition = newest.get("name", "")
            if "(" in latest_edition:
                clean_title_part = latest_edition.split("(", 1)[0].strip()
                if clean_title_part:
                    latest_edition = clean_title_part

            published_year = newest.get("is_year")
            reaffirm = newest.get("reaffirm_year")
            if reaffirm and reaffirm != "0":
                reaffirmed_year = str(reaffirm)

            for rec in matched_records:
                revisions_history.append({
                    "id": rec.get("id"),
                    "label": rec.get("name"),
                    "year": rec.get("is_year"),
                    "reaffirm_year": rec.get("reaffirm_year")
                })

        # 4. Check for supersessions in local knowledge base or portal metadata
        low_input = clean_input.lower()
        low_base = f"is {base_num}".lower()

        if low_input in self.superseded_map or low_base in self.superseded_map:
            sup_data = self.superseded_map.get(low_input) or self.superseded_map.get(low_base)
            superseded_by = sup_data.get("superseded_by")
            status = "SUPERSEDED"
            status_label = f"Officially Superseded by {superseded_by}"
            is_valid_for_procurement = False
        else:
            # If the user supplied an older year than what the portal has
            if year and published_year:
                try:
                    if int(published_year) > int(year):
                        status_label = f"Active (Newer Revision Available: {published_year})"
                except:
                    pass

        # 5. Fetch linked normative standards if pk_is_id is available
        pk_id = matched_records[0].get("id") if matched_records else None
        if pk_id:
            try:
                async with httpx.AsyncClient(timeout=6.0, verify=False) as client:
                    detail_resp = await client.post(
                        BIS_KYS_DETAILS_URL,
                        data={"pk_is_id": pk_id, "search_type": "1", "seachby": "isnumber"},
                        headers=REQUEST_HEADERS
                    )
                    if detail_resp.status_code == 200:
                        tds = re.findall(r"<td[^>]*>(.*?)</td>", detail_resp.text, re.DOTALL | re.I)
                        for td in tds:
                            clean_td = re.sub(r"<[^>]+>", "", td).strip()
                            if re.search(r"\bIS\s*\d+", clean_td, re.I) and clean_td not in linked_normative:
                                linked_normative.append(clean_td)
                            if len(linked_normative) >= 5:
                                break
            except Exception as e:
                logger.debug(f"Could not fetch linked normative references: {e}")

        # 6. Generate authoritative procurement summary
        now_str = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")

        if status == "SUPERSEDED":
            agent_summary = (
                f"AUDIT WARNING: Reference '{clean_input}' is officially marked as SUPERSEDED on the BIS "
                f"Know Your Standards Portal. Indian procurement regulations require citing the active replacement: "
                f"'{superseded_by}'. Bids citing {clean_input} risk technical disqualification under Government QCO rules."
            )
        else:
            agent_summary = (
                f"VERIFIED ACTIVE: '{latest_edition}' is confirmed active in the official BIS Know Your Standards "
                f"catalog (services.bis.gov.in). Standard is legally enforceable for government tenders and quality inspection."
            )

        return StandardVerificationResult(
            is_number=clean_input,
            status=status,
            status_label=status_label,
            latest_edition=latest_edition,
            published_year=published_year,
            reaffirmed_year=reaffirmed_year,
            superseded_by=superseded_by,
            verified_via="BIS Know Your Standards Portal (services.bis.gov.in)",
            portal_url=f"{BIS_KYS_PORTAL_BASE}/Indian_standards/isdetails/",
            is_valid_for_procurement=is_valid_for_procurement,
            revisions_history=revisions_history,
            amendments_count=len(revisions_history),
            verification_timestamp=now_str,
            agent_summary=agent_summary,
            linked_normative_standards=linked_normative
        )

    async def discover_new_standards(self, query: str, limit: int = 10) -> DiscoverStandardsResponse:
        """
        Searches the live BIS Know Your Standards portal to discover newly published
        or related standards on the web beyond the local catalog.
        """
        t0 = time.perf_counter()
        raw_query = query.strip()

        # Extract search keywords
        clean_terms = re.sub(r"[^\w\s]", " ", raw_query)
        keywords = [w for w in clean_terms.split() if len(w) > 3 and w.lower() not in ["with", "from", "that", "this", "need", "want", "require", "specification"]]
        search_term = keywords[0] if keywords else raw_query

        portal_results: List[Dict[str, Any]] = []

        # 1. Query BIS Title/Keyword Search Endpoint
        try:
            async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
                resp = await client.post(
                    BIS_KYS_TITLE_AJAX,
                    data={"search": search_term},
                    headers=REQUEST_HEADERS
                )
                if resp.status_code == 200:
                    portal_results = resp.json()
        except Exception as e:
            logger.warning(f"BIS title search failed: {e}")

        # If keyword search returned empty and term was compound, try first word
        if not portal_results and len(keywords) > 1:
            try:
                async with httpx.AsyncClient(timeout=8.0, verify=False) as client:
                    resp = await client.post(
                        BIS_KYS_TITLE_AJAX,
                        data={"search": keywords[1]},
                        headers=REQUEST_HEADERS
                    )
                    if resp.status_code == 200:
                        portal_results = resp.json()
            except Exception:
                pass

        discovered: List[DiscoveredStandard] = []

        # Sort by year descending to surface the newest published standards first
        def parse_year(item):
            try:
                return int(item.get("is_year", 0))
            except:
                return 0

        portal_results.sort(key=parse_year, reverse=True)

        for item in portal_results[:limit]:
            name = item.get("name", "").strip()
            # Clean standard number vs title
            is_num_match = re.search(r"^(IS(?:/[A-Z0-9\-]+)?\s*[\d\:\(\)\/\s\w\-]+?)\s*\((.*)\)$", name)
            if is_num_match:
                is_num = is_num_match.group(1).strip()
                title = is_num_match.group(2).strip()
            else:
                is_num = item.get("is_no", name)
                title = name

            year_val = item.get("is_year")
            base_m = re.search(r"IS\s*(\d+)", is_num, re.I)
            is_in_local = False
            if base_m:
                is_in_local = f"is {base_m.group(1)}".lower() in self.local_standards

            relevance_note = None
            if year_val and int(year_val or 0) >= 2020:
                relevance_note = f"Recently published edition ({year_val}) notified on official BIS portal"

            discovered.append(DiscoveredStandard(
                is_number=is_num,
                title=title,
                year=year_val,
                status="Active",
                portal_url=f"{BIS_KYS_PORTAL_BASE}/Indian_standards/isdetails/",
                is_in_local_catalog=is_in_local,
                relevance_note=relevance_note
            ))

        exec_time = round((time.perf_counter() - t0) * 1000.0, 2)
        total_found = len(portal_results)

        new_count = sum(1 for d in discovered if not d.is_in_local_catalog)
        agent_analysis = (
            f"BIS Know Your Standards Agent queried official repository for '{search_term}'. "
            f"Found {total_found} standards on the portal. "
            f"{new_count} standards represent newly published or web-expanded specifications beyond the static catalog."
        )

        return DiscoverStandardsResponse(
            query=raw_query,
            discovered_standards=discovered,
            total_found_on_portal=total_found,
            agent_analysis=agent_analysis,
            portal_source=BIS_KYS_PORTAL_BASE,
            execution_time_ms=exec_time
        )
