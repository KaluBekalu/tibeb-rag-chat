"""Vercel serverless function: POST /api/chat  { question } -> { answer, sources }.

Free-tier protections: origin allow-list (CORS headers alone don't stop
scripts), question length cap, graceful message when Gemini quota is
exhausted.
"""

import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))  # allow `_rag` import when loaded as `api.chat`
from _rag import build_prompt, cosine_topk, load_index  # noqa: E402

GEN_MODEL = "gemini-2.5-flash-lite"  # 1,000 req/day free vs 250 for full Flash
EMBED_MODEL = "gemini-embedding-001"
EMBED_DIMS = 768
TOP_K = 8
MAX_QUESTION_CHARS = 500
MAX_OUTPUT_TOKENS = 500  # keep well inside Vercel Hobby's 10s limit

QUOTA_MESSAGE = (
    "I've hit my daily free-tier limit — please try again tomorrow, "
    "or reach out directly via tibeblabs.com."
)

DEFAULT_ORIGINS = (
    "https://tibeblabs.com,https://www.tibeblabs.com,https://kalkidan.tibeblabs.com"
)
ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",") if o.strip()
]

_INDEX = None  # cached across warm invocations
_CLIENT = None


def origin_allowed(origin: str | None, allowed: list[str]) -> bool:
    """Exact-match against the allow-list; localhost on any port is fine."""
    if not origin:
        return False
    if re.fullmatch(r"https?://(localhost|127\.0\.0\.1)(:\d+)?", origin):
        return True
    if re.fullmatch(r"https://[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app", origin):
        return True  # our own deployment/preview URLs (demo page)
    return origin in allowed


def validate_question(body: dict) -> tuple[bool, str]:
    """Return (ok, question-or-error)."""
    q = body.get("question")
    if not isinstance(q, str) or not q.strip():
        return False, "question is required"
    q = q.strip()
    if len(q) > MAX_QUESTION_CHARS:
        return False, f"question too long (max {MAX_QUESTION_CHARS} chars)"
    return True, q


def _answer(question: str) -> dict:
    """Embed -> retrieve -> generate. Imports/creates clients lazily."""
    global _INDEX, _CLIENT
    from google import genai
    from google.genai import types

    if _CLIENT is None:
        _CLIENT = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    if _INDEX is None:
        _INDEX = load_index()

    query_emb = _CLIENT.models.embed_content(
        model=EMBED_MODEL,
        contents=question,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY", output_dimensionality=EMBED_DIMS
        ),
    ).embeddings[0].values

    retrieved = cosine_topk(query_emb, _INDEX, k=TOP_K)
    response = _CLIENT.models.generate_content(
        model=GEN_MODEL,
        contents=build_prompt(question, retrieved),
        config=types.GenerateContentConfig(
            max_output_tokens=MAX_OUTPUT_TOKENS,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        ),
    )
    return {
        "answer": response.text,
        "sources": sorted({c["source"] for c in retrieved}),
    }


class handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict, origin: str | None) -> None:
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        if origin_allowed(origin, ALLOWED_ORIGINS):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):  # CORS preflight
        origin = self.headers.get("Origin")
        self.send_response(204)
        if origin_allowed(origin, ALLOWED_ORIGINS):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Max-Age", "86400")
            self.send_header("Vary", "Origin")
        self.end_headers()

    def do_POST(self):
        origin = self.headers.get("Origin")
        if not origin_allowed(origin, ALLOWED_ORIGINS):
            return self._send(403, {"error": "origin not allowed"}, origin)
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._send(400, {"error": "invalid JSON"}, origin)

        ok, result = validate_question(body)
        if not ok:
            return self._send(400, {"error": result}, origin)

        try:
            return self._send(200, _answer(result), origin)
        except Exception as e:  # keep the widget graceful, log for Vercel
            print(f"chat error: {type(e).__name__}: {e}")
            if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
                return self._send(200, {"answer": QUOTA_MESSAGE, "sources": []}, origin)
            return self._send(500, {"error": "something went wrong"}, origin)
