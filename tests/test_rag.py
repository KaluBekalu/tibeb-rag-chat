"""Tests for the RAG core (api/_rag.py). Gemini calls are never made here."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "api"))

from _rag import build_prompt, chunk, cosine_topk, load_index, site_context


def test_site_context_maps_known_hostnames():
    assert site_context("loopcam.tibeblabs.com")["name"] == "LoopCam"
    assert site_context("tibeblabs.com")["name"] == "Tibeb Labs"
    assert site_context("www.tibeblabs.com")["name"] == "Tibeb Labs"
    assert site_context("kalkidan.tibeblabs.com")["name"] == "Kalkidan's portfolio"
    assert site_context("mebrek.tibeblabs.com")["name"] == "Mebrek"


def test_site_context_unknown_hostname_returns_none():
    assert site_context("evil.com") is None
    assert site_context("") is None
    assert site_context(None) is None


def test_build_prompt_with_site_grounds_this_website_questions():
    site = site_context("loopcam.tibeblabs.com")
    prompt = build_prompt("What is this website about?", [], site=site)
    assert "LoopCam" in prompt
    # deictic references must be anchored to the current site
    assert "this website" in prompt.lower() or "this site" in prompt.lower()


def test_build_prompt_without_site_unchanged():
    prompt = build_prompt("What is LoopCam?", [])
    assert "Question: What is LoopCam?" in prompt


def test_load_index_reads_chunks_regardless_of_cwd(tmp_path, monkeypatch):
    import json

    index_file = tmp_path / "index.json"
    index_file.write_text(json.dumps(
        {"chunks": [{"text": "t", "source": "s", "embedding": [1.0, 0.0]}]}
    ))
    # cwd is unpredictable in serverless — must not affect resolution
    monkeypatch.chdir(tmp_path.parent)
    chunks = load_index(index_file)
    assert chunks == [{"text": "t", "source": "s", "embedding": [1.0, 0.0]}]


def test_load_index_defaults_to_repo_data_dir():
    # default path is <repo>/data/index.json, resolved from the module file
    from _rag import DEFAULT_INDEX_PATH

    assert DEFAULT_INDEX_PATH.name == "index.json"
    assert DEFAULT_INDEX_PATH.parent.name == "data"
    assert DEFAULT_INDEX_PATH.is_absolute()


def test_chunk_splits_on_h2_sections():
    md = (
        "# Title\n\nIntro paragraph.\n\n"
        "## Section One\n\nContent one.\n\n"
        "## Section Two\n\nContent two.\n"
    )
    chunks = chunk(md, source="projects")
    texts = [c["text"] for c in chunks]
    assert len(chunks) == 3
    assert "Intro paragraph." in texts[0]
    assert "Section One" in texts[1] and "Content one." in texts[1]
    assert "Section Two" in texts[2] and "Content two." in texts[2]


def test_chunk_tags_every_chunk_with_source():
    md = "## A\n\ntext\n\n## B\n\ntext"
    chunks = chunk(md, source="faqs")
    assert all(c["source"] == "faqs" for c in chunks)


def test_build_prompt_includes_context_question_and_guardrail():
    retrieved = [
        {"text": "LoopCam is a macOS virtual camera.", "source": "projects"},
        {"text": "Pricing is fixed, quoted upfront.", "source": "faqs"},
    ]
    prompt = build_prompt("What is LoopCam?", retrieved)
    assert "LoopCam is a macOS virtual camera." in prompt
    assert "Pricing is fixed, quoted upfront." in prompt
    assert "What is LoopCam?" in prompt
    # grounding guardrail: must instruct answering ONLY from context
    assert "only" in prompt.lower() and "context" in prompt.lower()
    # source labels included so the model can cite
    assert "[projects]" in prompt and "[faqs]" in prompt


def test_build_prompt_handles_empty_retrieval():
    prompt = build_prompt("What is the meaning of life?", [])
    assert "What is the meaning of life?" in prompt
    # must still carry the don't-make-things-up instruction
    assert "context" in prompt.lower()


def test_cosine_topk_ranks_by_similarity():
    chunks = [
        {"text": "cats", "source": "a", "embedding": [1.0, 0.0, 0.0]},
        {"text": "dogs", "source": "a", "embedding": [0.0, 1.0, 0.0]},
        {"text": "catlike", "source": "a", "embedding": [0.9, 0.1, 0.0]},
    ]
    top = cosine_topk([1.0, 0.0, 0.0], chunks, k=2)
    assert [c["text"] for c in top] == ["cats", "catlike"]


def test_cosine_topk_normalizes_unnormalized_vectors():
    # MRL-truncated Gemini embeddings are NOT unit length. A longer vector
    # pointing the wrong way must not beat a shorter vector pointing the
    # right way — raw dot products would get this wrong.
    chunks = [
        {"text": "right-way", "source": "a", "embedding": [0.1, 0.0]},
        {"text": "wrong-way-but-long", "source": "a", "embedding": [5.0, 5.0]},
    ]
    top = cosine_topk([1.0, 0.0], chunks, k=1)
    assert top[0]["text"] == "right-way"


def test_cosine_topk_k_larger_than_corpus():
    chunks = [{"text": "only", "source": "a", "embedding": [1.0, 0.0]}]
    assert len(cosine_topk([1.0, 0.0], chunks, k=4)) == 1


def test_chunk_skips_empty_sections_and_comments():
    md = "<!-- a comment -->\n\n## Real\n\nreal text\n\n## Empty\n\n<!-- only a comment -->\n"
    chunks = chunk(md, source="resume")
    assert len(chunks) == 1
    assert "real text" in chunks[0]["text"]
    assert "comment" not in chunks[0]["text"]
