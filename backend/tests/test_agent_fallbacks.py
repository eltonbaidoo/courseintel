"""
Tests for agent fallback / resilience behavior.

These tests verify that every agent returns a safe, well-structured default
when the LLM call fails (network error, timeout, bad JSON). This is the core
resilience guarantee of the pipeline: one failing agent never breaks the
bootstrap.
"""
import json
import pytest
from unittest.mock import AsyncMock, patch


# ── discovery ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_discovery_returns_safe_dict_on_llm_failure():
    """DiscoveryAgent falls back gracefully when LLM raises an exception."""
    with patch("agents.discovery.call_claude", new_callable=AsyncMock, side_effect=RuntimeError("no key")):
        with patch("agents.discovery.search_web", new_callable=AsyncMock, return_value=[]):
            from agents.discovery import run
            result = await run("University of Rhode Island", "CSC 212", "Marco Alvarez")

    assert isinstance(result, dict)
    assert "canonical_name" in result
    assert "confidence" in result
    assert result["confidence"] < 0.5  # Low confidence on fallback


@pytest.mark.asyncio
async def test_discovery_returns_safe_dict_on_bad_json():
    """DiscoveryAgent handles non-JSON LLM output without crashing."""
    with patch("agents.discovery.call_claude", new_callable=AsyncMock, return_value="NOT JSON {{{"):
        with patch("agents.discovery.search_web", new_callable=AsyncMock, return_value=[]):
            from agents.discovery import run
            result = await run("MIT", "6.006")

    assert isinstance(result, dict)
    assert "canonical_name" in result


# ── reputation ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_reputation_returns_safe_dict_on_llm_failure():
    with patch("agents.reputation.call_claude", new_callable=AsyncMock, side_effect=ConnectionError("timeout")):
        with patch("agents.reputation.search_for_reputation", new_callable=AsyncMock, return_value=[{"title": "test", "content": "test"}]):
            from agents.reputation import run
            result = await run("CSC 212", "Marco Alvarez", "URI")

    assert isinstance(result, dict)
    for key in ("workload", "difficulty", "grading_style", "key_warnings", "positive_signals", "summary"):
        assert key in result


@pytest.mark.asyncio
async def test_reputation_returns_empty_on_no_results():
    """ReputationAgent returns a confidence=0.0 stub when search yields nothing."""
    with patch("agents.reputation.search_for_reputation", new_callable=AsyncMock, return_value=[]):
        from agents.reputation import run
        result = await run("CSC 212", "unknown professor", "URI")

    assert isinstance(result, dict)
    assert result.get("confidence", 1.0) == 0.0


# ── public_resources ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_public_resources_returns_empty_list_on_failure():
    with patch("agents.public_resources.call_claude", new_callable=AsyncMock, side_effect=RuntimeError("no key")):
        with patch("agents.public_resources.search_for_course_resources", new_callable=AsyncMock, return_value=[]):
            from agents.public_resources import run
            result = await run("CSC 212", "URI", ["trees", "graphs"])

    assert isinstance(result, dict)
    assert result.get("resources") == []


@pytest.mark.asyncio
async def test_public_resources_returns_empty_on_bad_json():
    with patch("agents.public_resources.call_claude", new_callable=AsyncMock, return_value="bad response"):
        with patch("agents.public_resources.search_for_course_resources", new_callable=AsyncMock, return_value=[]):
            from agents.public_resources import run
            result = await run("CSC 212", "URI", [])

    assert result == {"resources": []}


# ── tool_discovery ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_tool_discovery_returns_empty_list_on_failure():
    with patch("agents.tool_discovery.call_claude", new_callable=AsyncMock, side_effect=RuntimeError("no key")):
        from agents.tool_discovery import run
        result = await run("Syllabus text mentioning Gradescope", "")

    assert isinstance(result, dict)
    assert result.get("tools") == []


