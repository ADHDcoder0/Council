"""Unit tests for configuration reading, writing, and setup wizard."""

from __future__ import annotations

from pathlib import Path
import pytest

from council.config import parse_config_file, run_wizard, save_config
from council.models import CouncilConfig, Member


def test_config_save_and_parse_roundtrip(tmp_path: Path):
    path = tmp_path / "config.toml"
    orig_config = CouncilConfig(
        words=150,
        window=30,
        rounds=2,
        rules="Test rules.",
        members=[
            Member("Alice", "openai", "gpt-4o", "Role A", chair=False),
            Member("Bob", "anthropic", "claude-sonnet-5-5", "Role B", chair=True),
        ],
    )

    save_config(orig_config, path)
    loaded = parse_config_file(path)

    assert loaded.words == 150
    assert loaded.window == 30
    assert loaded.rounds == 2
    assert loaded.rules == "Test rules."
    assert len(loaded.members) == 2
    assert loaded.members[0].name == "Alice"
    assert loaded.members[0].provider == "openai"
    assert loaded.members[1].name == "Bob"
    assert loaded.members[1].chair is True


def test_wizard_single_key(monkeypatch, tmp_path: Path):
    monkeypatch.setattr("council.config.CONFIG_PATH", tmp_path / "config.toml")
    monkeypatch.setattr("council.config.CONFIG_DIR", tmp_path)
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    config = run_wizard()

    assert len(config.members) == 4
    # All members must be assigned to OpenAI
    assert all(m.provider == "openai" for m in config.members)
    assert any(m.chair for m in config.members)


def test_wizard_multi_key(monkeypatch, tmp_path: Path):
    monkeypatch.setattr("council.config.CONFIG_PATH", tmp_path / "config.toml")
    monkeypatch.setattr("council.config.CONFIG_DIR", tmp_path)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-anthropic-key")
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    config = run_wizard()

    providers = {m.provider for m in config.members}
    assert providers == {"anthropic", "gemini"}
    assert any(m.chair for m in config.members)
