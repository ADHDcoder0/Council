"""Interactive debate session with slash commands and interrupt handling."""

from __future__ import annotations

from pathlib import Path
from datetime import datetime
import re
from typing import TYPE_CHECKING

from prompt_toolkit import PromptSession
from prompt_toolkit.formatted_text import HTML

from council import providers, render
from council.models import TranscriptEntry

if TYPE_CHECKING:
    from council.engine import Engine
    from council.models import Member


class ChatSession:
    """Manages an interactive multi-round council debate session."""

    def __init__(self, engine: Engine, topic: str | None = None) -> None:
        self.engine = engine
        self.prompt_session: PromptSession = PromptSession()
        self.running: bool = True
        self.initial_topic: str | None = topic

    def start(self) -> None:
        """Entry point for the interactive session."""
        active = self.engine.active_members()
        topic_display = self.initial_topic or "Interactive Session"
        render.print_header(topic_display, self.engine.config.rounds, len(active))

        if self.initial_topic:
            self.engine.add_user_message(self.initial_topic)
            self._run_rounds()

        while self.running:
            try:
                user_input = self.prompt_session.prompt(HTML("<b><cyan>You</cyan> → </b>"))
                self._handle_input(user_input.strip())
            except KeyboardInterrupt:
                # Ctrl+C at prompt cancels current input line
                render.console.print()
                continue
            except EOFError:
                # Ctrl+D exits
                render.console.print("\n[dim]Exiting council.[/dim]")
                break

        render.print_costs(self.engine.cost_tracker.summary())

    def _handle_input(self, text: str) -> None:
        if not text:
            return

        if text.startswith("/"):
            self._handle_slash(text)
        else:
            self.engine.add_user_message(text)
            render.print_user_message(text)
            self._run_rounds()

    def _handle_slash(self, text: str) -> None:
        parts = text.split(maxsplit=1)
        cmd = parts[0].lower()
        arg = parts[1].strip() if len(parts) > 1 else ""

        match cmd:
            case "/run":
                self._run_rounds()
            case "/summary":
                self._run_chair()
            case "/rounds":
                self._set_rounds(arg)
            case "/members":
                self._list_members()
            case "/mute":
                self._set_mute(arg, mute=True)
            case "/unmute":
                self._set_mute(arg, mute=False)
            case "/clear":
                self.engine.transcript.clear()
                render.console.print("[dim]Transcript cleared.[/dim]\n")
            case "/save":
                self._save_session(arg)
            case "/quit" | "/exit":
                self.running = False
                render.console.print("[dim]Exiting council.[/dim]")
            case _:
                render.console.print(
                    f"[red]Unknown command: {cmd}. Type /run, /summary, /rounds, /members, /mute, /unmute, /clear, /save, /quit[/red]\n"
                )

    def _run_rounds(self) -> None:
        """Run debate turns according to config.rounds, interruptible with Ctrl+C."""
        rounds = self.engine.config.rounds
        for r in range(1, rounds + 1):
            render.print_round_header(r, rounds)
            for member in self.engine.active_members():
                system = self.engine.build_system_prompt(member)
                user = self.engine.build_user_prompt(member)
                try:
                    with render.StreamRenderer(member.name) as sr:
                        text = providers.complete(
                            member,
                            system,
                            user,
                            self.engine.config.words,
                            on_token=sr.on_token,
                        )
                except KeyboardInterrupt:
                    render.console.print("\n[yellow]⚡ Cancelled by user.[/yellow]\n")
                    return
                except providers.ProviderError as err:
                    render.print_error(member.name, err)
                    continue

                self.engine.record_cost(member, system, user, text)
                self.engine.transcript.append(
                    TranscriptEntry(speaker=member.name, kind="member", text=text)
                )

    def _run_chair(self) -> None:
        """Request a summary from the chair, interruptible with Ctrl+C."""
        chair = self.engine.chair()
        if not chair:
            render.console.print("[yellow]No chair member configured.[/yellow]\n")
            return

        system = self.engine.build_system_prompt(chair)
        user = self.engine.build_user_prompt(chair)
        try:
            with render.StreamRenderer(chair.name, is_chair=True) as sr:
                text = providers.complete(
                    chair,
                    system,
                    user,
                    self.engine.config.words,
                    on_token=sr.on_token,
                )
            self.engine.record_cost(chair, system, user, text)
            self.engine.transcript.append(
                TranscriptEntry(speaker=chair.name, kind="chair", text=text)
            )
        except KeyboardInterrupt:
            render.console.print("\n[yellow]⚡ Cancelled by user.[/yellow]\n")
        except providers.ProviderError as err:
            render.print_error(chair.name, err)

    def _set_rounds(self, arg: str) -> None:
        if not arg:
            render.console.print(f"[dim]Current rounds per run: {self.engine.config.rounds}[/dim]\n")
            return
        try:
            n = int(arg)
            if n < 1:
                render.console.print("[red]Rounds must be at least 1.[/red]\n")
                return
            self.engine.config.rounds = n
            render.console.print(f"[dim]Rounds per run set to {n}.[/dim]\n")
        except ValueError:
            render.console.print("[red]Usage: /rounds N (e.g., /rounds 2)[/red]\n")

    def _list_members(self) -> None:
        render.console.print()
        for m in self.engine.config.members:
            if m.chair:
                status = "👑 Chair"
            elif m.muted:
                status = "🔇 Muted"
            else:
                status = "🎙️ Active"
            render.console.print(
                f"  {status} [bold]{m.name}[/bold] ({m.provider}/{m.model})\n"
                f"     [dim]{m.role}[/dim]"
            )
        render.console.print()

    def _set_mute(self, name: str, mute: bool) -> None:
        if not name:
            action = "mute" if mute else "unmute"
            render.console.print(f"[red]Usage: /{action} <name>[/red]\n")
            return

        member = next(
            (m for m in self.engine.config.members if m.name.lower() == name.lower()),
            None,
        )
        if not member:
            render.console.print(f"[red]Member '{name}' not found.[/red]\n")
            return

        if member.chair:
            render.console.print("[yellow]The chair cannot be muted. Use /summary to hear from them.[/yellow]\n")
            return

        member.muted = mute
        action_str = "muted" if mute else "unmuted"
        render.console.print(f"[dim]{member.name} is now {action_str}.[/dim]\n")

    def _save_session(self, optional_path: str = "") -> None:
        if not self.engine.transcript:
            render.console.print("[yellow]Transcript is empty. Nothing to save.[/yellow]\n")
            return

        from council.session import save_session

        topic = self.initial_topic or "session"
        try:
            path = save_session(self.engine.transcript, topic=topic, optional_path=optional_path)
            render.console.print(f"[green]Session saved to {path}[/green]\n")
        except OSError as e:
            render.console.print(f"[red]Failed to save session: {e}[/red]\n")
