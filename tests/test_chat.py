"""Unit tests for interactive ChatSession slash commands."""

from __future__ import annotations

from council.chat import ChatSession
from council.engine import Engine
from council.models import CouncilConfig


def test_slash_rounds(default_config: CouncilConfig):
    engine = Engine(default_config)
    session = ChatSession(engine)

    session._handle_slash("/rounds 4")
    assert engine.config.rounds == 4


def test_slash_mute_and_unmute(default_config: CouncilConfig):
    engine = Engine(default_config)
    session = ChatSession(engine)

    # Mute Builder
    session._handle_slash("/mute Builder")
    builder = next(m for m in engine.config.members if m.name == "Builder")
    assert builder.muted is True
    assert "Builder" not in [m.name for m in engine.active_members()]

    # Unmute Builder
    session._handle_slash("/unmute Builder")
    assert builder.muted is False
    assert "Builder" in [m.name for m in engine.active_members()]


def test_slash_clear(default_config: CouncilConfig):
    engine = Engine(default_config)
    engine.add_user_message("Hello")
    assert len(engine.transcript) == 1

    session = ChatSession(engine)
    session._handle_slash("/clear")
    assert len(engine.transcript) == 0


def test_slash_quit(default_config: CouncilConfig):
    engine = Engine(default_config)
    session = ChatSession(engine)
    assert session.running is True

    session._handle_slash("/quit")
    assert session.running is False
