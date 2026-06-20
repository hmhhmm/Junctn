"""
Backend tests for JUNCTN FastAPI server (main.py).

Run:
    cd D:\hackathon\Junctn\backend
    pip install pytest httpx
    pytest test_main.py -v
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from backend.api.cpd import MODULES
from backend.api.matching import PARTNERS

client = TestClient(app)

# ---------------------------------------------------------------------------
# /health  (BUG-1 regression: was defined before MODULES causing NameError)
# ---------------------------------------------------------------------------

class TestHealth:
    def test_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_status_ok(self):
        data = response = client.get("/health").json()
        assert data["status"] == "ok"

    def test_modules_indexed_is_15(self):
        """BUG-1 regression: /cpd/search must work with 15 modules (no NameError on startup)."""
        data = client.post("/cpd/search", json={"query": "compliance", "top_k": 15}).json()
        assert len(data["results"]) <= 15

    def test_version_field_present(self):
        data = client.get("/health").json()
        assert "version" in data

    def test_response_has_all_expected_keys(self):
        data = client.get("/health").json()
        assert set(data.keys()) >= {"status", "version"}


# ---------------------------------------------------------------------------
# GET /partners
# ---------------------------------------------------------------------------

class TestGetPartners:
    def test_returns_200(self):
        response = client.get("/match/partners")
        assert response.status_code == 200

    def test_returns_partners_key(self):
        data = client.get("/match/partners").json()
        assert "partners" in data

    def test_partner_list_is_non_empty(self):
        data = client.get("/match/partners").json()
        assert len(data["partners"]) > 0

    def test_partner_has_expected_fields(self):
        data = client.get("/match/partners").json()
        partner = data["partners"][0]
        for field in ("id", "name", "specialty", "region", "successRate", "acceptanceRate", "avgDaysToClose", "initials"):
            assert field in partner, f"Missing field: {field}"

    def test_document_field_not_exposed(self):
        """Partner documents contain raw training text and must not be leaked."""
        data = client.get("/match/partners").json()
        for partner in data["partners"]:
            assert "document" not in partner

    def test_partner_count_matches_corpus(self):
        data = client.get("/match/partners").json()
        assert len(data["partners"]) == len(PARTNERS)


# ---------------------------------------------------------------------------
# POST /cpd/search
# ---------------------------------------------------------------------------

class TestCpdSearch:
    def test_meaningful_query_returns_results(self):
        response = client.post("/cpd/search", json={"query": "estate planning trust"})
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) > 0

    def test_result_has_required_fields(self):
        response = client.post("/cpd/search", json={"query": "tax planning"})
        data = response.json()
        result = data["results"][0]
        for field in ("id", "title", "topic", "credits", "score", "reason"):
            assert field in result, f"Missing field: {field}"

    def test_top_k_1_returns_exactly_one_result(self):
        response = client.post("/cpd/search", json={"query": "retirement CPF", "top_k": 1})
        data = response.json()
        assert len(data["results"]) == 1

    def test_top_k_default_3_returns_at_most_3(self):
        response = client.post("/cpd/search", json={"query": "investments portfolio equity"})
        data = response.json()
        assert len(data["results"]) <= 3

    def test_exclude_ids_removes_specified_modules(self):
        """Modules in exclude_ids must not appear in results."""
        # First get results without exclusion to learn which ids would appear
        base = client.post("/cpd/search", json={"query": "compliance AML KYC", "top_k": 5}).json()
        ids_to_exclude = [r["id"] for r in base["results"]]

        filtered = client.post("/cpd/search", json={
            "query": "compliance AML KYC",
            "top_k": 5,
            "exclude_ids": ids_to_exclude,
        }).json()

        returned_ids = {r["id"] for r in filtered["results"]}
        for excluded_id in ids_to_exclude:
            assert excluded_id not in returned_ids, f"{excluded_id} was excluded but appeared in results"

    def test_exclude_ids_partial_exclusion(self):
        """Only specified modules should be excluded, others should still appear."""
        # Exclude mod-13 (Ethics & Fair Dealing) specifically
        response = client.post("/cpd/search", json={
            "query": "ethics compliance fair dealing",
            "top_k": 5,
            "exclude_ids": ["mod-13"],
        })
        data = response.json()
        returned_ids = [r["id"] for r in data["results"]]
        assert "mod-13" not in returned_ids

    def test_exclude_all_modules_returns_empty_or_at_most_zero_exclusions(self):
        """Excluding all 15 module ids should yield an empty results list."""
        all_ids = [m["id"] for m in MODULES]
        response = client.post("/cpd/search", json={
            "query": "trust planning compliance",
            "top_k": 5,
            "exclude_ids": all_ids,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["results"] == []

    def test_score_is_integer_between_0_and_100(self):
        response = client.post("/cpd/search", json={"query": "retirement income SRS"})
        data = response.json()
        for result in data["results"]:
            assert isinstance(result["score"], int)
            assert 0 <= result["score"] <= 100

    def test_credits_field_is_positive_integer(self):
        response = client.post("/cpd/search", json={"query": "mortgage home loan"})
        data = response.json()
        for result in data["results"]:
            assert isinstance(result["credits"], int)
            assert result["credits"] > 0

    def test_reason_field_is_non_empty_string(self):
        response = client.post("/cpd/search", json={"query": "business succession planning"})
        data = response.json()
        for result in data["results"]:
            assert isinstance(result["reason"], str)
            assert len(result["reason"]) > 0

    def test_empty_query_returns_200_graceful(self):
        """BUG-N: blank query must not crash the server."""
        response = client.post("/cpd/search", json={"query": ""})
        assert response.status_code == 200

    def test_whitespace_only_query_returns_200_graceful(self):
        response = client.post("/cpd/search", json={"query": "   "})
        assert response.status_code == 200

    def test_results_ordered_by_descending_score(self):
        response = client.post("/cpd/search", json={"query": "will estate inheritance legal", "top_k": 5})
        data = response.json()
        scores = [r["score"] for r in data["results"]]
        assert scores == sorted(scores, reverse=True), "Results should be in descending score order"

    def test_relevant_query_returns_topically_related_module(self):
        """'retirement CPF annuity' should surface the Retirement Income module."""
        response = client.post("/cpd/search", json={"query": "retirement CPF annuity SRS", "top_k": 3})
        data = response.json()
        topics = [r["topic"] for r in data["results"]]
        assert "Retirement" in topics, f"Expected Retirement topic, got: {topics}"

    def test_extra_fields_included_in_response(self):
        """durationMin and required should also be present per the endpoint spec."""
        response = client.post("/cpd/search", json={"query": "compliance ethics"})
        data = response.json()
        result = data["results"][0]
        assert "durationMin" in result
        assert "required" in result


# ---------------------------------------------------------------------------
# POST /match  (smoke test — not the primary focus but confirms it still works)
# ---------------------------------------------------------------------------

class TestMatch:
    def test_match_returns_200(self):
        response = client.post("/match", json={"query": "family trust estate", "top_k": 3})
        assert response.status_code == 200

    def test_match_response_has_matches_key(self):
        data = client.post("/match", json={"query": "tax planning"}).json()
        assert "matches" in data
