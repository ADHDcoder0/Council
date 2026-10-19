"""Tests for the Council Web UI REST and SSE endpoints."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
import pytest

from council.models import CompleteResult, CouncilConfig, Member, TranscriptEntry
from council.providers import ProviderError
from council.web.app import app
import council.web.routes as web_routes

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_sessions():
    """Reset in-memory session stores between tests."""
    web_routes.sessions.clear()
    web_routes.engines.clear()
    yield
    web_routes.sessions.clear()
    web_routes.engines.clear()


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_config_endpoints(tmp_path, monkeypatch):
    test_config_path = tmp_path / "config.toml"
    monkeypatch.setattr("council.config.CONFIG_PATH", test_config_path)
    monkeypatch.setattr("council.web.routes.CONFIG_PATH", test_config_path)

    # Mock load_config to return default
    res = client.get("/api/config")
    assert res.status_code == 200
    data = res.json()
    assert "settings" in data
    assert "members" in data
    assert len(data["members"]) > 0

    # Update config
    update_payload = {
        "council": {
            "words": 140,
            "window": 25,
            "rounds": 2,
            "rules": "Be concise and sharp.",
        },
        "members": [
            {
                "name": "CustomAlice",
                "provider": "anthropic",
                "model": "claude-sonnet-5-5",
                "role": "Logician",
                "chair": False,
                "muted": False,
            },
            {
                "name": "CustomBob",
                "provider": "openai",
                "model": "gpt-4o",
                "role": "Moderator",
                "chair": True,
                "muted": False,
            },
        ],
    }
    res2 = client.post("/api/config", json=update_payload)
    assert res2.status_code == 200
    assert res2.json()["status"] == "saved"

    # Verify file saved
    assert test_config_path.exists()


def test_prices_endpoints(tmp_path, monkeypatch):
    test_prices_path = tmp_path / "prices.toml"
    monkeypatch.setattr("council.costs.PRICES_PATH", test_prices_path)

    res = client.get("/api/prices")
    assert res.status_code == 200
    prices = res.json()
    assert "gpt-4o" in prices

    # Update prices
    update_payload = {
        "gpt-4o": [2.00, 8.00],
        "custom-model": [1.00, 4.00],
    }
    res2 = client.post("/api/prices", json=update_payload)
    assert res2.status_code == 200

    # Verify updated
    res3 = client.get("/api/prices")
    assert res3.json()["custom-model"] == [1.00, 4.00]


def test_session_lifecycle():
    # 1. Create session
    payload = {
        "topic": "Should AI regulate itself?",
        "words": 100,
        "rounds": 1,
        "members": [
            {
                "name": "Alice",
                "provider": "anthropic",
                "model": "claude-sonnet-5-5",
                "role": "Pro-regulation",
                "is_chair": False,
                "is_muted": False,
            },
            {
                "name": "Bob",
                "provider": "openai",
                "model": "gpt-4o",
                "role": "Anti-regulation",
                "is_chair": False,
                "is_muted": False,
            },
            {
                "name": "Chair",
                "provider": "gemini",
                "model": "gemini-2.5-flash",
                "role": "Impartial summary",
                "is_chair": True,
                "is_muted": False,
            },
        ],
    }
    res = client.post("/api/sessions", json=payload)
    assert res.status_code == 200
    session_data = res.json()
    session_id = session_data["session_id"]
    assert session_data["topic"] == "Should AI regulate itself?"
    assert len(session_data["members"]) == 3
    assert len(session_data["transcript"]) == 1
    assert session_data["transcript"][0]["speaker"] == "You"
    assert session_data["transcript"][0]["text"] == "Should AI regulate itself?"

    # 2. Get session
    res_get = client.get(f"/api/sessions/{session_id}")
    assert res_get.status_code == 200
    assert res_get.json()["session_id"] == session_id

    # 3. List sessions
    res_list = client.get("/api/sessions")
    assert res_list.status_code == 200
    sessions_list = res_list.json()
    assert len(sessions_list) == 1
    assert sessions_list[0]["session_id"] == session_id

    # 4. Add message
    msg_payload = {"speaker": "User", "text": "What about open source models?"}
    res_msg = client.post(f"/api/sessions/{session_id}/messages", json=msg_payload)
    assert res_msg.status_code == 200
    assert len(res_msg.json()["transcript"]) == 2

    # 5. Patch member (mute Alice, change role)
    res_patch = client.patch(
        f"/api/sessions/{session_id}/members/Alice",
        json={"is_muted": True, "role": "Updated Role"},
    )
    assert res_patch.status_code == 200
    patched_member = res_patch.json()
    assert patched_member["is_muted"] is True
    assert patched_member["role"] == "Updated Role"


def test_rounds_sse_stream():
    payload = {
        "topic": "Monoliths vs Microservices",
        "words": 50,
        "rounds": 1,
        "members": [
            {
                "name": "Alice",
                "provider": "anthropic",
                "model": "claude-sonnet-5-5",
                "role": "Advocates monoliths",
                "is_chair": False,
                "is_muted": False,
            },
            {
                "name": "Bob",
                "provider": "openai",
                "model": "gpt-4o",
                "role": "Advocates microservices",
                "is_chair": False,
                "is_muted": False,
            },
        ],
    }
    create_res = client.post("/api/sessions", json=payload)
    session_id = create_res.json()["session_id"]

    def mock_complete(member, system, user, words, on_token=None):
        if on_token:
            on_token("Hello ")
            on_token("world!")
        return CompleteResult(
            text="Hello world!",
            input_tokens=50,
            output_tokens=2,
            is_estimated=False,
        )

    with patch("council.providers.complete", side_effect=mock_complete):
        res = client.post(
            f"/api/sessions/{session_id}/rounds",
            json={"rounds": 1},
        )
        assert res.status_code == 200
        assert "text/event-stream" in res.headers["content-type"]

        content = res.text
        lines = content.strip().split("\n\n")
        events = []
        for block in lines:
            if not block.strip():
                continue
            ev_line = ""
            data_line = ""
            for l in block.split("\n"):
                if l.startswith("event: "):
                    ev_line = l[7:]
                elif l.startswith("data: "):
                    data_line = l[6:]
            if ev_line:
                events.append((ev_line, json.loads(data_line)))

        event_names = [e[0] for e in events]
        assert "member_start" in event_names
        assert "token" in event_names
        assert "turn_end" in event_names
        assert "round_end" in event_names
        assert "session_done" in event_names

        # Check transcript accumulated in session
        res_get = client.get(f"/api/sessions/{session_id}")
        assert len(res_get.json()["transcript"]) == 3  # You + Alice + Bob


def test_member_error_continues_round():
    payload = {
        "topic": "Error Handling Debate",
        "words": 50,
        "rounds": 1,
        "members": [
            {
                "name": "FailingMember",
                "provider": "anthropic",
                "model": "claude-sonnet-5-5",
                "role": "Throws error",
                "is_chair": False,
                "is_muted": False,
            },
            {
                "name": "WorkingMember",
                "provider": "openai",
                "model": "gpt-4o",
                "role": "Succeeds",
                "is_chair": False,
                "is_muted": False,
            },
        ],
    }
    create_res = client.post("/api/sessions", json=payload)
    session_id = create_res.json()["session_id"]

    def mock_complete(member, system, user, words, on_token=None):
        if member.name == "FailingMember":
            raise ProviderError("Rate limit exceeded 429")
        if on_token:
            on_token("Working fine!")
        return CompleteResult(
            text="Working fine!",
            input_tokens=30,
            output_tokens=3,
            is_estimated=False,
        )

    with patch("council.providers.complete", side_effect=mock_complete):
        res = client.post(
            f"/api/sessions/{session_id}/rounds",
            json={"rounds": 1},
        )
        assert res.status_code == 200
        content = res.text
        assert "event: member_error" in content
        assert "Rate limit exceeded 429" in content
        assert "event: turn_end" in content
        assert "Working fine!" in content


def test_summary_sse_stream():
    payload = {
        "topic": "Summary Test",
        "words": 50,
        "rounds": 1,
        "members": [
            {
                "name": "Chair",
                "provider": "anthropic",
                "model": "claude-sonnet-5-5",
                "role": "Chair",
                "is_chair": True,
                "is_muted": False,
            },
        ],
    }
    create_res = client.post("/api/sessions", json=payload)
    session_id = create_res.json()["session_id"]

    def mock_complete(member, system, user, words, on_token=None):
        if on_token:
            on_token("Final verdict: ")
            on_token("Consensus reached.")
        return CompleteResult(
            text="Final verdict: Consensus reached.",
            input_tokens=40,
            output_tokens=5,
            is_estimated=False,
        )

    with patch("council.providers.complete", side_effect=mock_complete):
        res = client.post(f"/api/sessions/{session_id}/summary", json={})
        assert res.status_code == 200
        content = res.text
        assert "event: chair_start" in content
        assert "event: summary_done" in content
        assert "Consensus reached" in content


def test_save_and_history_and_resume(tmp_path, monkeypatch):
    monkeypatch.setattr("council.session.SESSIONS_DIR", tmp_path)
    monkeypatch.setattr("council.web.routes.SESSIONS_DIR", tmp_path)

    # Create session
    payload = {
        "topic": "Future of Rust and C++",
        "words": 50,
        "rounds": 1,
        "members": [],
    }
    create_res = client.post("/api/sessions", json=payload)
    session_id = create_res.json()["session_id"]

    # Save session
    save_res = client.post(f"/api/sessions/{session_id}/save", json={})
    assert save_res.status_code == 200
    filepath = save_res.json()["filepath"]
    assert Path(filepath).exists()

    # List history
    hist_res = client.get("/api/history")
    assert hist_res.status_code == 200
    items = hist_res.json()
    assert len(items) == 1
    assert "Future of Rust and C++" in items[0]["topic"]

    # Resume session
    resume_res = client.post("/api/sessions/resume", json={"filepath": filepath})
    assert resume_res.status_code == 200
    assert resume_res.json()["topic"] == "Future of Rust and C++"
    assert len(resume_res.json()["transcript"]) == 1


def test_export_endpoints():
    payload = {
        "topic": "Export Test",
        "words": 50,
        "rounds": 1,
        "members": [],
    }
    create_res = client.post("/api/sessions", json=payload)
    session_id = create_res.json()["session_id"]

    # Export markdown
    res_md = client.get(f"/api/sessions/{session_id}/export?format=markdown")
    assert res_md.status_code == 200
    assert "text/markdown" in res_md.headers["content-type"]
    assert "# Council Debate: Export Test" in res_md.text

    # Export json
    res_json = client.get(f"/api/sessions/{session_id}/export?format=json")
    assert res_json.status_code == 200
    assert "application/json" in res_json.headers["content-type"]
    data = res_json.json()
    assert data["session_id"] == session_id
    assert data["topic"] == "Export Test"


def test_404_not_found():
    res = client.get("/api/sessions/nonexistent_id")
    assert res.status_code == 404

    res2 = client.patch(
        "/api/sessions/nonexistent_id/members/Nobody",
        json={"is_muted": True},
    )
    assert res2.status_code == 404


def test_spa_static_serving():
    res = client.get("/")
    assert res.status_code == 200
    assert "Council" in res.text
