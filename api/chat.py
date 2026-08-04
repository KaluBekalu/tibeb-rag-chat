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
from _rag import build_prompt, cosine_topk, load_index, site_context  # noqa: E402

# Fallback chain: each Gemini model has its own free-tier bucket (~20 req/DAY
# each as of Aug 2026 — verified in AI Studio; 2.0 models now have zero free
# quota). Groq (different provider, ~1k req/day) is the last resort and the
# workhorse once Gemini's daily buckets drain.
GEN_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
]
GROQ_MODEL = "groq/llama-3.3-70b-versatile"


def gen_chain(groq_key: str | None) -> list[str]:
    return GEN_MODELS + [GROQ_MODEL] if groq_key else GEN_MODELS


class EmptyAnswer(Exception):
    """Model returned no usable text (e.g. thinking ate the token budget)."""
EMBED_MODEL = "gemini-embedding-001"
EMBED_DIMS = 768
TOP_K = 8
MAX_QUESTION_CHARS = 500
# Gemini 3.x count THINKING tokens against max_output_tokens — a 500 budget
# gets eaten by thinking and truncates answers mid-sentence. 2048 leaves room
# for thinking_level=low plus a full answer; the prompt keeps answers short.
MAX_OUTPUT_TOKENS = 2048
GROQ_MAX_TOKENS = 600  # no thinking tax on Groq

BUSY_MESSAGE = (
    "I'm getting a lot of questions right now — give it a minute and ask again. "
    "Or reach out directly: kalkidan.aleme@yahoo.com"
)
QUOTA_MESSAGE = (
    "I've hit my daily free-tier limit — please try again tomorrow, "
    "or reach out directly: kalkidan.aleme@yahoo.com"
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
    if re.fullmatch(r"https://([a-z0-9-]+\.)*tibeblabs\.com", origin):
        return True  # tibeblabs.com and any subdomain (loopcam, ronen, portfolio…)
    if re.fullmatch(r"https://[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app", origin):
        return True  # our own deployment/preview URLs (demo page)
    return origin in allowed


def _is_quota_error(e: Exception) -> bool:
    s = str(e)
    return "RESOURCE_EXHAUSTED" in s or "429" in s


def parse_retry_seconds(error_text: str) -> float | None:
    """Pull the server-suggested retry delay out of a 429 message, if any."""
    m = re.search(r"retry in ([\d.]+)s", error_text, re.IGNORECASE)
    return float(m.group(1)) if m else None


def generate_with_fallback(models: list[str], generate):
    """Call generate(model) down the chain.

    Quota errors and empty answers fall through to the next model; anything
    else re-raises immediately.
    """
    last = None
    for model in models:
        try:
            return generate(model)
        except Exception as e:
            if not (_is_quota_error(e) or isinstance(e, EmptyAnswer)):
                raise
            last = e
    raise last


def origin_hostname(origin: str | None) -> str | None:
    """Hostname of an Origin header value, or None if absent/malformed."""
    if not origin:
        return None
    m = re.match(r"https?://([^/:]+)", origin)
    return m.group(1) if m else None


def validate_question(body: dict) -> tuple[bool, str]:
    """Return (ok, question-or-error)."""
    q = body.get("question")
    if not isinstance(q, str) or not q.strip():
        return False, "question is required"
    q = q.strip()
    if len(q) > MAX_QUESTION_CHARS:
        return False, f"question too long (max {MAX_QUESTION_CHARS} chars)"
    return True, q


def _answer(question: str, site: dict | None = None) -> dict:
    """Embed -> retrieve -> generate. Imports/creates clients lazily."""
    global _INDEX, _CLIENT
    from google import genai
    from google.genai import types

    if _CLIENT is None:
        _CLIENT = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    if _INDEX is None:
        _INDEX = load_index()

    # Bias retrieval toward the embedding site: "what is this website?" asked
    # on loopcam.tibeblabs.com should pull LoopCam chunks.
    query = f"{question} (asked on the {site['name']} site)" if site else question
    query_emb = _CLIENT.models.embed_content(
        model=EMBED_MODEL,
        contents=query,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY", output_dimensionality=EMBED_DIMS
        ),
    ).embeddings[0].values

    retrieved = cosine_topk(query_emb, _INDEX, k=TOP_K)
    prompt = build_prompt(question, retrieved, site=site)

    def generate(model: str) -> str:
        if model == GROQ_MODEL:
            return _groq_generate(prompt)
        if model.startswith("gemini-2.5"):
            thinking = types.ThinkingConfig(thinking_budget=0)
        else:  # gemini-3.x take a level, not a budget; 'low' is the minimum
            thinking = types.ThinkingConfig(thinking_level="low")
        response = _CLIENT.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=MAX_OUTPUT_TOKENS, thinking_config=thinking
            ),
        )
        if not (response.text or "").strip():
            raise EmptyAnswer(model)
        return response.text

    return {
        "answer": generate_with_fallback(gen_chain(os.environ.get("GROQ_API_KEY")), generate),
        "sources": sorted({c["source"] for c in retrieved}),
    }


def _groq_generate(prompt: str) -> str:
    """Last-resort generation on Groq's free tier (OpenAI-compatible REST)."""
    import urllib.error
    import urllib.request

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps({
            "model": GROQ_MODEL.removeprefix("groq/"),
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": GROQ_MAX_TOKENS,
        }).encode(),
        headers={
            "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            text = json.load(res)["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"groq {e.code}: 429 quota" if e.code == 429 else f"groq {e.code}")
    if not (text or "").strip():
        raise EmptyAnswer(GROQ_MODEL)
    return text


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
            site = site_context(origin_hostname(origin))
            return self._send(200, _answer(result, site=site), origin)
        except Exception as e:  # keep the widget graceful, log for Vercel
            print(f"chat error: {type(e).__name__}: {e}")
            if _is_quota_error(e):
                # short retry delay ⇒ per-minute throttle, not daily exhaustion
                retry = parse_retry_seconds(str(e))
                msg = BUSY_MESSAGE if retry is not None and retry < 120 else QUOTA_MESSAGE
                return self._send(200, {"answer": msg, "sources": []}, origin)
            return self._send(500, {"error": "something went wrong"}, origin)
