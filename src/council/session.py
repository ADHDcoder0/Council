"""Session persistence — saving and reloading markdown debate sessions."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
import re

from council.models import TranscriptEntry

SESSIONS_DIR = Path.home() / "council-sessions"


def save_session(transcript: list[TranscriptEntry], topic: str = "session", optional_path: str = "") -> Path:
    """
    Save the transcript as a Markdown document to ~/council-sessions/<timestamp>-<topic>.md
    or a designated path.
    """
    SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

    if optional_path:
        save_path = Path(optional_path)
        if not save_path.is_absolute():
            save_path = SESSIONS_DIR / save_path
    else:
        first_user_msg = next((e.text for e in transcript if e.kind == "user"), topic)
        slug = re.sub(r"[^\w\s-]", "", first_user_msg)[:40].strip().replace(" ", "-").lower()
        if not slug:
            slug = "session"
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        save_path = SESSIONS_DIR / f"{timestamp}-{slug}.md"

    lines = [
        f"# Council Debate: {topic}\n",
        f"*Saved on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n---\n",
    ]
    for entry in transcript:
        if entry.kind == "user":
            header = "**You**"
        elif entry.kind == "chair":
            header = f"**👑 {entry.speaker}**"
        else:
            header = f"**{entry.speaker}**"
        lines.append(f"\n{header}:\n\n{entry.text}\n")

    save_path.parent.mkdir(parents=True, exist_ok=True)
    save_path.write_text("\n".join(lines), encoding="utf-8")
    return save_path


def load_session(path: Path) -> tuple[str, list[TranscriptEntry]]:
    """
    Parse a saved Markdown session file back into topic and list of TranscriptEntry objects.
    """
    if not path.exists():
        raise FileNotFoundError(f"Session file not found: {path}")

    text = path.read_text(encoding="utf-8")

    # Extract topic from heading
    topic_match = re.search(r"^# Council Debate:\s*(.+)$", text, re.MULTILINE)
    if not topic_match:
        topic_match = re.search(r"^# (.+)$", text, re.MULTILINE)
    topic = topic_match.group(1).strip() if topic_match else path.stem

    # Extract blocks: **Speaker**: \n\n <content>
    pattern = r"\*\*(?:👑\s*)?([^*]+?)\*\*:\s*\n\n(.*?)(?=\n\n\*\*|\n\n---\n|\Z)"
    matches = re.findall(pattern, text, re.DOTALL)

    transcript: list[TranscriptEntry] = []
    for raw_speaker, raw_text in matches:
        speaker = raw_speaker.strip()
        body = raw_text.strip()
        if not body:
            continue

        if speaker.lower() in ("you", "user"):
            transcript.append(TranscriptEntry(speaker="You", kind="user", text=body))
        elif "chair" in speaker.lower():
            # Could be "Chair" or "👑 Chair"
            clean_name = speaker.replace("👑", "").strip()
            transcript.append(TranscriptEntry(speaker=clean_name, kind="chair", text=body))
        else:
            transcript.append(TranscriptEntry(speaker=speaker, kind="member", text=body))

    return topic, transcript
