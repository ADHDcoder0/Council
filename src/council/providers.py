"""Provider abstraction — one function to call any supported LLM."""

from __future__ import annotations

import os
import time
from typing import TYPE_CHECKING

import httpx

if TYPE_CHECKING:
    from council.models import Member

# Maps provider name → env var name
PROVIDER_KEY_ENV: dict[str, str] = {
    "anthropic": "ANTHROPIC_API_KEY",
    "openai": "OPENAI_API_KEY",
    "gemini": "GEMINI_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
}

_RETRYABLE_STATUSES = {429, 500, 502, 503, 504}
_BACKOFFS = [1.0, 3.0]


class ProviderError(Exception):
    """Raised when a provider call fails after retries."""


def get_api_key(provider: str) -> str | None:
    """Return the API key for a provider, or None if not set."""
    env_var = PROVIDER_KEY_ENV.get(provider)
    if env_var is None:
        return None
    return os.environ.get(env_var) or None


def complete(member: Member, system_prompt: str, user_prompt: str, words: int = 120) -> str:
    """
    Call the appropriate provider and return the response text.

    Raises ProviderError on failure (bad key, unknown provider, exhausted retries).
    """
    api_key = get_api_key(member.provider)
    if not api_key:
        raise ProviderError(f"No API key found for {member.provider}")

    dispatch = {
        "anthropic": _call_anthropic,
        "openai": _call_openai,
        "gemini": _call_gemini,
        "openrouter": _call_openrouter,
    }
    fn = dispatch.get(member.provider)
    if fn is None:
        raise ProviderError(f"Unknown provider: {member.provider}")

    return _with_retry(fn, api_key, member.model, system_prompt, user_prompt, words)


# ── Provider implementations ─────────────────────────────────────────────


def _call_anthropic(
    api_key: str, model: str, system: str, user: str, words: int
) -> str:
    max_tokens = words * 2
    resp = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        },
        timeout=60.0,
    )
    resp.raise_for_status()
    data = resp.json()
    blocks = data.get("content", [])
    text_parts = [b["text"] for b in blocks if b.get("type") == "text"]
    if not text_parts:
        raise ProviderError(f"Anthropic returned no text: {resp.text[:200]}")
    return "".join(text_parts)


def _call_openai(
    api_key: str, model: str, system: str, user: str, words: int
) -> str:
    max_tokens = words * 2
    resp = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "max_completion_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=60.0,
    )
    resp.raise_for_status()
    choices = resp.json().get("choices", [])
    if not choices or "message" not in choices[0]:
        raise ProviderError(f"OpenAI returned no choices: {resp.text[:200]}")
    content = choices[0]["message"].get("content")
    if content is None:
        raise ProviderError(f"OpenAI returned null content: {choices[0]}")
    return content


def _call_gemini(
    api_key: str, model: str, system: str, user: str, words: int
) -> str:
    # Gemini gets 4× budget because of thinking tokens
    max_tokens = words * 2 * 4
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/"
        f"models/{model}:generateContent"
    )
    resp = httpx.post(
        url,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        json={
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {"maxOutputTokens": max_tokens},
        },
        timeout=60.0,
    )
    resp.raise_for_status()
    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        raise ProviderError(f"Gemini returned no candidates: {data}")
    content = candidates[0].get("content", {})
    parts = content.get("parts", [])
    text_parts = [p["text"] for p in parts if "text" in p and not p.get("thought", False)]
    if not text_parts:
        text_parts = [p["text"] for p in parts if "text" in p]
    if not text_parts:
        raise ProviderError(f"Gemini returned no text content: {candidates[0]}")
    return "".join(text_parts)


def _call_openrouter(
    api_key: str, model: str, system: str, user: str, words: int
) -> str:
    max_tokens = words * 2
    resp = httpx.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/council-cli",
            "X-Title": "council",
        },
        json={
            "model": model,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=60.0,
    )
    resp.raise_for_status()
    choices = resp.json().get("choices", [])
    if not choices or "message" not in choices[0]:
        raise ProviderError(f"OpenRouter returned no choices: {resp.text[:200]}")
    content = choices[0]["message"].get("content")
    if content is None:
        raise ProviderError(f"OpenRouter returned null content: {choices[0]}")
    return content


# ── Retry logic ───────────────────────────────────────────────────────────


def _with_retry(fn, api_key: str, model: str, system: str, user: str, words: int) -> str:
    """Retry on 429/5xx and network errors up to 2 extra attempts with backoff. No retry on 400/401."""
    last_exc: Exception | None = None
    for attempt in range(len(_BACKOFFS) + 1):
        try:
            return fn(api_key, model, system, user, words)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code not in _RETRYABLE_STATUSES:
                raise ProviderError(
                    f"{exc.response.status_code}: {exc.response.text[:200]}"
                ) from exc
            last_exc = exc
            if attempt < len(_BACKOFFS):
                time.sleep(_BACKOFFS[attempt])
        except httpx.RequestError as exc:
            last_exc = exc
            if attempt < len(_BACKOFFS):
                time.sleep(_BACKOFFS[attempt])
    raise ProviderError(f"Failed after {len(_BACKOFFS) + 1} attempts: {last_exc}")
