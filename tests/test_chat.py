"""Tests for the pure helpers in api/chat.py (no network)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "api"))

from chat import origin_allowed, validate_question


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
