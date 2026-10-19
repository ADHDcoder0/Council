"""Unit tests for moderator selection and 12-turn hard cap."""

from __future__ import annotations

from unittest.mock import patch

from council.engine import Engine
from council.models import CouncilConfig
from council.moderator import HARD_CAP_TURNS, pick_next_speaker


def test_moderator_picks_named_speaker(default_config: CouncilConfig):
    engine = Engine(default_config)
    engine.add_user_message("Topic")
    active = engine.active_members()

    def mock_complete(member, system_prompt="", user_prompt="", words=120, on_token=None, **kwargs):
        return "Visionary"

    with patch("council.providers.complete", side_effect=mock_complete):
        choice = pick_next_speaker(engine, active, active[0])
        assert choice == "Visionary"


def test_moderator_signals_done(default_config: CouncilConfig):
    engine = Engine(default_config)
    engine.add_user_message("Topic")
    active = engine.active_members()

    def mock_complete(member, system_prompt="", user_prompt="", words=120, on_token=None, **kwargs):
        return "DONE"

    with patch("council.providers.complete", side_effect=mock_complete):
        choice = pick_next_speaker(engine, active, active[0])
        assert choice is None


def test_moderator_hard_cap_constant():
    assert HARD_CAP_TURNS == 12
