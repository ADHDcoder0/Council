"""CLI entry point — Typer app with run, chat, resume, members, and doctor."""

from __future__ import annotations

from pathlib import Path
import typer

from council import providers, render
from council.config import load_config, save_config
from council.engine import Engine
from council.models import Member, TranscriptEntry

app = typer.Typer(
    name="council",
    help="A council of AI models debates your topic.",
    no_args_is_help=True,
)

members_app = typer.Typer(
    name="members",
    help="Manage council members (list, add, edit, remove).",
    no_args_is_help=True,
)
app.add_typer(members_app, name="members")


# ── Commands ──────────────────────────────────────────────────────────────


@app.command()
def run(
    topic: str = typer.Argument(..., help="The topic to debate"),
    rounds: int = typer.Option(1, "--rounds", "-r", help="Number of debate rounds"),
    save: bool = typer.Option(False, "--save", "-s", help="Save transcript to Markdown"),
    moderator: bool = typer.Option(
        False, "--moderator", "-m", help="Moderator mode: dynamic speaker selection up to 12 turns"
    ),
) -> None:
    """Run a one-shot debate on TOPIC, then exit."""
    config = load_config()
    config.rounds = rounds

    engine = Engine(config)
    engine.add_user_message(topic)

    active = engine.active_members()
    display_rounds = 12 if moderator else rounds
    render.print_header(topic, display_rounds, len(active))

    if moderator:
        from council.moderator import HARD_CAP_TURNS, pick_next_speaker

        mod_member = active[0] if active else config.members[0]
        for turn in range(1, HARD_CAP_TURNS + 1):
            next_name = pick_next_speaker(engine, active, mod_member)
            if next_name is None:
                render.console.print("\n[bold green]✓ Moderator declared debate complete.[/bold green]\n")
                break

            member = next((m for m in active if m.name.lower() == next_name.lower()), active[0])
            render.print_moderator_header(turn, HARD_CAP_TURNS, member.name)

            system = engine.build_system_prompt(member)
            user = engine.build_user_prompt(member)
            try:
                with render.StreamRenderer(member.name) as sr:
                    text = providers.complete(member, system, user, config.words, on_token=sr.on_token)
            except providers.ProviderError as err:
                render.print_error(member.name, err)
                continue

            engine.record_cost(member, system, user, text)
            engine.transcript.append(
                TranscriptEntry(speaker=member.name, kind="member", text=str(text))
            )
    else:
        # Standard round-robin
        for r in range(1, rounds + 1):
            render.print_round_header(r, rounds)
            for member in active:
                system = engine.build_system_prompt(member)
                user = engine.build_user_prompt(member)
                try:
                    with render.StreamRenderer(member.name) as sr:
                        text = providers.complete(
                            member, system, user, config.words, on_token=sr.on_token
                        )
                except providers.ProviderError as err:
                    render.print_error(member.name, err)
                    continue

                engine.record_cost(member, system, user, text)
                engine.transcript.append(
                    TranscriptEntry(speaker=member.name, kind="member", text=str(text))
                )

    # ── Chair auto-summary ────────────────────────────────────
    chair = engine.chair()
    if chair:
        system = engine.build_system_prompt(chair)
        user = engine.build_user_prompt(chair)
        try:
            with render.StreamRenderer(chair.name, is_chair=True) as sr:
                text = providers.complete(chair, system, user, config.words, on_token=sr.on_token)
            engine.record_cost(chair, system, user, text)
            engine.transcript.append(
                TranscriptEntry(speaker=chair.name, kind="chair", text=str(text))
            )
        except providers.ProviderError as err:
            render.print_error(chair.name, err)

    # ── Token & Cost Summary ──────────────────────────────────────────
    render.print_costs(engine.cost_tracker.summary())

    if save:
        from council.session import save_session

        saved_path = save_session(engine.transcript, topic=topic)
        render.console.print(f"[green]Session saved to {saved_path}[/green]")


@app.command()
def chat(
    topic: str = typer.Argument(None, help="Optional starting topic"),
) -> None:
    """Interactive debate session."""
    from council.chat import ChatSession

    config = load_config()
    engine = Engine(config)
    session = ChatSession(engine, topic=topic)
    session.start()


@app.command()
def resume(
    file: Path = typer.Argument(..., help="Path to saved session Markdown file"),
) -> None:
    """Reload a saved session and continue chatting."""
    from council.chat import ChatSession
    from council.session import load_session

    try:
        topic, transcript = load_session(file)
    except Exception as e:
        render.console.print(f"[red]Failed to load session: {e}[/red]")
        raise typer.Exit(code=1)

    config = load_config()
    engine = Engine(config)
    engine.transcript = transcript

    render.console.print(f"[dim]Resumed: {topic} ({len(transcript)} messages)[/dim]\n")
    session = ChatSession(engine, topic=topic)
    session.start()


