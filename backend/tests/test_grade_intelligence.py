"""
Unit tests for GradeIntelligenceAgent.
All functions are deterministic Python — no mocks, no LLM, no fixtures needed.
"""
import pytest
from agents.grade_intelligence import compute_current_grade, compute_required_scores, compute_grade_trend, GradeEntry


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

# ── compute_grade_trend ──────────────────────────────────────────────────────

def test_trend_empty_entries():
    result = compute_grade_trend([], {"Exams": 1.0})
    assert result["trend_label"] == "stable"
    assert result["projected_final"] == 0.0
    assert result["confidence"] == "low"


def test_trend_improving():
    """Scores increasing over time → positive slope → improving."""
    categories = {"HW": 1.0}
    entries = [
        GradeEntry(score_earned=50, score_possible=100, category="HW", weight=1.0, created_at="2025-01-01T00:00:00"),
        GradeEntry(score_earned=65, score_possible=100, category="HW", weight=1.0, created_at="2025-01-08T00:00:00"),
        GradeEntry(score_earned=75, score_possible=100, category="HW", weight=1.0, created_at="2025-01-15T00:00:00"),
        GradeEntry(score_earned=85, score_possible=100, category="HW", weight=1.0, created_at="2025-01-22T00:00:00"),
        GradeEntry(score_earned=92, score_possible=100, category="HW", weight=1.0, created_at="2025-01-29T00:00:00"),
    ]
    result = compute_grade_trend(entries, categories)
    assert result["trend_label"] == "improving"
    assert result["slope_per_entry"] > 0
    assert result["projected_final"] > entries[0].score_earned


def test_trend_declining():
    """Scores decreasing over time → negative slope → declining."""
    categories = {"HW": 1.0}
    entries = [
        GradeEntry(score_earned=95, score_possible=100, category="HW", weight=1.0, created_at="2025-01-01T00:00:00"),
        GradeEntry(score_earned=85, score_possible=100, category="HW", weight=1.0, created_at="2025-01-08T00:00:00"),
        GradeEntry(score_earned=72, score_possible=100, category="HW", weight=1.0, created_at="2025-01-15T00:00:00"),
        GradeEntry(score_earned=60, score_possible=100, category="HW", weight=1.0, created_at="2025-01-22T00:00:00"),
        GradeEntry(score_earned=50, score_possible=100, category="HW", weight=1.0, created_at="2025-01-29T00:00:00"),
    ]
    result = compute_grade_trend(entries, categories)
    assert result["trend_label"] == "declining"
    assert result["slope_per_entry"] < 0


def test_trend_stable():
    """Consistent scores → near-zero slope → stable."""
    categories = {"HW": 1.0}
    entries = [
        GradeEntry(score_earned=80, score_possible=100, category="HW", weight=1.0, created_at=f"2025-01-0{i+1}T00:00:00")
        for i in range(5)
    ]
    result = compute_grade_trend(entries, categories)
    assert result["trend_label"] == "stable"
    assert abs(result["slope_per_entry"]) < 0.5


def test_trend_data_points_count():
    """data_points list length equals number of entries."""
    categories = {"Labs": 1.0}
    entries = [
        GradeEntry(score_earned=70 + i * 3, score_possible=100, category="Labs", weight=1.0)
        for i in range(6)
    ]
    result = compute_grade_trend(entries, categories)
    assert len(result["data_points"]) == 6


def test_trend_confidence_scales_with_sample_size():
    """Confidence increases with more entries."""
    categories = {"HW": 1.0}
    make = lambda n: [GradeEntry(80, 100, "HW", 1.0) for _ in range(n)]
    assert compute_grade_trend(make(1), categories)["confidence"] == "low"
    assert compute_grade_trend(make(4), categories)["confidence"] == "medium"
    assert compute_grade_trend(make(8), categories)["confidence"] == "high"


def test_trend_projected_final_clamped_to_100():
    """Projection never exceeds 100%."""
    categories = {"HW": 1.0}
    entries = [
        GradeEntry(score_earned=98 + i, score_possible=100, category="HW", weight=1.0, created_at=f"2025-01-0{i+1}T00:00:00")
        for i in range(5)
    ]
    result = compute_grade_trend(entries, categories)
    assert result["projected_final"] <= 100.0


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
