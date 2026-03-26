#!/usr/bin/env python3
"""
CI quality gate: reads Promptfoo output JSON and checks pass rate.

Usage:
    python scripts/check_eval_results.py results.json --min-pass-rate 0.90
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def load_results(path: str) -> dict:
    file = Path(path)
    if not file.exists():
        print(f"ERROR: Results file not found: {path}")
        sys.exit(2)
    with file.open(encoding="utf-8") as f:
        return json.load(f)


def compute_pass_rate(data: dict) -> tuple[int, int, float]:
    """
    Returns (passed, total, pass_rate).

    Strategy:
    1. Try results.results.stats.successes / failures (Promptfoo summary block).
    2. Fall back to iterating results.results[], counting .gradingResult.pass.
    """
    results_block = data.get("results", {})

    # Strategy 1: stats block
    stats = results_block.get("stats") if isinstance(results_block, dict) else None
    if stats and ("successes" in stats or "failures" in stats):
        successes = int(stats.get("successes", 0))
        failures = int(stats.get("failures", 0))
        total = successes + failures
        pass_rate = (successes / total) if total > 0 else 0.0
        return successes, total, pass_rate

    # Strategy 2: iterate individual results
    rows = []
    if isinstance(results_block, dict):
        rows = results_block.get("results", [])
    elif isinstance(results_block, list):
        rows = results_block

    if not rows:
        # Some Promptfoo versions put results at the top level
        rows = data.get("results", []) if isinstance(data.get("results"), list) else []

    passed = 0
    total = 0
    for row in rows:
        grading = row.get("gradingResult") if isinstance(row, dict) else None
        if grading is not None:
            total += 1
            if grading.get("pass") is True:
                passed += 1

    pass_rate = (passed / total) if total > 0 else 0.0
    return passed, total, pass_rate


def main() -> None:
    parser = argparse.ArgumentParser(
        description="CI quality gate: check Promptfoo eval pass rate."
    )
    parser.add_argument("results_file", help="Path to Promptfoo output JSON")
    parser.add_argument(
        "--min-pass-rate",
        type=float,
        default=0.90,
        help="Minimum required pass rate (0.0–1.0). Default: 0.90",
    )
    args = parser.parse_args()

    data = load_results(args.results_file)
    passed, total, pass_rate = compute_pass_rate(data)

    print(f"\nEval Results: {args.results_file}")
    print(f"  Passed : {passed}")
    print(f"  Total  : {total}")
    print(f"  Rate   : {pass_rate:.1%}")
    print(f"  Min req: {args.min_pass_rate:.1%}")

    if total == 0:
        print("\nWARNING: No graded results found in the file.")
        sys.exit(2)

    if pass_rate >= args.min_pass_rate:
        print(f"\nQUALITY GATE: PASSED ({pass_rate:.1%} >= {args.min_pass_rate:.1%})")
        sys.exit(0)
    else:
        print(
            f"\nQUALITY GATE: FAILED ({pass_rate:.1%} < {args.min_pass_rate:.1%})"
        )
        sys.exit(2)


if __name__ == "__main__":
    main()
