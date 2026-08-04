"""Tests for the pure helpers in api/chat.py (no network)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "api"))

import pytest

from chat import (
    origin_hostname,
    EmptyAnswer,
    GEN_MODELS,
    GROQ_MODEL,
    gen_chain,
    generate_with_fallback,
    origin_allowed,
    parse_retry_seconds,
    validate_question,
)


def test_origin_hostname_extraction():
    assert origin_hostname("https://loopcam.tibeblabs.com") == "loopcam.tibeblabs.com"
    assert origin_hostname("http://localhost:3000") == "localhost"
    assert origin_hostname(None) is None
    assert origin_hostname("garbage") is None


def test_gen_chain_without_groq_key_is_gemini_only():
    assert gen_chain(groq_key=None) == GEN_MODELS
    assert gen_chain(groq_key="") == GEN_MODELS


def test_gen_chain_with_groq_key_appends_groq_as_last_resort():
    chain = gen_chain(groq_key="gsk_test")
    assert chain[:-1] == GEN_MODELS
    assert chain[-1] == GROQ_MODEL


def test_gen_models_contain_no_zero_quota_20_models():
    # 2.0 models have 0 free-tier quota now (verified in AI Studio dashboard)
    assert not any(m.startswith("gemini-2.0") for m in GEN_MODELS)


def test_generate_with_fallback_falls_through_on_empty_answer():
    def gen(model):
        if model == "a":
            raise EmptyAnswer("a returned no text")
        return f"ans-{model}"

    assert generate_with_fallback(["a", "b"], gen) == "ans-b"


class Boom(Exception):
    pass


def test_parse_retry_seconds_from_429_message():
    err = "429 RESOURCE_EXHAUSTED ... Please retry in 30.371667014s."
    assert parse_retry_seconds(str(err)) == pytest.approx(30.37, abs=0.01)


def test_parse_retry_seconds_absent_returns_none():
    assert parse_retry_seconds("500 something else broke") is None


def test_generate_with_fallback_uses_first_model_when_healthy():
    calls = []
    result = generate_with_fallback(["a", "b"], lambda m: calls.append(m) or f"ans-{m}")
    assert result == "ans-a"
    assert calls == ["a"]


def test_generate_with_fallback_falls_through_on_429():
    def gen(model):
        if model in ("a", "b"):
            raise Boom("429 RESOURCE_EXHAUSTED retry in 30s")
        return f"ans-{model}"

    assert generate_with_fallback(["a", "b", "c"], gen) == "ans-c"


def test_generate_with_fallback_raises_last_429_when_all_exhausted():
    def gen(model):
        raise Boom(f"429 RESOURCE_EXHAUSTED {model}")

    with pytest.raises(Boom):
        generate_with_fallback(["a", "b"], gen)


def test_generate_with_fallback_reraises_non_429_immediately():
    calls = []

    def gen(model):
        calls.append(model)
        raise Boom("500 internal")

    with pytest.raises(Boom):
        generate_with_fallback(["a", "b"], gen)
    assert calls == ["a"]  # no pointless fallback on non-quota errors


def test_origin_allowed_for_listed_origins():
    allowed = ["https://tibeblabs.com", "https://www.tibeblabs.com"]
    assert origin_allowed("https://tibeblabs.com", allowed)
    assert origin_allowed("https://www.tibeblabs.com", allowed)


def test_origin_allowed_rejects_unlisted_and_lookalike():
    allowed = ["https://tibeblabs.com"]
    assert not origin_allowed("https://evil.com", allowed)
    assert not origin_allowed("https://tibeblabs.com.evil.com", allowed)
    assert not origin_allowed(None, allowed)
    assert not origin_allowed("", allowed)


def test_origin_allowed_permits_any_tibeblabs_subdomain():
    assert origin_allowed("https://loopcam.tibeblabs.com", [])
    assert origin_allowed("https://ronen.tibeblabs.com", [])
    assert origin_allowed("https://tibeblabs.com", [])
    assert not origin_allowed("https://tibeblabs.com.evil.com", [])
    assert not origin_allowed("http://loopcam.tibeblabs.com", [])  # https only


def test_origin_allowed_permits_vercel_app_deployments():
    assert origin_allowed("https://rag-proj-nine.vercel.app", [])
    assert origin_allowed("https://rag-proj-git-main-x.vercel.app", [])
    # must be a real subdomain over https, not a lookalike
    assert not origin_allowed("https://evil-vercel.app", [])
    assert not origin_allowed("https://vercel.app.evil.com", [])
    assert not origin_allowed("http://x.vercel.app", [])


def test_origin_allowed_permits_localhost_any_port():
    assert origin_allowed("http://localhost:3000", ["https://tibeblabs.com"])
    assert origin_allowed("http://127.0.0.1:8000", ["https://tibeblabs.com"])


def test_validate_question_accepts_normal_question():
    ok, q = validate_question({"question": "  What is LoopCam?  "})
    assert ok and q == "What is LoopCam?"


def test_validate_question_rejects_missing_empty_or_long():
    assert not validate_question({})[0]
    assert not validate_question({"question": "   "})[0]
    assert not validate_question({"question": "x" * 501})[0]
    assert not validate_question({"question": 42})[0]
