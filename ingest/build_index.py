"""Build the retrieval index: content/*.md -> chunk -> embed -> data/index.json.

Run locally whenever content changes (the only step needed to refresh the
bot's knowledge), then commit the updated index:

    GEMINI_API_KEY=... python ingest/build_index.py
"""

import json
import os
import sys
from pathlib import Path

REPO = Path(__file__).parent.parent
sys.path.insert(0, str(REPO / "api"))

from _rag import chunk  # noqa: E402

EMBED_MODEL = "gemini-embedding-001"
# MRL truncation: 768 dims keeps index.json small; vectors are re-normalized
# at query time (see _rag.cosine_topk) because truncated outputs aren't unit
# length.
EMBED_DIMS = 768


def main() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit("GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey")

    from google import genai
    from google.genai import types

    chunks = []
    for md_file in sorted((REPO / "content").glob("*.md")):
        chunks += chunk(md_file.read_text(), source=md_file.stem)
    if not chunks:
        sys.exit("No content found in content/*.md")

    client = genai.Client(api_key=api_key)
    response = client.models.embed_content(
        model=EMBED_MODEL,
        contents=[c["text"] for c in chunks],
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=EMBED_DIMS,
        ),
    )
    for c, emb in zip(chunks, response.embeddings):
        c["embedding"] = emb.values

    out = REPO / "data" / "index.json"
    out.write_text(json.dumps({"model": EMBED_MODEL, "dims": EMBED_DIMS, "chunks": chunks}))
    sizes = {}
    for c in chunks:
        sizes[c["source"]] = sizes.get(c["source"], 0) + 1
    print(f"Wrote {out} — {len(chunks)} chunks {sizes}, {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