@app.command()
def doctor() -> None:
    """Show which keys are found, test each member with a 1-word call."""
    config = load_config()

    render.console.print("\n[bold]🩺 Council Doctor[/bold]\n")
    render.console.print("[bold]API Keys:[/bold]")
    for provider, env_var in providers.PROVIDER_KEY_ENV.items():
        val = providers.get_api_key(provider)
        if val:
            render.console.print(f"  [green]✓ {env_var}[/green] ({provider})")
        else:
            render.console.print(f"  [red]✗ {env_var}[/red] ({provider}) — not set")

    render.console.print("\n[bold]Members:[/bold]")
    for member in config.members:
        key = providers.get_api_key(member.provider)
        if not key:
            render.console.print(
                f"  [red]✗ {member.name}[/red] ({member.provider}/{member.model}) — missing key {providers.PROVIDER_KEY_ENV.get(member.provider)}"
            )
            continue

        with render.start_spinner(f"testing {member.name}"):
            try:
                providers.complete(
                    member,
                    system_prompt="Reply with exactly one word.",
                    user_prompt="Ping",
                    words=5,
                )
                render.console.print(f"  [green]✓ {member.name}[/green] ({member.provider}/{member.model})")
            except providers.ProviderError as e:
                render.console.print(
                    f"  [red]✗ {member.name}[/red] ({member.provider}/{member.model}) — {e}"
                )
    render.console.print()


# ── Members subcommands ───────────────────────────────────────────────────


@members_app.command("list")
def members_list() -> None:
    """List all council members."""
    config = load_config()
    render.console.print("\n[bold]Council Members:[/bold]\n")
    for m in config.members:
        icon = "👑 Chair" if m.chair else ("🔇 Muted" if m.muted else "🎙️ Active")
        render.console.print(f"  {icon} [bold]{m.name}[/bold] ({m.provider}/{m.model})")
        render.console.print(f"      [dim]{m.role}[/dim]\n")


@members_app.command("add")
def members_add(
    name: str = typer.Argument(..., help="Member name"),
    provider: str = typer.Argument(..., help="Provider (anthropic, openai, gemini, openrouter)"),
    model: str = typer.Argument(..., help="Model identifier"),
    role: str = typer.Option("You are a helpful debate participant.", "--role", "-r", help="Member role / personality"),
    chair: bool = typer.Option(False, "--chair", help="Whether this member is the chair"),
) -> None:
    """Add a new member to the council."""
    provider_lower = provider.lower()
    if provider_lower not in providers.PROVIDER_KEY_ENV:
        render.console.print(f"[red]Unknown provider '{provider}'. Must be one of: {', '.join(providers.PROVIDER_KEY_ENV)}[/red]")
        raise typer.Exit(code=1)

    config = load_config()
    if any(m.name.lower() == name.lower() for m in config.members):
        render.console.print(f"[red]Member '{name}' already exists. Use 'council members edit' instead.[/red]")
        raise typer.Exit(code=1)

    if chair:
        for m in config.members:
            m.chair = False

    config.members.append(
        Member(name=name, provider=provider_lower, model=model, role=role, chair=chair)
    )
    save_config(config)
    render.console.print(f"[green]Added {name} ({provider_lower}/{model}) to council.[/green]")


@members_app.command("edit")
def members_edit(
    name: str = typer.Argument(..., help="Name of member to edit"),
    provider: str = typer.Option(None, "--provider", "-p", help="New provider"),
    model: str = typer.Option(None, "--model", "-m", help="New model"),
    role: str = typer.Option(None, "--role", "-r", help="New role"),
    chair: bool = typer.Option(None, "--chair/--no-chair", help="Set/unset chair"),
) -> None:
    """Edit an existing council member."""
    config = load_config()
    member = next((m for m in config.members if m.name.lower() == name.lower()), None)
    if not member:
        render.console.print(f"[red]Member '{name}' not found.[/red]")
        raise typer.Exit(code=1)

    if provider:
        p_lower = provider.lower()
        if p_lower not in PROVIDER_KEY_ENV:
            render.console.print(f"[red]Unknown provider '{provider}'. Must be one of: {', '.join(PROVIDER_KEY_ENV)}[/red]")
            raise typer.Exit(code=1)
        member.provider = p_lower

    if model:
        member.model = model
    if role:
        member.role = role
    if chair is not None:
        if chair:
            for m in config.members:
                m.chair = False
        member.chair = chair

    save_config(config)
    render.console.print(f"[green]Updated member {member.name}.[/green]")


@members_app.command("remove")
def members_remove(
    name: str = typer.Argument(..., help="Name of member to remove"),
) -> None:
    """Remove a member from the council."""
    config = load_config()
    initial_len = len(config.members)
    config.members = [m for m in config.members if m.name.lower() != name.lower()]

    if len(config.members) == initial_len:
        render.console.print(f"[red]Member '{name}' not found.[/red]")
        raise typer.Exit(code=1)

    save_config(config)
    render.console.print(f"[green]Removed {name} from council.[/green]")


# ── Entry point ───────────────────────────────────────────────────────────


def main() -> None:
    app()
