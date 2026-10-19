"""Provider abstraction — one function to call any supported LLM with optional token streaming."""

from __future__ import annotations

from collections.abc import Callable
import json
import os
import time
from typing import TYPE_CHECKING

import httpx

from council.models import CompleteResult

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


from pathlib import Path

KEYS_PATH = Path.home() / ".config" / "council" / "keys.json"


def load_stored_keys() -> dict[str, str]:
    """Load API keys saved in ~/.config/council/keys.json."""
    if not KEYS_PATH.exists():
        return {}
    try:
        data = json.loads(KEYS_PATH.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return {k: str(v).strip() for k, v in data.items() if str(v).strip()}
    except Exception:
        pass
    return {}


def save_api_keys(keys: dict[str, str]) -> None:
    """Save API keys to ~/.config/council/keys.json with 0600 permissions, and update os.environ."""
    KEYS_PATH.parent.mkdir(parents=True, exist_ok=True)
    existing = load_stored_keys()
    for provider, key in keys.items():
        p_lower = provider.lower()
        if p_lower in PROVIDER_KEY_ENV:
            cleaned = key.strip()
            if cleaned:
                existing[p_lower] = cleaned
                os.environ[PROVIDER_KEY_ENV[p_lower]] = cleaned
            elif p_lower in existing:
                del existing[p_lower]
                os.environ.pop(PROVIDER_KEY_ENV[p_lower], None)

    KEYS_PATH.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    try:
        os.chmod(KEYS_PATH, 0o600)
    except Exception:
        pass


def get_api_key(provider: str) -> str | None:
    """Return the API key for a provider, or None if not set."""
    p_lower = provider.lower()
    env_var = PROVIDER_KEY_ENV.get(p_lower)
    if env_var is None:
        return None
    val = os.environ.get(env_var)
    if val:
        return val
    stored = load_stored_keys()
    key = stored.get(p_lower)
    if key:
        os.environ[env_var] = key
        return key
    return None


def complete(
    member: Member,
    system_prompt: str,
    user_prompt: str,
    words: int = 120,
    on_token: Callable[[str], None] | None = None,
) -> CompleteResult:
    """
    Call the appropriate provider and return a CompleteResult.
    If on_token is provided, streams tokens as they arrive.
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

    return _with_retry(
        fn,
        api_key=api_key,
        model=member.model,
        system=system_prompt,
        user=user_prompt,
        words=words,
        on_token=on_token,
    )


# ── Provider implementations ─────────────────────────────────────────────


def _call_anthropic(
    api_key: str,
    model: str,
    system: str,
    user: str,
    words: int,
    on_token: Callable[[str], None] | None = None,
) -> CompleteResult:
    max_tokens = words * 2

    if on_token is None:
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
        text = "".join(text_parts)
        usage = data.get("usage", {})
        return CompleteResult(
            text=text,
            input_tokens=usage.get("input_tokens", max(1, int(len(f"{system} {user}".split()) * 1.3))),
            output_tokens=usage.get("output_tokens", max(1, int(len(text.split()) * 1.3))),
            is_estimated="input_tokens" not in usage,
        )

    collected: list[str] = []
    input_tokens = 0
    output_tokens = 0
    got_usage = False

    with httpx.stream(
        "POST",
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": max_tokens,
            "stream": True,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        },
        timeout=httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=10.0),
    ) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines():
            if line.startswith("data: "):
                payload = line[6:].strip()
                if not payload:
                    continue
                try:
                    data = json.loads(payload)
                except json.JSONDecodeError:
                    continue
                event_type = data.get("type")
                if event_type == "message_start":
                    input_tokens = data.get("message", {}).get("usage", {}).get("input_tokens", 0)
                    if input_tokens > 0:
                        got_usage = True
                elif event_type == "content_block_delta":
                    delta = data.get("delta", {})
                    token = delta.get("text", "")
                    if token:
                        on_token(token)
                        collected.append(token)
                elif event_type == "message_delta":
                    output_tokens = data.get("usage", {}).get("output_tokens", 0)
                    if output_tokens > 0:
                        got_usage = True

    text = "".join(collected)
    if not got_usage:
        input_tokens = max(1, int(len(f"{system} {user}".split()) * 1.3))
        output_tokens = max(1, int(len(text.split()) * 1.3))

    return CompleteResult(
        text=text,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        is_estimated=not got_usage,
    )


def _call_openai(
    api_key: str,
    model: str,
    system: str,
    user: str,
    words: int,
    on_token: Callable[[str], None] | None = None,
) -> CompleteResult:
    max_tokens = words * 2

    if on_token is None:
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
        data = resp.json()
        choices = data.get("choices", [])
        if not choices or "message" not in choices[0]:
            raise ProviderError(f"OpenAI returned no choices: {resp.text[:200]}")
        content = choices[0]["message"].get("content")
        if content is None:
            raise ProviderError(f"OpenAI returned null content: {choices[0]}")
        usage = data.get("usage", {})
        return CompleteResult(
            text=content,
            input_tokens=usage.get("prompt_tokens", max(1, int(len(f"{system} {user}".split()) * 1.3))),
            output_tokens=usage.get("completion_tokens", max(1, int(len(content.split()) * 1.3))),
            is_estimated="prompt_tokens" not in usage,
        )

    collected: list[str] = []
    input_tokens = 0
    output_tokens = 0
    got_usage = False

    with httpx.stream(
        "POST",
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "max_completion_tokens": max_tokens,
            "stream": True,
            "stream_options": {"include_usage": True},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=10.0),
    ) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines():
            if line.startswith("data: "):
                payload = line[6:].strip()
                if payload == "[DONE]":
                    break
                if not payload:
                    continue
                try:
                    data = json.loads(payload)
                except json.JSONDecodeError:
                    continue
                choices = data.get("choices", [])
                if choices:
                    token = choices[0].get("delta", {}).get("content", "")
                    if token:
                        on_token(token)
                        collected.append(token)
                usage = data.get("usage")
                if usage:
                    input_tokens = usage.get("prompt_tokens", 0)
                    output_tokens = usage.get("completion_tokens", 0)
                    got_usage = True

    text = "".join(collected)
    if not got_usage:
        input_tokens = max(1, int(len(f"{system} {user}".split()) * 1.3))
        output_tokens = max(1, int(len(text.split()) * 1.3))

    return CompleteResult(
        text=text,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        is_estimated=not got_usage,
    )


def _call_gemini(
    api_key: str,
    model: str,
    system: str,
    user: str,
    words: int,
    on_token: Callable[[str], None] | None = None,
) -> CompleteResult:
    max_tokens = words * 2 * 4

    if on_token is None:
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
        text = "".join(text_parts)
        usage = data.get("usageMetadata", {})
        return CompleteResult(
            text=text,
            input_tokens=usage.get("promptTokenCount", max(1, int(len(f"{system} {user}".split()) * 1.3))),
            output_tokens=usage.get("candidatesTokenCount", max(1, int(len(text.split()) * 1.3))),
            is_estimated="promptTokenCount" not in usage,
        )

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/"
        f"models/{model}:streamGenerateContent?alt=sse"
    )
    collected: list[str] = []
    input_tokens = 0
    output_tokens = 0
    got_usage = False

    with httpx.stream(
        "POST",
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
        timeout=httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=10.0),
    ) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines():
            if line.startswith("data: "):
                payload = line[6:].strip()
                if not payload:
                    continue
                try:
                    data = json.loads(payload)
                except json.JSONDecodeError:
                    continue
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for p in parts:
                        if "text" in p and not p.get("thought", False):
                            token = p["text"]
                            if token:
                                on_token(token)
                                collected.append(token)
                usage = data.get("usageMetadata")
                if usage:
                    input_tokens = usage.get("promptTokenCount", 0)
                    output_tokens = usage.get("candidatesTokenCount", 0)
                    got_usage = True

    text = "".join(collected)
    if not got_usage:
        input_tokens = max(1, int(len(f"{system} {user}".split()) * 1.3))
        output_tokens = max(1, int(len(text.split()) * 1.3))

    return CompleteResult(
        text=text,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        is_estimated=not got_usage,
    )


def _call_openrouter(
    api_key: str,
    model: str,
    system: str,
    user: str,
    words: int,
    on_token: Callable[[str], None] | None = None,
) -> CompleteResult:
    max_tokens = words * 2

    if on_token is None:
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
        data = resp.json()
        choices = data.get("choices", [])
        if not choices or "message" not in choices[0]:
            raise ProviderError(f"OpenRouter returned no choices: {resp.text[:200]}")
        content = choices[0]["message"].get("content")
        if content is None:
            raise ProviderError(f"OpenRouter returned null content: {choices[0]}")
        usage = data.get("usage", {})
        return CompleteResult(
            text=content,
            input_tokens=usage.get("prompt_tokens", max(1, int(len(f"{system} {user}".split()) * 1.3))),
            output_tokens=usage.get("completion_tokens", max(1, int(len(content.split()) * 1.3))),
            is_estimated="prompt_tokens" not in usage,
        )

    collected: list[str] = []
    input_tokens = 0
    output_tokens = 0
    got_usage = False

    with httpx.stream(
        "POST",
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
            "stream": True,
            "stream_options": {"include_usage": True},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=10.0),
    ) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines():
            if line.startswith("data: "):
                payload = line[6:].strip()
                if payload == "[DONE]":
                    break
                if not payload:
                    continue
                try:
                    data = json.loads(payload)
                except json.JSONDecodeError:
                    continue
                choices = data.get("choices", [])
                if choices:
                    token = choices[0].get("delta", {}).get("content", "")
                    if token:
                        on_token(token)
                        collected.append(token)
                usage = data.get("usage")
                if usage:
                    input_tokens = usage.get("prompt_tokens", 0)
                    output_tokens = usage.get("completion_tokens", 0)
                    got_usage = True

    text = "".join(collected)
    if not got_usage:
        input_tokens = max(1, int(len(f"{system} {user}".split()) * 1.3))
        output_tokens = max(1, int(len(text.split()) * 1.3))

    return CompleteResult(
        text=text,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        is_estimated=not got_usage,
    )


# ── Retry logic ───────────────────────────────────────────────────────────


def _with_retry(
    fn,
    api_key: str,
    model: str,
    system: str,
    user: str,
    words: int,
    on_token: Callable[[str], None] | None = None,
) -> CompleteResult:
    """Retry on 429/5xx and network errors up to 2 extra attempts with backoff. No retry on 400/401."""
    last_exc: Exception | None = None
    for attempt in range(len(_BACKOFFS) + 1):
        try:
            return fn(api_key, model, system, user, words, on_token=on_token)
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
