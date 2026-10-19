"""Debate engine — transcript management, cost tracking, and turn execution."""

from __future__ import annotations

from council import providers
from council.costs import CostTracker
from council.models import CouncilConfig, Member, TranscriptEntry


class Engine:
    """Owns the transcript, cost tracking, and drives debate turns."""

    def __init__(self, config: CouncilConfig) -> None:
        self.config = config
        self.transcript: list[TranscriptEntry] = []
        self.cost_tracker: CostTracker = CostTracker()

    # ── Transcript helpers ────────────────────────────────────────────────

    def add_user_message(self, text: str) -> None:
        self.transcript.append(TranscriptEntry(speaker="You", kind="user", text=text))

    # ── Member queries ────────────────────────────────────────────────────

    def active_members(self) -> list[Member]:
        """Non-chair, non-muted members in config order."""
        return [m for m in self.config.members if not m.chair and not m.muted]

    def chair(self) -> Member | None:
        """Return the chair member, if any."""
        return next((m for m in self.config.members if m.chair), None)

    # ── Prompt construction ───────────────────────────────────────────────

    def build_system_prompt(self, member: Member) -> str:
        other_names = [m.name for m in self.config.members if m.name != member.name]
        return (
            f"You are {member.name}. {member.role}\n\n"
            f"Other council members: {', '.join(other_names)}.\n"
            f"Rules: {self.config.rules}\n"
            f"Keep your response under {self.config.words} words."
        )

    def build_user_prompt(self, member: Member) -> str:
        window = self.transcript[-self.config.window :]
        lines = [f"[{entry.speaker}]: {entry.text}" for entry in window]
        lines.append(f"\nIt is your turn, {member.name}.")
        return "\n".join(lines)

    def record_cost(
        self,
        member: Member,
        system: str,
        user: str,
        output: CompleteResult | str,
    ) -> None:
        """Record input and output tokens for cost calculation."""
        from council.models import CompleteResult

        text = output.text if isinstance(output, CompleteResult) else str(output)
        in_tokens = output.input_tokens if isinstance(output, CompleteResult) else None
        out_tokens = output.output_tokens if isinstance(output, CompleteResult) else None
        is_estimated = output.is_estimated if isinstance(output, CompleteResult) else True

        self.cost_tracker.record_turn(
            model=member.model,
            input_text=f"{system}\n{user}",
            output_text=text,
            input_tokens=in_tokens,
            output_tokens=out_tokens,
            is_estimated=is_estimated,
        )

    # ── Round execution ───────────────────────────────────────────────────

    def run_round(
        self,
        on_start=None,
        on_result=None,
        on_error=None,
        on_token=None,
    ) -> None:
        """Run one round: each active member speaks in config order."""
        for member in self.active_members():
            if on_start:
                on_start(member)
            system = self.build_system_prompt(member)
            user = self.build_user_prompt(member)
            try:
                token_cb = (lambda tok: on_token(member, tok)) if on_token else None
                res = providers.complete(member, system, user, self.config.words, on_token=token_cb)
                self.record_cost(member, system, user, res)
                text = str(res)
                self.transcript.append(
                    TranscriptEntry(speaker=member.name, kind="member", text=text)
                )
                if on_result:
                    on_result(member, text)
            except providers.ProviderError as exc:
                if on_error:
                    on_error(member, exc)

    def run_chair(
        self,
        on_start=None,
        on_result=None,
        on_error=None,
        on_token=None,
    ) -> None:
        """Ask the chair for a summary."""
        chair = self.chair()
        if chair is None:
            return
        if on_start:
            on_start(chair)
        system = self.build_system_prompt(chair)
        user = self.build_user_prompt(chair)
        try:
            token_cb = (lambda tok: on_token(chair, tok)) if on_token else None
            res = providers.complete(chair, system, user, self.config.words, on_token=token_cb)
            self.record_cost(chair, system, user, res)
            text = str(res)
            self.transcript.append(
                TranscriptEntry(speaker=chair.name, kind="chair", text=text)
            )
            if on_result:
                on_result(chair, text)
        except providers.ProviderError as exc:
            if on_error:
                on_error(chair, exc)
