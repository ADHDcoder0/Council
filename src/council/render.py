"""Rich terminal output — panels, spinners, colours, errors."""

from __future__ import annotations

from rich.console import Console
from rich.panel import Panel
from rich.text import Text

# Colour palette for members (cycles if more than 6)
MEMBER_COLORS = ["cyan", "green", "yellow", "magenta", "blue", "red"]

console = Console()

_color_map: dict[str, str] = {}


def _color(name: str) -> str:
    """Return a stable colour for *name*, assigning one on first use."""
    if name not in _color_map:
        idx = len(_color_map) % len(MEMBER_COLORS)
        _color_map[name] = MEMBER_COLORS[idx]
    return _color_map[name]


# ── Header / structural output ───────────────────────────────────────────


def print_header(topic: str, rounds: int, member_count: int) -> None:
    console.print()
    console.print(
        Panel(
            f"[bold]{topic}[/bold]\n"
            f"[dim]{member_count} members · {rounds} round(s)[/dim]",
            title="[bold white]⚖️  Council[/bold white]",
            border_style="bright_blue",
            expand=False,
        )
    )
    console.print()


def print_round_header(round_num: int, total: int) -> None:
    console.print(f"[dim]── Round {round_num}/{total} ──[/dim]")
    console.print()


# ── Member output ─────────────────────────────────────────────────────────


def print_member_response(name: str, text: str, is_chair: bool = False) -> None:
    color = _color(name)
    title = f"{'👑 ' if is_chair else ''}{name}"
    console.print(
        Panel(
            Text(text),
            title=f"[bold {color}]{title}[/bold {color}]",
            border_style=color,
            padding=(0, 1),
        )
    )
    console.print()


def print_error(name: str, error: object) -> None:
    console.print(f"  [bold red]✗ {name}:[/bold red] [red]{error}[/red]")
    console.print()


# ── Spinner ───────────────────────────────────────────────────────────────


def start_spinner(name: str):
    """Return a Rich Status context manager for a member's thinking time."""
    color = _color(name)
    return console.status(
        f"[{color}]{name} is thinking...[/{color}]", spinner="dots"
    )


# ── User message ──────────────────────────────────────────────────────────


def print_user_message(text: str) -> None:
    console.print(f"  [bold white]You:[/bold white] {text}")
    console.print()
