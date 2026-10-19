"""CLI entry point — Typer app with the `run` command (Phase 1)."""

from __future__ import annotations

import typer

from council import render
from council.engine import Engine
from council.models import CouncilConfig, Member, TranscriptEntry
from council.providers import ProviderError, complete

app = typer.Typer(
    name="council",
    help="A council of AI models debates your topic.",
    no_args_is_help=True,
)


# ── Default council (replaced by config.toml in Phase 3) ─────────────────


def _default_config() -> CouncilConfig:
    """Hardcoded default council for Phase 1."""
    return CouncilConfig(
        members=[
            Member(
                name="Skeptic",
                provider="anthropic",
                model="claude-sonnet-5-5",
                role="Finds weak assumptions and risks, fair but never just agrees",
            ),
            Member(
                name="Builder",
                provider="openai",
                model="gpt-4o",
                role="Practical steps, trade-offs, cost, simplest thing that works",
            ),
            Member(
                name="Visionary",
                provider="gemini",
                model="gemini-2.5-flash",
                role="Bold alternatives and long-term thinking",
            ),
            Member(
                name="Chair",
                provider="anthropic",
                model="claude-sonnet-5-5",
                role=(
                    "Neutral summary of agreements and disagreements, "
                    "plus a recommendation"
                ),
                chair=True,
            ),
        ]
    )


# ── Commands ──────────────────────────────────────────────────────────────


@app.command()
def run(
    topic: str = typer.Argument(..., help="The topic to debate"),
    rounds: int = typer.Option(1, "--rounds", "-r", help="Number of debate rounds"),
    save: bool = typer.Option(False, "--save", "-s", help="Save transcript (Phase 3)"),
) -> None:
    """Run a one-shot debate on TOPIC, then exit."""
    config = _default_config()
    config.rounds = rounds

    engine = Engine(config)
    engine.add_user_message(topic)

    active = engine.active_members()
    render.print_header(topic, rounds, len(active))

    # ── Rounds ────────────────────────────────────────────────────────
    for r in range(1, rounds + 1):
        render.print_round_header(r, rounds)
        for member in active:
            system = engine.build_system_prompt(member)
            user = engine.build_user_prompt(member)
            try:
                with render.start_spinner(member.name):
                    text = complete(member, system, user, config.words)
            except ProviderError as err:
                render.print_error(member.name, err)
                continue

            engine.transcript.append(
                TranscriptEntry(speaker=member.name, kind="member", text=text)
            )
            render.print_member_response(member.name, text)

    # ── Chair auto-summary ────────────────────────────────────────────
    chair = engine.chair()
    if chair:
        system = engine.build_system_prompt(chair)
        user = engine.build_user_prompt(chair)
        try:
            with render.start_spinner(chair.name):
                text = complete(chair, system, user, config.words)
            engine.transcript.append(
                TranscriptEntry(speaker=chair.name, kind="chair", text=text)
            )
            render.print_member_response(chair.name, text, is_chair=True)
        except ProviderError as err:
            render.print_error(chair.name, err)

    if save:
        render.console.print("[dim]--save is not yet implemented (Phase 3)[/dim]")


@app.command()
def chat(
    topic: str = typer.Argument(None, help="Optional starting topic"),
) -> None:
    """Interactive debate session."""
    from council.chat import ChatSession

    config = _default_config()
    engine = Engine(config)
    session = ChatSession(engine, topic=topic)
    session.start()


@app.command()
def resume(
    file: str = typer.Argument(..., help="Saved session file"),
) -> None:
    """Reload a saved session (Phase 3)."""
    render.console.print("[yellow]council resume is coming in Phase 3.[/yellow]")


@app.command()
def doctor() -> None:
    """Check API keys and test members (Phase 3)."""
    render.console.print("[yellow]council doctor is coming in Phase 3.[/yellow]")


# ── Entry point ───────────────────────────────────────────────────────────


def main() -> None:
    app()
