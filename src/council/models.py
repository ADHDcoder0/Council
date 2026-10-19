"""Core data models for the council CLI and Web UI."""

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
class CompleteResult:
    """The result of an LLM completion, including token metrics."""

    text: str
    input_tokens: int = 0
    output_tokens: int = 0
    is_estimated: bool = True

    def __str__(self) -> str:
        return self.text


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


@dataclass
class SessionState:
    """In-memory state for a live debate session (shared by Web UI and CLI)."""

    session_id: str
    topic: str
    config: CouncilConfig
    transcript: list[TranscriptEntry] = field(default_factory=list)
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cost_usd: float = 0.0
    is_cost_estimated: bool = True
