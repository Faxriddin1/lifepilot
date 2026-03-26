"""
Prompt file loader with LRU cache.
"""

import functools
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"


@functools.lru_cache(maxsize=32)
def load_prompt(filename: str) -> str:
    """Load a prompt file from the prompts/ directory. Cached via LRU."""
    path = PROMPTS_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8")