@pytest.mark.asyncio
async def test_tool_discovery_parses_valid_json():
    valid_response = json.dumps({
        "tools": [
            {"tool_name": "Gradescope", "evidence": "mentioned in syllabus",
             "purpose": "grading", "confidence": 0.95, "integration_type": "extension_scrape"}
        ]
    })
    with patch("agents.tool_discovery.call_claude", new_callable=AsyncMock, return_value=valid_response):
        from agents.tool_discovery import run
        result = await run("Gradescope is required", "")

    assert len(result["tools"]) == 1
    assert result["tools"][0]["tool_name"] == "Gradescope"
    assert result["tools"][0]["confidence"] == 0.95


# ── syllabus_intelligence ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_syllabus_intelligence_returns_empty_profile_on_failure():
    with patch("agents.syllabus_intelligence.call_claude", new_callable=AsyncMock, side_effect=RuntimeError("no key")):
        from agents.syllabus_intelligence import run
        result = await run("some syllabus text")

    assert isinstance(result, dict)
    for key in ("grading_categories", "key_deadlines", "late_policy", "required_tools"):
        assert key in result
    assert result["grading_categories"] == []
    assert result["key_deadlines"] == []


@pytest.mark.asyncio
async def test_syllabus_intelligence_parses_full_profile():
    valid_response = json.dumps({
        "grading_categories": [
            {"name": "Homework", "weight": 0.35, "notes": "weekly"},
            {"name": "Exams", "weight": 0.65, "notes": "three exams"},
        ],
        "late_policy": "No late work",
        "attendance_policy": "Required",
        "drop_rules": "URI policy",
        "required_tools": ["Gradescope", "Ed Discussion"],
        "key_deadlines": [
            {"title": "Midterm 1", "date": "2025-03-06", "type": "exam"}
        ],
        "course_summary": "Data structures in C++.",
        "workflow_notes": "Weekly labs.",
    })
    with patch("agents.syllabus_intelligence.call_claude", new_callable=AsyncMock, return_value=valid_response):
        from agents.syllabus_intelligence import run
        result = await run("full syllabus text here")

    assert len(result["grading_categories"]) == 2
    assert result["grading_categories"][0]["weight"] == 0.35
    assert result["key_deadlines"][0]["type"] == "exam"
    assert "Gradescope" in result["required_tools"]


# ── obligation_deadline ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_obligation_deadline_returns_input_on_failure():
    """ObligationDeadlineAgent returns the raw input list on LLM failure."""
    raw_deadlines = [
        {"title": "Midterm 1", "date": "2025-03-06", "type": "exam"},
        {"title": "HW 1", "date": "2025-02-07", "type": "assignment"},
    ]
    with patch("agents.obligation_deadline.call_claude", new_callable=AsyncMock, side_effect=RuntimeError("no key")):
        from agents.obligation_deadline import run
        result = await run(raw_deadlines)

    assert isinstance(result, dict)
    assert "obligations" in result
    # Fallback should preserve original data rather than silently drop it
    assert len(result["obligations"]) == len(raw_deadlines)


@pytest.mark.asyncio
async def test_obligation_deadline_parses_urgency_levels():
    valid_response = json.dumps({
        "obligations": [
            {"title": "Midterm 1", "due_date": "2025-03-06T09:30:00",
             "source": "syllabus", "type": "exam", "urgency": "critical", "conflict_note": None},
            {"title": "HW 1", "due_date": "2025-02-07T23:59:00",
             "source": "syllabus", "type": "assignment", "urgency": "high", "conflict_note": None},
        ]
    })
    with patch("agents.obligation_deadline.call_claude", new_callable=AsyncMock, return_value=valid_response):
        from agents.obligation_deadline import run
        result = await run([{"title": "Midterm 1"}, {"title": "HW 1"}])

    assert len(result["obligations"]) == 2
    urgencies = {o["title"]: o["urgency"] for o in result["obligations"]}
    assert urgencies["Midterm 1"] == "critical"
    assert urgencies["HW 1"] == "high"
