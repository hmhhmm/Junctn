"""
Smoke test — REAL Gemini API call.

Rules:
  - Requires GEMINI_API_KEY env var. Skipped if missing.
  - Makes ONE minimal call to verify API connectivity.
  - MUST NOT be imported or run as part of the normal test suite.
  - Run explicitly: pytest tests/smoke/test_gemini_ping.py -v
"""
import os
import pytest

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
SKIP_REASON = "GEMINI_API_KEY not set — skipping real API smoke test"


@pytest.mark.skipif(
    not GEMINI_API_KEY or GEMINI_API_KEY.startswith("fake"),
    reason=SKIP_REASON,
)
def test_gemini_ping():
    """Send a minimal prompt to Gemini and assert a non-empty response."""
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")

    response = model.generate_content("ping")

    assert response is not None
    assert response.text is not None
    assert len(response.text.strip()) > 0


@pytest.mark.skipif(
    not GEMINI_API_KEY or GEMINI_API_KEY.startswith("fake"),
    reason=SKIP_REASON,
)
def test_gemini_streaming_ping():
    """Verify streaming mode yields at least one chunk."""
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")

    chunks = list(model.generate_content("ping", stream=True))

    assert len(chunks) > 0
    full_text = "".join(c.text for c in chunks if c.text)
    assert len(full_text.strip()) > 0


@pytest.mark.skipif(
    not GEMINI_API_KEY or GEMINI_API_KEY.startswith("fake"),
    reason=SKIP_REASON,
)
def test_gemini_usage_metadata_available():
    """Verify usage_metadata.prompt_token_count is accessible (used in production code)."""
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")

    response = model.generate_content("What is 1+1?")

    assert hasattr(response, "usage_metadata")
    assert hasattr(response.usage_metadata, "prompt_token_count")
    assert response.usage_metadata.prompt_token_count > 0
