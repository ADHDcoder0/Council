# Phase 0: Architecture & Provider Audit

This audit document records the baseline state of Council CLI before the Web UI integration, verifying API contracts, token usage extraction pathways, and concurrency characteristics.

---

## 1. Exact Function Signatures

### Core Models (`models.py`)
- `Member(name: str, provider: str, model: str, role: str, chair: bool = False, muted: bool = False)`
- `TranscriptEntry(speaker: str, kind: str, text: str)`
- `CouncilConfig(words: int = 120, window: int = 40, rounds: int = 1, rules: str = ..., members: list[Member] = ...)`

### Provider Layer (`providers.py`)
- `complete(member: Member, system_prompt: str, user_prompt: str, words: int = 120, on_token: Callable[[str], None] | None = None) -> str`
- `get_api_key(provider: str) -> str | None`
- `PROVIDER_KEY_ENV: dict[str, str]`
- Internal dispatchers:
  - `_call_anthropic(api_key, model, system, user, words, on_token=None) -> str`
  - `_call_openai(api_key, model, system, user, words, on_token=None) -> str`
  - `_call_gemini(api_key, model, system, user, words, on_token=None) -> str`
  - `_call_openrouter(api_key, model, system, user, words, on_token=None) -> str`
- Retry handler:
  - `_with_retry(fn, api_key, model, system, user, words, on_token=None) -> str`

### Debate Engine (`engine.py`)
- `Engine(config: CouncilConfig)`
- `Engine.add_user_message(text: str) -> None`
- `Engine.active_members() -> list[Member]`
- `Engine.chair() -> Member | None`
- `Engine.build_system_prompt(member: Member) -> str`
- `Engine.build_user_prompt(member: Member) -> str`
- `Engine.record_cost(member: Member, system: str, user: str, output: str) -> None`
- `Engine.run_round(on_start=None, on_result=None, on_error=None) -> None`
- `Engine.run_chair(on_start=None, on_result=None, on_error=None) -> None`

### Session & Configuration
- `session.save_session(transcript, topic="session", optional_path="") -> Path`
- `session.load_session(path: Path) -> tuple[str, list[TranscriptEntry]]`
- `config.load_config() -> CouncilConfig`
- `config.save_config(config: CouncilConfig, path: Path = CONFIG_PATH) -> None`
- `config.run_wizard() -> CouncilConfig`

---

## 2. Provider Token Usage Analysis

Currently, `complete()` returns raw `str`. Real token metadata is available from all 4 providers:

| Provider | Non-Streaming Usage Location | Streaming SSE Event & Key |
|---|---|---|
| **Anthropic** | `resp.json()["usage"]`: `input_tokens`, `output_tokens` | Event `message_start` has `message.usage.input_tokens`. Event `message_delta` has `usage.output_tokens`. |
| **OpenAI** | `resp.json()["usage"]`: `prompt_tokens`, `completion_tokens` | Request must send `"stream_options": {"include_usage": True}`. Final chunk before `[DONE]` includes `usage` object. |
| **Gemini** | `resp.json()["usageMetadata"]`: `promptTokenCount`, `candidatesTokenCount` | Final candidate chunk contains `usageMetadata: {"promptTokenCount": ..., "candidatesTokenCount": ...}`. |
| **OpenRouter** | Same as OpenAI | Same as OpenAI (`stream_options: {"include_usage": True}`). |

**Refactor Decision:**
Introduce `CompleteResult(text: str, input_tokens: int, output_tokens: int, is_estimated: bool)`.
When usage is returned by the provider, `is_estimated = False`. If usage metadata is absent, calculate via `TOKENS_PER_WORD = 1.3` and set `is_estimated = True`.

---

## 3. Global State & Concurrency Audit

- **Transcripts:** Stored per `Engine` instance. No module-level transcript.
- **Config:** Loaded on demand or passed explicitly.
- **Cost Tracking:** Stored per `Engine.cost_tracker` instance.
- **Render Color Map:** `_color_map` in `render.py` is the only global dictionary; it only affects CLI ANSI color assignments and has no side effects on web or engine logic.

**Conclusion:** The backend is fully re-entrant and ready to manage multiple concurrent session instances in a single FastAPI process via a session dictionary (`dict[str, SessionState]`).
