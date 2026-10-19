"""Tests for markdown session persistence with rich formats, tables, and special chars."""

from __future__ import annotations

from pathlib import Path
from council.models import TranscriptEntry
from council.session import load_session, save_session


def test_session_roundtrip_with_code_blocks_and_markdown(tmp_path: Path):
    complex_text = (
        "Here is the proposed Rust code:\n\n"
        "```rust\n"
        "fn main() {\n"
        "    println!(\"Hello, Council!\");\n"
        "}\n"
        "```\n\n"
        "| Feature | Rust | Go |\n"
        "|---|---|---|\n"
        "| Speed | 🚀 Fast | 🏎️ Fast |\n"
        "| Safety | Memory safe | GC overhead |\n"
    )

    transcript = [
        TranscriptEntry(speaker="You", kind="user", text="Compare Rust and Go with a code sample."),
        TranscriptEntry(speaker="Builder", kind="member", text=complex_text),
        TranscriptEntry(speaker="Chair", kind="chair", text="Synthesis with LaTeX: $O(n \\log n)$ complexity."),
    ]

    target = tmp_path / "complex-session.md"
    save_session(transcript, topic="Rust vs Go: Code & Math", optional_path=str(target))

    topic, loaded = load_session(target)
    assert topic == "Rust vs Go: Code & Math"
    assert len(loaded) == 3

    assert "```rust" in loaded[1].text
    assert "println!(\"Hello, Council!\");" in loaded[1].text
    assert "🚀 Fast" in loaded[1].text
    assert "$O(n \\log n)$" in loaded[2].text
