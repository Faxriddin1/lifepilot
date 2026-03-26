#!/usr/bin/env python3
"""
Standalone eval script for LifePilot AI prompts.

Usage:
    python scripts/eval_prompts.py --method parse_user_intent \
        --dataset backend/apps/ai_core/eval/golden_dataset.json \
        --limit 5
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types

# ---------------------------------------------------------------------------
# Method configuration (mirrors AI_METHOD_CONFIG in constants.py but standalone)
# ---------------------------------------------------------------------------

METHOD_CONFIG = {
    "parse_user_intent": {
        "model": "gemini-2.0-flash-lite",
        "temperature": 0.1,
        "max_tokens": 512,
        "json_mode": True,
    },
    "generate_learning_plan": {
        "model": "gemini-2.0-flash",
        "temperature": 0.3,
        "max_tokens": 4096,
        "json_mode": True,
    },
    "adapt_learning_plan": {
        "model": "gemini-2.0-flash-lite",
        "temperature": 0.2,
        "max_tokens": 1024,
        "json_mode": True,
    },
    "answer_learning_question": {
        "model": "gemini-2.0-flash-lite",
        "temperature": 0.5,
        "max_tokens": 256,
        "json_mode": False,
    },
    "generate_daily_tasks": {
        "model": "gemini-2.0-flash-lite",
        "temperature": 0.2,
        "max_tokens": 512,
        "json_mode": True,
    },
    "generate_insights": {
        "model": "gemini-2.0-flash-lite",
        "temperature": 0.3,
        "max_tokens": 768,
        "json_mode": True,
    },
    "parse_receipt": {
        "model": "gemini-2.0-flash-lite",
        "temperature": 0.1,
        "max_tokens": 1024,
        "json_mode": True,
    },
}

# ---------------------------------------------------------------------------
# Prompt loader
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent


def load_system_prompt(method: str) -> str:
    """Load system prompt from backend/apps/ai_core/prompts/{method}.v1.txt"""
    prompt_path = REPO_ROOT / "backend" / "apps" / "ai_core" / "prompts" / f"{method}.v1.txt"
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
    return prompt_path.read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# Contents builder (method-specific)
# ---------------------------------------------------------------------------

def build_contents(method: str, vars_: dict) -> str:
    """Build the user-turn content string from test case vars."""
    if method == "parse_user_intent":
        user_context = vars_.get("user_context", {})
        user_message = vars_.get("user_message", "")
        return (
            f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\n"
            f"USER_MESSAGE:\n{user_message}"
        )
    if method == "generate_learning_plan":
        user_context = vars_.get("user_context", {})
        goal_text = vars_.get("goal_text", "")
        return (
            f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\n"
            f"LEARNING_GOAL_INPUT:\n{goal_text}"
        )
    if method == "adapt_learning_plan":
        user_context = vars_.get("user_context", {})
        trigger = vars_.get("trigger", "")
        plan_snapshot = vars_.get("plan_snapshot", {})
        progress_summary = vars_.get("progress_summary", {})
        return (
            f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\n"
            f"TRIGGER:\n{trigger}\n\n"
            f"PLAN_SNAPSHOT_JSON:\n{json.dumps(plan_snapshot, ensure_ascii=False)}\n\n"
            f"PROGRESS_SUMMARY_JSON:\n{json.dumps(progress_summary, ensure_ascii=False)}"
        )
    if method == "answer_learning_question":
        context = vars_.get("context", {})
        question = vars_.get("question", "")
        ctx_for_prompt = {k: v for k, v in context.items() if k != "conversation_history"}
        contents = f"LEARNING_CONTEXT_JSON:\n{json.dumps(ctx_for_prompt, ensure_ascii=False)}\n\n"
        conversation_history = context.get("conversation_history", [])
        if conversation_history:
            recent = conversation_history[-7:]
            lines = []
            for msg in recent:
                label = "Student" if msg["role"] == "user" else "Tutor"
                lines.append(f"{label}: {msg['content']}")
            contents += "CONVERSATION_HISTORY:\n" + "\n".join(lines) + "\n\n"
        contents += f"LEARNER_QUESTION:\n{question}"
        return contents
    if method == "generate_daily_tasks":
        user_context = vars_.get("user_context", {})
        available_time = vars_.get("available_time_minutes", 30)
        plan_snapshot = vars_.get("plan_snapshot", {})
        progress = vars_.get("progress", {})
        return (
            f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\n"
            f"AVAILABLE_TIME_MINUTES:\n{available_time}\n\n"
            f"PLAN_SNAPSHOT_JSON:\n{json.dumps(plan_snapshot, ensure_ascii=False)}\n\n"
            f"PROGRESS_JSON:\n{json.dumps(progress, ensure_ascii=False)}"
        )
    if method == "generate_insights":
        user_context = vars_.get("user_context", {})
        period_days = vars_.get("period_days", 7)
        aggregates = vars_.get("aggregates", {})
        return (
            f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\n"
            f"PERIOD_DAYS:\n{period_days}\n\n"
            f"AGGREGATES_JSON:\n{json.dumps(aggregates, ensure_ascii=False)}"
        )
    if method == "parse_receipt":
        user_context = vars_.get("user_context", {})
        ocr_text = vars_.get("ocr_text", "")
        return (
            f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\n"
            f"RECEIPT_OCR_TEXT:\n{ocr_text}"
        )
    raise ValueError(f"Unknown method: {method}")


# ---------------------------------------------------------------------------
# Gemini caller
# ---------------------------------------------------------------------------

def call_gemini(method: str, contents: str, system_prompt: str) -> str:
    """Call Gemini and return raw text response."""
    cfg = METHOD_CONFIG[method]
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY environment variable is not set")

    client = genai.Client(api_key=api_key)

    generate_config = types.GenerateContentConfig(
        temperature=cfg["temperature"],
        max_output_tokens=cfg["max_tokens"],
        system_instruction=system_prompt,
    )
    if cfg["json_mode"]:
        generate_config.response_mime_type = "application/json"

    response = client.models.generate_content(
        model=cfg["model"],
        contents=contents,
        config=generate_config,
    )
    return response.text or ""


# ---------------------------------------------------------------------------
# Assertion checkers
# ---------------------------------------------------------------------------

def _get_nested(obj: Any, path: str) -> Any:
    """Navigate dot-path like 'data.field' into nested dict."""
    parts = path.split(".")
    cur = obj
    for part in parts:
        if isinstance(cur, dict):
            cur = cur.get(part)
        else:
            return None
    return cur


def run_checks(checks: dict, output: Any, raw_text: str, verbose: bool) -> list[str]:
    """
    Run all checks defined in the expected block.
    Returns list of failure messages (empty list = all passed).
    """
    failures: list[str] = []

    # Helper: resolve output or output.field
    def get_field(field: str) -> Any:
        if field == "output":
            return output
        return _get_nested(output, field) if isinstance(output, dict) else None

    # intent: exact match
    if "intent" in checks:
        actual = get_field("intent")
        expected = checks["intent"]
        if actual != expected:
            failures.append(f"intent mismatch: expected '{expected}', got '{actual}'")

    # intent_any_of: one of list
    if "intent_any_of" in checks:
        actual = get_field("intent")
        allowed = checks["intent_any_of"]
        if actual not in allowed:
            failures.append(f"intent_any_of: '{actual}' not in {allowed}")

    # data: partial key match
    if "data" in checks:
        expected_data = checks["data"]
        actual_data = get_field("data") or {}
        for key, expected_val in expected_data.items():
            if key not in actual_data:
                failures.append(f"data.{key} missing from output.data")
            elif actual_data[key] != expected_val:
                failures.append(
                    f"data.{key} mismatch: expected {expected_val!r}, got {actual_data[key]!r}"
                )

    # min_confidence / max_confidence
    if "min_confidence" in checks:
        conf = get_field("confidence")
        try:
            if float(conf) < float(checks["min_confidence"]):
                failures.append(
                    f"confidence {conf} below min {checks['min_confidence']}"
                )
        except (TypeError, ValueError):
            failures.append(f"confidence not numeric: {conf!r}")

    if "max_confidence" in checks:
        conf = get_field("confidence")
        try:
            if float(conf) > float(checks["max_confidence"]):
                failures.append(
                    f"confidence {conf} above max {checks['max_confidence']}"
                )
        except (TypeError, ValueError):
            failures.append(f"confidence not numeric: {conf!r}")

    # must_have_keys_in_data
    if "must_have_keys_in_data" in checks:
        actual_data = get_field("data") or {}
        for key in checks["must_have_keys_in_data"]:
            if key not in actual_data:
                failures.append(f"must_have_keys_in_data: '{key}' missing from output.data")

    # modules_count_range: [min, max]
    if "modules_count_range" in checks:
        modules = get_field("modules") or []
        lo, hi = checks["modules_count_range"]
        count = len(modules)
        if not (lo <= count <= hi):
            failures.append(
                f"modules_count_range: got {count}, expected [{lo}, {hi}]"
            )

    # practice_ratio_min
    if "practice_ratio_min" in checks:
        modules = get_field("modules") or []
        all_tasks: list[dict] = []
        for mod in modules:
            all_tasks.extend(mod.get("tasks", []) if isinstance(mod, dict) else [])
        if not all_tasks:
            failures.append("practice_ratio_min: no tasks found in modules")
        else:
            practice_types = {"practice", "project"}
            practice_count = sum(
                1 for t in all_tasks
                if isinstance(t, dict) and t.get("type") in practice_types
            )
            ratio = practice_count / len(all_tasks)
            min_ratio = float(checks["practice_ratio_min"])
            if ratio < min_ratio:
                failures.append(
                    f"practice_ratio_min: ratio {ratio:.2f} < {min_ratio}"
                )

    # no_urls_in_resource_query
    if checks.get("no_urls_in_resource_query"):
        modules = get_field("modules") or []
        for mod in (modules if isinstance(modules, list) else []):
            for task in (mod.get("tasks", []) if isinstance(mod, dict) else []):
                rq = task.get("resource_query", "") if isinstance(task, dict) else ""
                if re.search(r"https?://|www\.", rq or ""):
                    failures.append(
                        f"no_urls_in_resource_query: URL found in resource_query: {rq!r}"
                    )
                    break

    # no_prompt_leak
    if checks.get("no_prompt_leak"):
        if "[LIFEPILOT_AI_CORE]" in raw_text:
            failures.append("no_prompt_leak: system prompt marker found in output")

    # warnings_non_empty
    if checks.get("warnings_non_empty"):
        warnings = get_field("warnings") or []
        if not warnings:
            failures.append("warnings_non_empty: output.warnings is empty or missing")

    # changes_action_any_of
    if "changes_action_any_of" in checks:
        changes = get_field("changes") or []
        allowed_actions = set(checks["changes_action_any_of"])
        for change in (changes if isinstance(changes, list) else []):
            action = change.get("action") if isinstance(change, dict) else None
            if action not in allowed_actions:
                failures.append(
                    f"changes_action_any_of: action '{action}' not in {allowed_actions}"
                )

    # not_rebuild_all: len(output.changes) < 5
    if checks.get("not_rebuild_all"):
        changes = get_field("changes") or []
        if len(changes) >= 5:
            failures.append(
                f"not_rebuild_all: {len(changes)} changes >= 5 (full rebuild)"
            )

    # must_contain_any: at least one token present in text
    if "must_contain_any" in checks:
        tokens = checks["must_contain_any"]
        if not any(tok.lower() in raw_text.lower() for tok in tokens):
            failures.append(
                f"must_contain_any: none of {tokens} found in output"
            )

    # must_not_contain_any: none of the tokens may appear
    if "must_not_contain_any" in checks:
        tokens = checks["must_not_contain_any"]
        for tok in tokens:
            if tok.lower() in raw_text.lower():
                failures.append(
                    f"must_not_contain_any: forbidden token '{tok}' found in output"
                )

    # max_sentences
    if "max_sentences" in checks:
        sentences = [s.strip() for s in re.split(r"[.!?]", raw_text) if s.strip()]
        count = len(sentences)
        max_s = int(checks["max_sentences"])
        if count > max_s:
            failures.append(
                f"max_sentences: {count} sentences > max {max_s}"
            )

    # tasks_count_range: [min, max] for len(output.tasks)
    if "tasks_count_range" in checks:
        tasks = get_field("tasks") or []
        lo, hi = checks["tasks_count_range"]
        count = len(tasks)
        if not (lo <= count <= hi):
            failures.append(
                f"tasks_count_range: got {count} tasks, expected [{lo}, {hi}]"
            )

    # insights_count_range: [min, max] for len(output.insights)
    if "insights_count_range" in checks:
        insights = get_field("insights") or []
        lo, hi = checks["insights_count_range"]
        count = len(insights)
        if not (lo <= count <= hi):
            failures.append(
                f"insights_count_range: got {count} insights, expected [{lo}, {hi}]"
            )

    # total_not_null: output.total is not None
    if checks.get("total_not_null"):
        total = get_field("total")
        if total is None:
            failures.append("total_not_null: output.total is None or missing")

    return failures


# ---------------------------------------------------------------------------
# Main evaluation loop
# ---------------------------------------------------------------------------

def evaluate(method: str, dataset_path: str, limit: int | None, verbose: bool) -> None:
    cfg = METHOD_CONFIG.get(method)
    if cfg is None:
        print(f"ERROR: Unknown method '{method}'. Valid: {list(METHOD_CONFIG)}")
        sys.exit(1)

    # Load dataset
    dataset_file = Path(dataset_path)
    if not dataset_file.exists():
        print(f"ERROR: Dataset not found: {dataset_file}")
        sys.exit(1)

    with dataset_file.open(encoding="utf-8") as f:
        all_cases: list[dict] = json.load(f)

    # Filter by method
    cases = [c for c in all_cases if c.get("method") == method]
    if not cases:
        print(f"WARNING: No test cases for method '{method}' in dataset.")
        return

    if limit is not None:
        cases = cases[:limit]

    # Load system prompt
    system_prompt = load_system_prompt(method)

    print(f"\n{'='*60}")
    print(f"Evaluating: {method}  ({len(cases)} cases)")
    print(f"Model: {cfg['model']}  | JSON mode: {cfg['json_mode']}")
    print(f"{'='*60}\n")

    passed = 0
    failed = 0

    for i, case in enumerate(cases, start=1):
        case_id = case.get("id", f"case_{i}")
        description = case.get("description", "")
        vars_ = case.get("vars", {})
        expected = case.get("expected", {})

        if verbose:
            print(f"[{i}/{len(cases)}] {case_id}: {description}")

        # Build contents
        try:
            contents = build_contents(method, vars_)
        except Exception as exc:
            print(f"  FAIL  [{case_id}] — contents build error: {exc}")
            failed += 1
            continue

        # Call Gemini
        try:
            raw_text = call_gemini(method, contents, system_prompt)
        except Exception as exc:
            print(f"  FAIL  [{case_id}] — Gemini API error: {exc}")
            failed += 1
            continue

        if verbose:
            print(f"  Raw response ({len(raw_text)} chars):")
            snippet = raw_text[:300].replace("\n", " ")
            print(f"    {snippet}{'...' if len(raw_text) > 300 else ''}")

        # Parse output
        output: Any = None
        if cfg["json_mode"]:
            try:
                output = json.loads(raw_text)
            except json.JSONDecodeError as exc:
                print(f"  FAIL  [{case_id}] — JSON parse error: {exc}")
                print(f"        Raw: {raw_text[:200]!r}")
                failed += 1
                continue

        # Run checks
        failures = run_checks(expected, output, raw_text, verbose)

        if failures:
            failed += 1
            print(f"  FAIL  [{case_id}] {description}")
            for msg in failures:
                print(f"        - {msg}")
        else:
            passed += 1
            print(f"  PASS  [{case_id}] {description}")

    total = passed + failed
    pass_rate = (passed / total * 100) if total > 0 else 0.0

    print(f"\n{'='*60}")
    print(f"Results: {passed}/{total} passed  ({pass_rate:.1f}%)")
    print(f"{'='*60}\n")

    if failed > 0:
        sys.exit(1)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate LifePilot AI prompts against golden dataset."
    )
    parser.add_argument(
        "--method",
        required=True,
        choices=list(METHOD_CONFIG.keys()),
        help="AI method to evaluate",
    )
    parser.add_argument(
        "--dataset",
        default="backend/apps/ai_core/eval/golden_dataset.json",
        help="Path to golden_dataset.json",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Max number of test cases to run",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print raw Gemini responses",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    evaluate(
        method=args.method,
        dataset_path=args.dataset,
        limit=args.limit,
        verbose=args.verbose,
    )
