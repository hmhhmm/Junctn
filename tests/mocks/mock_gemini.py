"""
Reusable mock objects for the Google Gemini API.

These replicate the exact attribute shapes used in the production code:
  - response.text
  - response.usage_metadata.prompt_token_count
  - streaming: iterable chunks with .text, then .usage_metadata on the aggregate
"""
from __future__ import annotations


class _MockUsageMetadata:
    def __init__(self, prompt_token_count: int) -> None:
        self.prompt_token_count = prompt_token_count


class MockGeminiResponse:
    """Mimics the non-streaming GenerateContentResponse."""

    def __init__(self, text: str, prompt_token_count: int = 100) -> None:
        self.text = text
        self.usage_metadata = _MockUsageMetadata(prompt_token_count)


class _MockChunk:
    def __init__(self, text: str) -> None:
        self.text = text


class MockGeminiStreamResponse:
    """
    Mimics the streaming GenerateContentResponse.

    The synthesiser iterates it as `for chunk in response` (each chunk has .text)
    then reads `response.usage_metadata.prompt_token_count` after the loop.
    """

    def __init__(self, chunks: list[str], prompt_token_count: int = 150) -> None:
        self._chunks = [_MockChunk(c) for c in chunks]
        self.usage_metadata = _MockUsageMetadata(prompt_token_count)

    def __iter__(self):
        return iter(self._chunks)


# ---------------------------------------------------------------------------
# Preset responses that match realistic pipeline outputs
# ---------------------------------------------------------------------------

CLIENT_MEMORY_JSON = """{
  "cli-1": {
    "open_threads": ["Mentioned wanting to set up a trust for his two children"],
    "health": "strong",
    "talking_point": "Confirm trust deed timeline before year end"
  },
  "cli-2": {
    "open_threads": ["Asked whether to top up SRS before the meeting"],
    "health": "needs-attention",
    "talking_point": "Answer the SRS query and review retirement income plan"
  }
}"""

BRIEFING_CHUNKS = [
    "[CALENDAR]\n",
    "• 09:30 — Lawrence Goh — portfolio & trust review (In person) [Mentioned a trust 2 days ago]\n",
    "• 11:00 — Serena Koh — pre-retirement check-in (Video) [Unread WhatsApp]\n",
    "[FOLLOWUPS]\n",
    "• Serena Koh — asked about SRS top-up, 14 days since contact. Urgency: medium.\n",
    "[LD]\n",
    "Complete Module 14 (Trust Structures) — 3 clients discussed trust-related needs this week.",
]

DRAFT_FOLLOWUP_TEXT = (
    "Hi Serena, I hope you're doing well! Following up on your question "
    "about SRS contributions before our meeting today. Based on your current "
    "retirement timeline, topping up your SRS account makes sense given the tax "
    "relief benefits. I'll walk you through the exact numbers at 11 AM. See you then!"
)


def make_client_memory_mock():
    return MockGeminiResponse(text=CLIENT_MEMORY_JSON, prompt_token_count=180)


def make_synthesiser_mock():
    return MockGeminiStreamResponse(chunks=BRIEFING_CHUNKS, prompt_token_count=220)


def make_draft_followup_mock():
    return MockGeminiResponse(text=DRAFT_FOLLOWUP_TEXT, prompt_token_count=95)
