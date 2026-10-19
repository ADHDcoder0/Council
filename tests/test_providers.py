"""Unit tests for provider key management and retry logic."""

from __future__ import annotations

import httpx
import pytest

from council.models import Member
from council.providers import (
    ProviderError,
    _with_retry,
    complete,
    get_api_key,
)


def test_get_api_key_from_env(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-anthropic-key")
    assert get_api_key("anthropic") == "test-anthropic-key"


def test_get_api_key_missing(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    assert get_api_key("openai") is None


def test_get_api_key_unknown_provider():
    assert get_api_key("unknown_provider") is None


def test_unknown_provider_raises_provider_error(monkeypatch):
    monkeypatch.setenv("UNKNOWN_KEY", "abc")
    member = Member("Unknown", "nonexistent_provider", "model-x", "role")
    with pytest.raises(ProviderError, match="No API key found|Unknown provider"):
        complete(member, "sys", "usr")


def test_retry_on_429_eventually_succeeds():
    attempts = 0

    def mock_call(api_key, model, system, user, words, on_token=None):
        nonlocal attempts
        attempts += 1
        if attempts < 2:
            request = httpx.Request("POST", "https://api.test.com")
            response = httpx.Response(429, request=request, text="Rate limit exceeded")
            raise httpx.HTTPStatusError("Rate limited", request=request, response=response)
        return "Success after retry"

    result = _with_retry(mock_call, "key", "model", "sys", "usr", 100)
    assert result == "Success after retry"
    assert attempts == 2


def test_no_retry_on_401():
    attempts = 0

    def mock_call(api_key, model, system, user, words, on_token=None):
        nonlocal attempts
        attempts += 1
        request = httpx.Request("POST", "https://api.test.com")
        response = httpx.Response(401, request=request, text="Unauthorized: invalid key")
        raise httpx.HTTPStatusError("Unauthorized", request=request, response=response)

    with pytest.raises(ProviderError, match="401: Unauthorized"):
        _with_retry(mock_call, "key", "model", "sys", "usr", 100)

    # Must fail immediately without retrying
    assert attempts == 1
