"""
Unit tests for GradeIntelligenceAgent.
All functions are deterministic Python — no mocks, no LLM, no fixtures needed.
"""
import pytest
from agents.grade_intelligence import compute_current_grade, compute_required_scores, GradeEntry


# ── compute_current_grade ────────────────────────────────────────────────────

def test_single_category_perfect_score():
    entries = [GradeEntry(score_earned=100, score_possible=100, category="Exams", weight=1.0)]
    categories = {"Exams": 1.0}
    result = compute_current_grade(entries, categories)
    assert result["current_grade_pct"] == 100.0
    assert result["letter_grade"] == "A"
    assert result["weight_graded"] == 100.0


def test_weighted_two_categories():
    # Homework 30% at 80%, Exams 70% at 60% → 0.8×0.3 + 0.6×0.7 = 0.66 → 66%
    entries = [
        GradeEntry(score_earned=80, score_possible=100, category="Homework", weight=0.3),
        GradeEntry(score_earned=60, score_possible=100, category="Exams", weight=0.7),
    ]
    categories = {"Homework": 0.3, "Exams": 0.7}
    result = compute_current_grade(entries, categories)
    assert result["current_grade_pct"] == 66.0
    assert result["letter_grade"] == "D"


def test_zero_score_possible_guard():
    """Entry with score_possible=0 should not raise ZeroDivisionError."""
    entries = [GradeEntry(score_earned=0, score_possible=0, category="Labs", weight=0.5)]
    categories = {"Labs": 0.5}
    result = compute_current_grade(entries, categories)
    assert result["current_grade_pct"] == 0.0
    assert result["letter_grade"] == "F"


def test_multiple_entries_same_category():
    """Two entries in the same category are averaged before applying the category weight."""
    entries = [
        GradeEntry(score_earned=80, score_possible=100, category="Labs", weight=1.0),
        GradeEntry(score_earned=100, score_possible=100, category="Labs", weight=1.0),
    ]
    categories = {"Labs": 1.0}
    result = compute_current_grade(entries, categories)
    # average = (0.80 + 1.00) / 2 = 0.90 → 90%
    assert result["current_grade_pct"] == 90.0
    assert result["letter_grade"] == "A-"


def test_no_entries_returns_zero():
    result = compute_current_grade([], {"Exams": 0.5, "Labs": 0.5})
    assert result["current_grade_pct"] == 0.0
    assert result["weight_graded"] == 0.0


# ── compute_required_scores ──────────────────────────────────────────────────

def test_required_scores_feasible():
    # current 70%, target 80%, remaining 50% of weight
    # already_weighted = 70 * 0.50 / 100 = 0.35
    # required = (0.80 - 0.35) / 0.50 = 0.90 → 90%
    result = compute_required_scores(current_grade_pct=70.0, target_pct=80.0, remaining_weight=0.5)
    assert result["required_pct"] == 90.0
    assert result["feasible"] is True


def test_required_scores_infeasible():
    # current 40%, target 90%, remaining only 10%
    result = compute_required_scores(current_grade_pct=40.0, target_pct=90.0, remaining_weight=0.1)
    assert result["feasible"] is False
    assert result["required_pct"] > 100.0


def test_required_scores_no_remaining():
    result = compute_required_scores(current_grade_pct=75.0, target_pct=90.0, remaining_weight=0)
    assert result["feasible"] is False
    assert result["required_pct"] is None


# ── Letter grade thresholds (_to_letter via compute_current_grade) ────────────

@pytest.mark.parametrize("score,expected_letter", [
    (0.93, "A"),
    (0.90, "A-"),
    (0.87, "B+"),
    (0.83, "B"),
    (0.80, "B-"),
    (0.77, "C+"),
    (0.73, "C"),
    (0.70, "C-"),
    (0.60, "D"),
    (0.59, "F"),
])
def test_letter_grade_thresholds(score, expected_letter):
    entries = [GradeEntry(
        score_earned=score * 100,
        score_possible=100,
        category="Test",
        weight=1.0,
    )]
    result = compute_current_grade(entries, {"Test": 1.0})
    assert result["letter_grade"] == expected_letter
