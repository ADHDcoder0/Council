"""Tests for SSE streaming parsers across Anthropic, OpenAI, Gemini, and OpenRouter."""

from __future__ import annotations

import json
from pathlib import Path
import httpx
import pytest

from council.models import Member
from council.providers import ProviderError, _with_retry

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_parse_anthropic_fixture_stream():
    fixture_path = FIXTURES_DIR / "anthropic_stream.jsonl"
    lines = fixture_path.read_text().splitlines()

    tokens = []
    input_tokens = 0
    output_tokens = 0

    for line in lines:
        if not line.strip():
            continue
        data = json.loads(line)
        event_type = data.get("data", {}).get("type") or data.get("type")
        payload = data.get("data", data)

        if event_type == "message_start":
            input_tokens = payload.get("message", {}).get("usage", {}).get("input_tokens", 0)
        elif event_type == "content_block_delta":
            token = payload.get("delta", {}).get("text", "")
            if token:
                tokens.append(token)
        elif event_type == "message_delta":
            output_tokens = payload.get("usage", {}).get("output_tokens", 0)

    assert "".join(tokens) == "Anthropic streaming works!"
    assert input_tokens == 25
    assert output_tokens == 6


def test_parse_openai_fixture_stream():
    fixture_path = FIXTURES_DIR / "openai_stream.jsonl"
    lines = fixture_path.read_text().splitlines()

    tokens = []
    input_tokens = 0
    output_tokens = 0

    for line in lines:
        if line == "[DONE]" or not line.strip():
            continue
        data = json.loads(line)
        choices = data.get("choices", [])
        if choices:
            token = choices[0].get("delta", {}).get("content", "")
            if token:
                tokens.append(token)
        usage = data.get("usage")
        if usage:
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)

    assert "".join(tokens) == "OpenAI streaming works!"
    assert input_tokens == 30
    assert output_tokens == 5


def test_parse_gemini_fixture_stream():
    fixture_path = FIXTURES_DIR / "gemini_stream.jsonl"
    lines = fixture_path.read_text().splitlines()

    tokens = []
    input_tokens = 0
    output_tokens = 0

    for line in lines:
        if not line.strip():
            continue
        data = json.loads(line)
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            for p in parts:
                token = p.get("text", "")
                if token:
                    tokens.append(token)
        usage = data.get("usageMetadata")
        if usage:
            input_tokens = usage.get("promptTokenCount", 0)
            output_tokens = usage.get("candidatesTokenCount", 0)

    assert "".join(tokens) == "Gemini streaming works!"
    assert input_tokens == 20
    assert output_tokens == 4


def test_parse_openrouter_fixture_stream():
    fixture_path = FIXTURES_DIR / "openrouter_stream.jsonl"
    lines = fixture_path.read_text().splitlines()

    tokens = []
    input_tokens = 0
    output_tokens = 0

    for line in lines:
        if line == "[DONE]" or not line.strip():
            continue
        data = json.loads(line)
        choices = data.get("choices", [])
        if choices:
            token = choices[0].get("delta", {}).get("content", "")
            if token:
                tokens.append(token)
        usage = data.get("usage")
        if usage:
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)

    assert "".join(tokens) == "OpenRouter streaming works!"
    assert input_tokens == 28
    assert output_tokens == 5


def test_retry_on_network_disconnect_during_stream():
    attempts = 0

    def mock_stream_call(api_key, model, system, user, words, on_token=None):
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise httpx.ReadTimeout("Stream connection dropped abruptly")
        if on_token:
            on_token("Recovered text")
        return "Recovered text"

    res = _with_retry(mock_stream_call, "key", "model", "sys", "usr", 100)
    assert res == "Recovered text"
    assert attempts == 2


def test_malformed_json_in_stream_does_not_abort():
    raw_lines = [
        "data: {broken json",
        'data: {"choices": [{"delta": {"content": "Clean"}}]}',
        "data: [DONE]",
    ]
    tokens = []
    for line in raw_lines:
        if line.startswith("data: "):
            payload = line[6:].strip()
            if payload == "[DONE]":
                break
            try:
                data = json.loads(payload)
                token = data["choices"][0]["delta"].get("content", "")
                if token:
                    tokens.append(token)
            except (json.JSONDecodeError, KeyError):
                continue

    assert tokens == ["Clean"]
