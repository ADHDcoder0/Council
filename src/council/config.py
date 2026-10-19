"""Configuration management, config.toml persistence, and first-run wizard."""

from __future__ import annotations

import os
from pathlib import Path
import tomllib
from typing import TYPE_CHECKING

import tomli_w

from council.models import CouncilConfig, Member
from council.providers import PROVIDER_KEY_ENV, get_api_key

if TYPE_CHECKING:
    pass

CONFIG_DIR = Path.home() / ".config" / "council"
CONFIG_PATH = CONFIG_DIR / "config.toml"

DEFAULT_MEMBERS = [
    Member(
        name="Skeptic",
        provider="anthropic",
        model="claude-sonnet-5-5",
        role="Finds weak assumptions and risks, fair but never just agrees",
        chair=False,
    ),
    Member(
        name="Builder",
        provider="openai",
        model="gpt-4o",
        role="Practical steps, trade-offs, cost, simplest thing that works",
        chair=False,
    ),
    Member(
        name="Visionary",
        provider="gemini",
        model="gemini-2.5-flash",
        role="Bold alternatives and long-term thinking",
        chair=False,
    ),
    Member(
        name="Chair",
        provider="anthropic",
        model="claude-sonnet-5-5",
        role="Neutral summary of agreements and disagreements, plus a recommendation",
        chair=True,
    ),
]

DEFAULT_MODELS_BY_PROVIDER = {
    "anthropic": "claude-sonnet-5-5",
    "openai": "gpt-4o",
    "gemini": "gemini-2.5-flash",
    "openrouter": "anthropic/claude-sonnet-5-5",
}


def load_config() -> CouncilConfig:
    """Load configuration from ~/.config/council/config.toml, launching the wizard if absent."""
    if not CONFIG_PATH.exists():
        return run_wizard()
    return parse_config_file(CONFIG_PATH)


def parse_config_file(path: Path) -> CouncilConfig:
    """Parse a TOML config file into CouncilConfig."""
    with open(path, "rb") as f:
        data = tomllib.load(f)

    settings = data.get("settings", {})
    members_data = data.get("members", [])

    members: list[Member] = []
    for m in members_data:
        members.append(
            Member(
                name=m["name"],
                provider=m["provider"],
                model=m["model"],
                role=m.get("role", "Debater"),
                chair=m.get("chair", False),
            )
        )

    return CouncilConfig(
        words=settings.get("words", 120),
        window=settings.get("window", 40),
        rounds=settings.get("rounds", 1),
        rules=settings.get(
            "rules",
            "Respond to others by name, add something new each turn, plain text only.",
        ),
        members=members,
    )


def save_config(config: CouncilConfig, path: Path = CONFIG_PATH) -> None:
    """Save CouncilConfig to TOML file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "settings": {
            "words": config.words,
            "window": config.window,
            "rounds": config.rounds,
            "rules": config.rules,
        },
        "members": [
            {
                "name": m.name,
                "provider": m.provider,
                "model": m.model,
                "role": m.role,
                "chair": m.chair,
            }
            for m in config.members
        ],
    }
    with open(path, "wb") as f:
        tomli_w.dump(data, f)


def run_wizard() -> CouncilConfig:
    """
    On first run, build a working council from environment keys:
    - If only 1 key found: assigns all roles (including chair) to that provider.
    - If multiple keys found: keeps only members whose provider key is found.
    - If no keys found: creates the default 4-member council with a setup notice.
    """
    from council import render

    available_providers = [
        prov for prov in PROVIDER_KEY_ENV if get_api_key(prov) is not None
    ]

    render.console.print("\n[bold]🧙 Council Setup Wizard[/bold]")

    if not available_providers:
        render.console.print(
            "[yellow]No API keys detected in environment (ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY).[/yellow]"
        )
        render.console.print("[dim]Generating default template config...[/dim]")
        config = CouncilConfig(members=[Member(m.name, m.provider, m.model, m.role, m.chair) for m in DEFAULT_MEMBERS])
        save_config(config)
        render.console.print(f"[green]Saved template council config to {CONFIG_PATH}[/green]\n")
        return config

    render.console.print(f"Detected API key(s) for: [green]{', '.join(available_providers)}[/green]")

    if len(available_providers) == 1:
        single_provider = available_providers[0]
        model = DEFAULT_MODELS_BY_PROVIDER.get(single_provider, "default-model")
        render.console.print(f"[dim]Assigning all roles to {single_provider} ({model})[/dim]")
        members = [
            Member(
                name=m.name,
                provider=single_provider,
                model=model,
                role=m.role,
                chair=m.chair,
            )
            for m in DEFAULT_MEMBERS
        ]
    else:
        # Multiple keys found: keep only members whose provider key is present
        members = [
            Member(m.name, m.provider, m.model, m.role, m.chair)
            for m in DEFAULT_MEMBERS
            if m.provider in available_providers
        ]
        # Ensure a chair exists
        has_chair = any(m.chair for m in members)
        if not has_chair:
            # Assign chair to the first available provider
            chair_provider = available_providers[0]
            chair_model = DEFAULT_MODELS_BY_PROVIDER.get(chair_provider, "default-model")
            chair_template = next(m for m in DEFAULT_MEMBERS if m.chair)
            members.append(
                Member(
                    name=chair_template.name,
                    provider=chair_provider,
                    model=chair_model,
                    role=chair_template.role,
                    chair=True,
                )
            )

    config = CouncilConfig(members=members)
    save_config(config)
    render.console.print(f"[green]Council configured and saved to {CONFIG_PATH}[/green]\n")
    return config
