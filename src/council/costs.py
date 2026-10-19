"""Token counting and cost estimation using a pricing table."""

from __future__ import annotations

# Pricing per million tokens (input_price, output_price) in USD
PRICE_TABLE: dict[str, tuple[float, float]] = {
    # Anthropic
    "claude-sonnet-5-5": (3.00, 15.00),
    "claude-3-5-sonnet-20241022": (3.00, 15.00),
    "claude-3-5-haiku-20241022": (0.80, 4.00),
    # OpenAI
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "o1": (15.00, 60.00),
    "o3-mini": (1.10, 4.40),
    # Gemini
    "gemini-2.5-flash": (0.15, 0.60),
    "gemini-1.5-flash": (0.075, 0.30),
    "gemini-1.5-pro": (1.25, 5.00),
    # Fallback / OpenRouter average
    "default": (1.50, 6.00),
}

from pathlib import Path
import tomllib
import tomli_w

PRICES_PATH = Path.home() / ".config" / "council" / "prices.toml"


def load_price_table() -> dict[str, tuple[float, float]]:
    """Return pricing table, merged with ~/.config/council/prices.toml if present."""
    table = dict(PRICE_TABLE)
    if PRICES_PATH.exists():
        try:
            with open(PRICES_PATH, "rb") as f:
                data = tomllib.load(f)
            prices = data.get("prices", {})
            for model, p in prices.items():
                if isinstance(p, (list, tuple)) and len(p) == 2:
                    table[model] = (float(p[0]), float(p[1]))
        except Exception:
            pass
    return table


def save_price_table(table: dict[str, tuple[float, float]]) -> None:
    """Save custom pricing table to ~/.config/council/prices.toml."""
    PRICES_PATH.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "prices": {k: [v[0], v[1]] for k, v in table.items()}
    }
    with open(PRICES_PATH, "wb") as f:
        tomli_w.dump(data, f)


# Standard approximation: ~1.3 tokens per word
TOKENS_PER_WORD = 1.3


class CostTracker:
    """Tracks token volume and calculates cost per session."""

    def __init__(self) -> None:
        self.total_input_tokens: int = 0
        self.total_output_tokens: int = 0
        self.total_cost_usd: float = 0.0
        self.has_estimated: bool = False

    def record_turn(
        self,
        model: str,
        input_text: str,
        output_text: str,
        input_tokens: int | None = None,
        output_tokens: int | None = None,
        is_estimated: bool = True,
    ) -> None:
        """Record input and output tokens and accumulate cost."""
        if input_tokens is not None and output_tokens is not None and not is_estimated:
            in_tokens = input_tokens
            out_tokens = output_tokens
        else:
            in_words = len(input_text.split())
            out_words = len(output_text.split())
            in_tokens = max(1, int(in_words * TOKENS_PER_WORD))
            out_tokens = max(1, int(out_words * TOKENS_PER_WORD))
            self.has_estimated = True

        self.total_input_tokens += in_tokens
        self.total_output_tokens += out_tokens

        # Lookup pricing (or match model prefix/substring)
        price_table = load_price_table()
        pricing = price_table.get(model)
        if not pricing:
            for key, p in price_table.items():
                if key in model or model in key:
                    pricing = p
                    break
        if not pricing:
            pricing = price_table["default"]

        cost = (in_tokens * pricing[0] + out_tokens * pricing[1]) / 1_000_000.0
        self.total_cost_usd += cost

    def summary(self) -> str:
        """Format a concise summary string with estimation indication."""
        label = "est." if self.has_estimated else "exact"
        prefix = "~" if self.has_estimated else ""
        return (
            f"Tokens: {prefix}{self.total_input_tokens:,} in / {prefix}{self.total_output_tokens:,} out  ·  "
            f"Est. cost: ${self.total_cost_usd:.4f} ({label})"
        )
