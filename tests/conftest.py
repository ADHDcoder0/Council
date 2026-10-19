"""Test fixtures and fake provider setup for network-isolated testing."""

from __future__ import annotations

import pytest
from council.models import CouncilConfig, Member
from council.providers import ProviderError

FAKE_RESPONSES: dict[str, str] = {
    "Skeptic": "I question the primary assumption. Risk: hidden operational complexity.",
    "Builder": "Practical implementation: pick the simplest tool that satisfies 90% of requirements.",
    "Visionary": "Consider architectural convergence towards distributed event streams.",
    "Chair": "Synthesis: consensus favors simplicity initially, with modularity to evolve later.",
}


@pytest.fixture
def fake_complete(monkeypatch):
    """Patch council.providers.complete to return deterministic mock responses."""
    from council.models import CompleteResult

    def _fake(
        member: Member,
        system_prompt: str,
        user_prompt: str,
        words: int = 120,
        on_token=None,
    ) -> CompleteResult:
        text = FAKE_RESPONSES.get(member.name, f"{member.name} test response.")
        if on_token:
            for word in text.split():
                on_token(word + " ")
        return CompleteResult(text=text, input_tokens=20, output_tokens=10, is_estimated=False)

    monkeypatch.setattr("council.providers.complete", _fake)
    return _fake


@pytest.fixture
def default_config() -> CouncilConfig:
    """Return a standard test council config."""
    return CouncilConfig(
        words=100,
        window=10,
        rounds=1,
        members=[
            Member(
                name="Skeptic",
                provider="anthropic",
                model="claude-sonnet-5-5",
                role="Finds weak assumptions and risks",
                chair=False,
            ),
            Member(
                name="Builder",
                provider="openai",
                model="gpt-4o",
                role="Practical steps and trade-offs",
                chair=False,
            ),
            Member(
                name="Visionary",
                provider="gemini",
                model="gemini-2.5-flash",
                role="Bold alternatives",
                chair=False,
            ),
            Member(
                name="Chair",
                provider="anthropic",
                model="claude-sonnet-5-5",
                role="Neutral summary and recommendation",
                chair=True,
            ),
        ],
    )


@pytest.fixture
def failing_skeptic_complete(monkeypatch):
    """Patch council.providers.complete to fail for Skeptic (bad key) while others succeed."""
    from council.models import CompleteResult

    def _fake(
        member: Member,
        system_prompt: str,
        user_prompt: str,
        words: int = 120,
        on_token=None,
    ) -> CompleteResult:
        if member.name == "Skeptic":
            raise ProviderError("401: Invalid API key")
        text = FAKE_RESPONSES.get(member.name, f"{member.name} test response.")
        if on_token:
            on_token(text)
        return CompleteResult(text=text, input_tokens=20, output_tokens=10, is_estimated=False)

    monkeypatch.setattr("council.providers.complete", _fake)
    return _fake
