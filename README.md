# Tibeb Chat - a $0 RAG chatbot you can drop on any site

A retrieval-augmented chatbot for [tibeblabs.com](https://tibeblabs.com) that recruiters and visitors can ask about Tibeb Labs' products, services, pricing — and about my skills, experience, and career. Ships as a **one-line embeddable widget** plus a standalone demo page, and runs entirely on free tiers: **$0/month**.

**Live demo:** https://rag-proj-nine.vercel.app · **Embed it:**

```html
<script src="https://rag-proj-nine.vercel.app/widget.js" data-api="https://rag-proj-nine.vercel.app/api/chat" defer></script>
```

## Architecture

```
offline (runs on my laptop, only when content changes)
┌─────────────┐   chunk    ┌──────────────────────┐   embed    ┌──────────────────┐
│ content/*.md ├──────────►│ ingest/build_index.py ├───────────►│ data/index.json  │
└─────────────┘  by ## hdr └──────────────────────┘  Gemini    │ (committed, ~KBs)│
                                                    embedding   └──────────────────┘

runtime (Vercel free tier)
┌────────────┐  POST /api/chat  ┌─────────────┐  embed query   ┌─────────────────┐
│ widget.js  ├─────────────────►│ api/chat.py ├───────────────►│ gemini-embedding │
│ (any site) │◄─────────────────┤             │                └─────────────────┘
└────────────┘  answer+sources  │  in-memory  │  top-8 chunks  ┌─────────────────┐
                                │  cosine     ├───────────────►│ 2.5-flash-lite  │
                                │  top-k      │  grounded ask  │  ↓429 fallback  │
                                └─────────────┘                │ 2.5 / 2.0 flash │
                                                               └─────────────────┘
```

## Why no vector database? (a deliberate decision)

The corpus is three markdown files — a few dozen chunks. At that scale a hosted vector DB adds latency, an external dependency, a signup, and (eventually) a bill, while providing nothing that `numpy` cosine similarity over a committed JSON file doesn't already do in microseconds. Embeddings are computed **once, offline**, and committed to the repo; the serverless function loads them into memory on cold start and does exact top-k per query.

Right-sizing infrastructure is the engineering skill this project demonstrates on purpose. If the corpus grew to ~10k+ chunks, the swap-in path is clear: pgvector on a free Postgres tier, or any hosted vector store — only `load_index`/`cosine_topk` would change.

## Engineering notes

- **MRL truncation + re-normalization.** `gemini-embedding-001` natively outputs 3072 dims; I request 768 via Matryoshka truncation to keep the index small. Truncated vectors are *not* unit-length, so `cosine_topk` re-normalizes before ranking — skipping that silently corrupts results (there's a test that proves it).
- **Grounding guardrail.** The prompt restricts answers to retrieved context, instructs refusal + a contact suggestion when the context lacks the answer, and tells the model to ignore instructions embedded in questions.
- **Free-tier protection.** The endpoint enforces a server-side origin allow-list (CORS headers alone don't stop scripts), caps question length, and degrades gracefully with honest messaging when Gemini quotas are hit.
- **Model fallback chain.** Each Gemini model has its own free-tier quota bucket (~20 req/min each). On a 429, generation falls through `2.5-flash-lite → 2.5-flash → 2.0-flash`, so traffic bursts get absorbed instead of erroring — quota diversity as free redundancy.
- **Shadow DOM widget.** The chat UI renders in a shadow root, so host-page CSS can't break it and its styles can't leak out. Configurable via `data-` attributes (`data-api`, `data-accent`, `data-title`, `data-greeting`). ~6 KB minified, plus a full-page ChatGPT-style app at the deployment root.
- **TDD.** The Python core (chunking, retrieval, prompt building, request validation) was built test-first; Gemini calls sit behind thin wrappers so the suite runs with zero network access.

## Run it locally

```bash
# 1. deps
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt pytest
npm install

# 2. tests
.venv/bin/pytest tests/

# 3. build the index (needs a free key from https://aistudio.google.com/apikey)
GEMINI_API_KEY=... .venv/bin/python ingest/build_index.py

# 4. run the whole thing
npm run build
vercel dev   # then open http://localhost:3000
```

## Updating the bot's knowledge

Edit `content/*.md`, re-run `ingest/build_index.py`, commit, push. That's the whole pipeline.

## Stack

Python (numpy, google-genai) · TypeScript (esbuild) · Gemini free tier (`gemini-embedding-001`, `gemini-2.5-flash-lite`) · Vercel Hobby (static + Python serverless) · pytest

## What I learned building this

- RAG end-to-end: chunking strategy, embedding task types (`RETRIEVAL_DOCUMENT` vs `RETRIEVAL_QUERY`), top-k retrieval, grounded generation, and citation surfacing.
- Matryoshka embeddings and why normalization matters for cosine similarity.
- That the "boring" architecture question — *do you even need a vector DB?* — matters more than the fancy one.
- Serverless constraints (10s limit, cold starts, bundling data files) and designing within a free-tier budget: quota math, abuse protection, graceful degradation.
