"""Pre-generate answers for the suggestion pills -> data/canned.json.

Run after content changes (alongside build_index.py). Keeps the most common
questions token-free at query time:

    GEMINI_API_KEY=... python ingest/build_canned.py
"""

import json
import sys
from pathlib import Path

REPO = Path(__file__).parent.parent
sys.path.insert(0, str(REPO / "api"))

# Keep in sync with SUGGESTIONS in widget/src/page.ts
QUESTIONS = [
    "What's Kalkidan's experience with AI and LLMs?",
    "What products has he built and monetized?",
    "Tell me about his enterprise work at Kimberly-Clark",
    "What's his frontend & design-system experience?",
    "Has he built native macOS apps?",
    "Is he open to new opportunities?",
]


def main() -> None:
    from chat import _answer

    canned = {}
    for q in QUESTIONS:
        result = _answer(q)
        canned[q] = result
        print(f"✓ {q}  ({len(result['answer'])} chars, {result['sources']})")

    out = REPO / "data" / "canned.json"
    out.write_text(json.dumps(canned, indent=1))
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
