"""
Pydantic v2 schemas for AI Core structured outputs.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# 1. ParsedIntent — intent parsing from natural language
# ============================================================

class ParsedIntent(BaseModel):
    model_config = ConfigDict(extra="ignore")

    intent: Literal[
        "task_create", "task_update", "task_delete", "task_list", "task_search",
        "task_complete", "task_set_priority", "task_set_deadline",
        "project_create", "project_list",
        "finance_income", "finance_expense", "finance_transfer",
        "finance_balance", "finance_history",
        "budget_check", "budget_create",
        "goal_check", "goal_contribute",
        "habit_check", "habit_toggle", "habit_create",
        "focus_start", "focus_stop", "focus_status",
        "daily_log_create",
        "analytics_summary", "analytics_productivity",
        "learning_start", "learning_status", "learning_question",
        "settings_update",
        "greeting", "help", "unknown",
    ] = Field(description="Detected user intent")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    data: dict = Field(default_factory=dict, description="Extracted structured data (amounts, dates, priorities, etc.)")
    confirmation_message: str = Field(default="", description="Human-readable confirmation message for the user")
    missing_fields: list[str] = Field(default_factory=list, description="Fields that need clarification from the user")
    clarification_question: str = Field(default="", description="Follow-up question if confidence < 0.7 or missing_fields")


# ============================================================
# 2. LearningPlan — curriculum generation
# ============================================================

class LearningTask(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = Field(description="Task title")
    type: Literal["read", "watch", "practice", "quiz", "project", "reflect"] = Field(description="Task type")
    description: str = Field(description="What the learner should do")
    resource_query: str = Field(default="", description="Search query to find resource (NEVER a URL)")
    estimated_minutes: int = Field(ge=5, le=240, description="Estimated time in minutes")
    difficulty: Literal["beginner", "intermediate", "advanced"] = Field(description="Task difficulty level")


class LearningModule(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = Field(description="Module title")
    description: str = Field(description="Module description and learning objectives")
    order: int = Field(ge=1, description="Module order in the plan")
    estimated_hours: float = Field(ge=0.5, le=40, description="Estimated hours for the module")
    tasks: list[LearningTask] = Field(min_length=3, max_length=10, description="Tasks in this module")


class LearningPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")

    plan_version: str = Field(default="v1", description="Schema version")
    goal_title: str = Field(description="Learning goal title")
    goal_description: str = Field(description="Detailed description of the learning goal")
    level: Literal["beginner", "intermediate", "advanced", "mixed"] = Field(description="Overall difficulty level")
    estimated_weeks: int = Field(ge=1, le=52, description="Estimated weeks to complete")
    total_hours: float = Field(ge=1, description="Total estimated hours")
    modules: list[LearningModule] = Field(min_length=4, max_length=15, description="Learning modules")
    prerequisites: list[str] = Field(default_factory=list, description="Prerequisites for this plan")
    warnings: list[str] = Field(default_factory=list, description="Warnings about plan limitations")


# ============================================================
# 3. PlanAdaptation — adapting existing plan based on progress
# ============================================================

class PlanChange(BaseModel):
    model_config = ConfigDict(extra="ignore")

    action: Literal[
        "add_module", "remove_module", "reorder_module",
        "add_task", "remove_task", "modify_task",
        "adjust_difficulty",
    ] = Field(description="Type of change to apply")
    target: str = Field(description="Module or task title being changed")
    details: str = Field(description="Specific change details")
    reason: str = Field(description="Why this change is needed")


class PlanAdaptation(BaseModel):
    model_config = ConfigDict(extra="ignore")

    trigger: str = Field(description="What triggered this adaptation")
    changes: list[PlanChange] = Field(min_length=1, description="List of changes to apply")
    summary: str = Field(description="Human-readable summary of all changes")


# ============================================================
# 4. DailyTasks — AI-generated daily learning tasks
# ============================================================

class DailyTaskItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    module_title: str = Field(description="Which module this task belongs to")
    task_title: str = Field(description="Original task title from the plan")
    reason: str = Field(description="Why this task was selected for today")
    estimated_minutes: int = Field(ge=5, le=120, description="Estimated time")
    priority: Literal["high", "medium", "low"] = Field(description="Priority for today")


class DailyTasks(BaseModel):
    model_config = ConfigDict(extra="ignore")

    tasks: list[DailyTaskItem] = Field(min_length=1, max_length=3, description="Tasks for today (1-3)")
    summary: str = Field(description="Brief summary of today's focus")
    total_minutes: int = Field(ge=5, description="Total estimated time")


# ============================================================
# 5. Insights — productivity and finance insights
# ============================================================

class Insight(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: Literal["productivity", "finance", "habits", "learning", "general"] = Field(description="Insight category")
    title: str = Field(description="Short insight title")
    description: str = Field(description="Detailed actionable insight")
    trend: Literal["improving", "declining", "stable", "new_pattern"] = Field(description="Observed trend")
    recommendation: str = Field(description="Specific actionable recommendation")


class Insights(BaseModel):
    model_config = ConfigDict(extra="ignore")

    insights: list[Insight] = Field(min_length=2, max_length=3, description="Generated insights")
    period_summary: str = Field(description="Summary of the analyzed period")


# ============================================================
# 6. ReceiptData — OCR receipt parsing
# ============================================================

class ReceiptItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(description="Item name")
    quantity: float = Field(ge=0, default=1, description="Quantity")
    price: float = Field(description="Item price")


class ReceiptData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    merchant: str = Field(default="", description="Merchant/store name")
    items: list[ReceiptItem] = Field(default_factory=list, description="Line items from receipt")
    subtotal: float | None = Field(default=None, description="Subtotal before tax")
    tax: float | None = Field(default=None, description="Tax amount")
    total: float = Field(description="Total amount")
    currency: str = Field(default="", description="Detected currency code (USD, UZS, RUB, etc.)")
    date: str = Field(default="", description="Receipt date in YYYY-MM-DD format if detected")
    category: str = Field(default="", description="Suggested expense category")
    warnings: list[str] = Field(default_factory=list, description="Warnings about OCR quality or ambiguity")
