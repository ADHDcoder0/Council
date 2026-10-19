"""Unit tests for Markdown session persistence."""

from __future__ import annotations

from pathlib import Path
from council.models import TranscriptEntry
from council.session import load_session, save_session


def test_session_save_and_load_roundtrip(tmp_path: Path):
    transcript = [
        TranscriptEntry(speaker="You", kind="user", text="Should we rewrite in Rust?"),
        TranscriptEntry(speaker="Skeptic", kind="member", text="The rewrite cost is high."),
        TranscriptEntry(speaker="Builder", kind="member", text="Start with critical hotspots."),
        TranscriptEntry(speaker="Chair", kind="chair", text="Recommendation: profile first."),
    ]

    target_file = tmp_path / "test-session.md"
    saved_path = save_session(transcript, topic="Rust Rewrite Debate", optional_path=str(target_file))

    assert saved_path.exists()

    topic, loaded_transcript = load_session(saved_path)

    assert topic == "Rust Rewrite Debate"
    assert len(loaded_transcript) == 4

    assert loaded_transcript[0].speaker == "You"
    assert loaded_transcript[0].kind == "user"
    assert loaded_transcript[0].text == "Should we rewrite in Rust?"

    assert loaded_transcript[1].speaker == "Skeptic"
    assert loaded_transcript[1].kind == "member"

    assert loaded_transcript[3].speaker == "Chair"
    assert loaded_transcript[3].kind == "chair"
    assert "Recommendation" in loaded_transcript[3].text
