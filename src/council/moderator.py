"""Moderator engine — cheap LLM calls to dynamically pick speakers or declare debate done."""

from __future__ import annotations

from typing import TYPE_CHECKING

from council import providers
from council.models import Member

if TYPE_CHECKING:
    from council.engine import Engine

HARD_CAP_TURNS = 12

MODERATOR_SYSTEM = (
    "You are an impartial debate moderator. Your job is to guide an intellectually rigorous "
    "and balanced debate between council members.\n"
    "Based on the transcript so far, choose the NEXT council member who should speak to provide "
    "a counterargument, alternative perspective, or deepen the discussion.\n"
    "If the topic has been thoroughly explored, consensus has been reached, or members have begun "
    "repeating points, respond with the single word 'DONE'.\n\n"
    "Rules:\n"
    "- Output ONLY the name of the chosen member OR 'DONE'.\n"
    "- Do not include punctuation, explanations, or quotes."
)


def pick_next_speaker(
    engine: Engine,
    active_members: list[Member],
    moderator_member: Member,
) -> str | None:
    """
    Ask the moderator LLM who should speak next or if the debate is DONE.
    Returns the chosen member name, or None if DONE.
    """
    if not active_members:
        return None

    names = [m.name for m in active_members]
    window = engine.transcript[-engine.config.window :]
    transcript_summary = "\n".join(f"[{entry.speaker}]: {entry.text}" for entry in window)

    user_prompt = (
        f"Debate Transcript:\n{transcript_summary}\n\n"
        f"Available active members: {', '.join(names)}\n\n"
        "Who should speak next, or are we DONE?"
    )

    try:
        verdict = providers.complete(
            moderator_member,
            system_prompt=MODERATOR_SYSTEM,
            user_prompt=user_prompt,
            words=10,
        )
        verdict = verdict.strip().strip("'\"").strip()

        if verdict.upper() == "DONE" or "DONE" in verdict.upper():
            return None

        # Match verdict against active member names
        for m in active_members:
            if m.name.lower() in verdict.lower():
                return m.name

        # If model returned something else, fall back to round-robin order
        return active_members[0].name
    except providers.ProviderError:
        # If moderator call fails, fall back to first active member
        return active_members[0].name
