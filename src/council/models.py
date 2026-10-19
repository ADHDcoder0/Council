"""Core data models for the council CLI."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Member:
    """A council member backed by an LLM provider."""

    name: str
    provider: str  # "anthropic" | "openai" | "gemini" | "openrouter"
    model: str
    role: str  # System prompt fragment describing personality
    chair: bool = False
    muted: bool = False


@dataclass
class TranscriptEntry:
    """A single entry in the debate transcript."""

    speaker: str  # Member name or "You"
    kind: str  # "user" | "member" | "chair" | "system"
    text: str


@dataclass
class CouncilConfig:
    """Runtime configuration for a council session."""

    words: int = 120
    window: int = 40
    rounds: int = 1
    rules: str = (
        "Respond to others by name, add something new each turn, plain text only."
    )
    members: list[Member] = field(default_factory=list)
