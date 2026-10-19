"""Advanced tests for pricing calculations and exact vs estimated token counts."""

from __future__ import annotations

from council.costs import CostTracker, PRICE_TABLE


def test_costs_exact_calculation():
    tracker = CostTracker()
    # claude-sonnet-5-5 is $3.00 in / $15.00 out per 1M tokens
    tracker.record_turn("claude-sonnet-5-5", input_text="word " * 1000, output_text="word " * 500)

    # 1000 * 1.3 = 1300 in, 500 * 1.3 = 650 out
    assert tracker.total_input_tokens == 1300
    assert tracker.total_output_tokens == 650

    expected_cost = (1300 * 3.00 + 650 * 15.00) / 1_000_000.0
    assert abs(tracker.total_cost_usd - expected_cost) < 1e-6


def test_costs_model_prefix_matching():
    tracker = CostTracker()
    # Test substring match for "gpt-4o-2024-08-06" to "gpt-4o"
    tracker.record_turn("gpt-4o-2024-08-06", input_text="hello", output_text="world")
    assert tracker.total_cost_usd > 0


def test_costs_fallback_default_model():
    tracker = CostTracker()
    # Unknown model falls back to default ($1.50 in / $6.00 out)
    tracker.record_turn("custom-finetune-v1", input_text="a " * 100, output_text="b " * 100)
    expected_cost = (130 * 1.50 + 130 * 6.00) / 1_000_000.0
    assert abs(tracker.total_cost_usd - expected_cost) < 1e-6
