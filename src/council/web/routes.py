"""FastAPI router for Council Web UI."""

from __future__ import annotations

import asyncio
from datetime import datetime
import json
from pathlib import Path
import threading
import uuid

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import JSONResponse, StreamingResponse

from council.config import (
    CONFIG_PATH,
    DEFAULT_MEMBERS,
    load_config,
    parse_config_file,
    save_config,
)
from council.costs import (
    load_price_table,
    save_price_table,
)
from council.engine import Engine
from council.models import CouncilConfig, Member, SessionState, TranscriptEntry
from council.moderator import pick_next_speaker
from council import providers
from council.session import SESSIONS_DIR, load_session, save_session
from council.web.schemas import (
    AddMessageRequest,
    ConfigResponse,
    ConfigUpdateRequest,
    CreateSessionRequest,
    MemberInfo,
    MemberUpdateRequest,
    ResumeSessionRequest,
    RunRoundRequest,
    RunSummaryRequest,
    SavedSessionItem,
    SaveSessionRequest,
    SessionResponse,
    TranscriptEntrySchema,
)

router = APIRouter(prefix="/api")

# In-memory session store
sessions: dict[str, SessionState] = {}
engines: dict[str, Engine] = {}


def _get_engine_and_session(session_id: str) -> tuple[Engine, SessionState]:
    if session_id not in sessions or session_id not in engines:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return engines[session_id], sessions[session_id]


def _to_session_response(session: SessionState, engine: Engine) -> SessionResponse:
    members = [
        MemberInfo(
            name=m.name,
            provider=m.provider,
            model=m.model,
            role=m.role,
            is_chair=m.chair,
            is_muted=m.muted,
        )
        for m in engine.config.members
    ]
    transcript = [
        TranscriptEntrySchema(
            round=getattr(e, "round", 0),
            speaker=e.speaker,
            text=e.text,
            is_chair=(e.kind == "chair"),
        )
        for e in engine.transcript
    ]
    return SessionResponse(
        session_id=session.session_id,
        topic=session.topic,
        words=engine.config.words,
        members=members,
        transcript=transcript,
        total_input_tokens=engine.cost_tracker.total_input_tokens,
        total_output_tokens=engine.cost_tracker.total_output_tokens,
        total_cost_usd=round(engine.cost_tracker.total_cost_usd, 6),
        is_cost_estimated=engine.cost_tracker.has_estimated,
    )


# ── Health & Config ─────────────────────────────────────────────────────────


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/config")
def get_config() -> dict:
    cfg = load_config()
    return {
        "settings": {
            "words": cfg.words,
            "window": cfg.window,
            "rounds": cfg.rounds,
            "rules": cfg.rules,
        },
        "members": [
            {
                "name": m.name,
                "provider": m.provider,
                "model": m.model,
                "role": m.role,
                "chair": m.chair,
                "muted": m.muted,
            }
            for m in cfg.members
        ],
    }


@router.post("/config")
def update_config(payload: ConfigUpdateRequest) -> dict:
    settings = payload.council
    members_data = payload.members
    members = [
        Member(
            name=m["name"],
            provider=m["provider"],
            model=m["model"],
            role=m.get("role", "Debater"),
            chair=m.get("chair", False),
            muted=m.get("muted", False),
        )
        for m in members_data
    ]
    new_cfg = CouncilConfig(
        words=int(settings.get("words", 120)),
        window=int(settings.get("window", 40)),
        rounds=int(settings.get("rounds", 1)),
        rules=str(settings.get("rules", "")),
        members=members,
    )
    save_config(new_cfg, CONFIG_PATH)
    return {"status": "saved", "path": str(CONFIG_PATH)}


# ── Pricing Table ──────────────────────────────────────────────────────────


@router.get("/prices")
def get_prices() -> dict[str, list[float]]:
    table = load_price_table()
    return {k: [v[0], v[1]] for k, v in table.items()}


@router.post("/prices")
def update_prices(payload: dict[str, list[float]]) -> dict[str, str]:
    converted: dict[str, tuple[float, float]] = {}
    for k, v in payload.items():
        if len(v) >= 2:
            converted[k] = (float(v[0]), float(v[1]))
    save_price_table(converted)
    return {"status": "saved"}


# ── Sessions ────────────────────────────────────────────────────────────────


@router.post("/sessions", response_model=SessionResponse)
def create_session(req: CreateSessionRequest) -> SessionResponse:
    session_id = uuid.uuid4().hex[:8]
    cfg = load_config()

    if req.words:
        cfg.words = req.words
    if req.rounds:
        cfg.rounds = req.rounds
    if req.members:
        cfg.members = [
            Member(
                name=m.name,
                provider=m.provider,
                model=m.model,
                role=m.role,
                chair=m.is_chair,
                muted=m.is_muted,
            )
            for m in req.members
        ]

    engine = Engine(cfg)
    if req.topic.strip():
        engine.add_user_message(req.topic.strip())

    session = SessionState(
        session_id=session_id,
        topic=req.topic.strip(),
        config=cfg,
        transcript=engine.transcript,
    )

    sessions[session_id] = session
    engines[session_id] = engine

    return _to_session_response(session, engine)


@router.get("/sessions")
def list_sessions() -> list[dict]:
    res = []
    for sid, s in sessions.items():
        eng = engines.get(sid)
        cost = eng.cost_tracker.total_cost_usd if eng else 0.0
        res.append({
            "session_id": sid,
            "topic": s.topic,
            "message_count": len(s.transcript),
            "total_cost_usd": round(cost, 6),
        })
    return res


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(session_id: str) -> SessionResponse:
    engine, session = _get_engine_and_session(session_id)
    return _to_session_response(session, engine)


@router.post("/sessions/{session_id}/messages", response_model=SessionResponse)
def add_message(session_id: str, req: AddMessageRequest) -> SessionResponse:
    engine, session = _get_engine_and_session(session_id)
    kind = "chair" if req.is_chair else ("user" if req.speaker.lower() in ("you", "user") else "member")
    entry = TranscriptEntry(speaker=req.speaker, kind=kind, text=req.text)
    engine.transcript.append(entry)
    session.transcript = engine.transcript
    return _to_session_response(session, engine)


@router.patch("/sessions/{session_id}/members/{name}", response_model=MemberInfo)
def update_member(session_id: str, name: str, req: MemberUpdateRequest) -> MemberInfo:
    engine, _ = _get_engine_and_session(session_id)
    target: Member | None = None
    for m in engine.config.members:
        if m.name.lower() == name.lower():
            target = m
            break
    if not target:
        raise HTTPException(status_code=404, detail=f"Member '{name}' not found")

    if req.model is not None:
        target.model = req.model
    if req.role is not None:
        target.role = req.role
    if req.is_chair is not None:
        target.chair = req.is_chair
    if req.is_muted is not None:
        target.muted = req.is_muted

    return MemberInfo(
        name=target.name,
        provider=target.provider,
        model=target.model,
        role=target.role,
        is_chair=target.chair,
        is_muted=target.muted,
    )


# ── SSE Streaming Endpoints ────────────────────────────────────────────────


@router.post("/sessions/{session_id}/rounds")
async def run_rounds_stream(session_id: str, req: RunRoundRequest):
    engine, session = _get_engine_and_session(session_id)
    rounds_to_run = req.rounds or engine.config.rounds
    words_per_turn = req.words or engine.config.words

    loop = asyncio.get_running_loop()
    q: asyncio.Queue = asyncio.Queue()

    def run_sync():
        try:
            for r in range(1, rounds_to_run + 1):
                active = engine.active_members()
                for member in active:
                    loop.call_soon_threadsafe(
                        q.put_nowait,
                        {
                            "event": "member_start",
                            "data": {
                                "member": member.name,
                                "provider": member.provider,
                                "model": member.model,
                                "round": r,
                            },
                        },
                    )

                    system = engine.build_system_prompt(member)
                    user = engine.build_user_prompt(member)

                    def on_token(tok: str):
                        loop.call_soon_threadsafe(
                            q.put_nowait,
                            {
                                "event": "token",
                                "data": {"member": member.name, "token": tok},
                            },
                        )

                    try:
                        res = providers.complete(
                            member,
                            system,
                            user,
                            words_per_turn,
                            on_token=on_token,
                        )
                        engine.record_cost(member, system, user, res)
                        text = str(res)
                        entry = TranscriptEntry(
                            speaker=member.name,
                            kind="member",
                            text=text,
                        )
                        setattr(entry, "round", r)
                        engine.transcript.append(entry)
                        session.transcript = engine.transcript

                        loop.call_soon_threadsafe(
                            q.put_nowait,
                            {
                                "event": "turn_end",
                                "data": {
                                    "member": member.name,
                                    "speaker": member.name,
                                    "kind": "member",
                                    "text": text,
                                    "input_tokens": res.input_tokens,
                                    "output_tokens": res.output_tokens,
                                    "is_estimated": res.is_estimated,
                                    "round": r,
                                },
                            },
                        )
                    except Exception as exc:
                        loop.call_soon_threadsafe(
                            q.put_nowait,
                            {
                                "event": "member_error",
                                "data": {
                                    "member": member.name,
                                    "error": str(exc),
                                },
                            },
                        )

                loop.call_soon_threadsafe(
                    q.put_nowait,
                    {
                        "event": "round_end",
                        "data": {
                            "round": r,
                            "total_cost_usd": round(engine.cost_tracker.total_cost_usd, 6),
                            "total_input_tokens": engine.cost_tracker.total_input_tokens,
                            "total_output_tokens": engine.cost_tracker.total_output_tokens,
                            "is_estimated": engine.cost_tracker.has_estimated,
                        },
                    },
                )

            loop.call_soon_threadsafe(
                q.put_nowait,
                {
                    "event": "session_done",
                    "data": {
                        "session_id": session_id,
                        "total_cost_usd": round(engine.cost_tracker.total_cost_usd, 6),
                    },
                },
            )
        finally:
            loop.call_soon_threadsafe(q.put_nowait, None)

    thread = threading.Thread(target=run_sync, daemon=True)
    thread.start()

    async def event_generator():
        while True:
            item = await q.get()
            if item is None:
                break
            yield f"event: {item['event']}\ndata: {json.dumps(item['data'])}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/sessions/{session_id}/summary")
async def run_summary_stream(session_id: str, req: RunSummaryRequest):
    engine, session = _get_engine_and_session(session_id)
    chair = engine.chair()
    if not chair:
        raise HTTPException(status_code=400, detail="No chair member configured")

    words_per_turn = req.words or engine.config.words
    loop = asyncio.get_running_loop()
    q: asyncio.Queue = asyncio.Queue()

    def run_sync():
        try:
            loop.call_soon_threadsafe(
                q.put_nowait,
                {
                    "event": "chair_start",
                    "data": {
                        "member": chair.name,
                        "provider": chair.provider,
                        "model": chair.model,
                    },
                },
            )

            system = engine.build_system_prompt(chair)
            user = engine.build_user_prompt(chair)

            def on_token(tok: str):
                loop.call_soon_threadsafe(
                    q.put_nowait,
                    {
                        "event": "token",
                        "data": {"member": chair.name, "token": tok},
                    },
                )

            try:
                res = providers.complete(
                    chair,
                    system,
                    user,
                    words_per_turn,
                    on_token=on_token,
                )
                engine.record_cost(chair, system, user, res)
                text = str(res)
                entry = TranscriptEntry(
                    speaker=chair.name,
                    kind="chair",
                    text=text,
                )
                engine.transcript.append(entry)
                session.transcript = engine.transcript

                loop.call_soon_threadsafe(
                    q.put_nowait,
                    {
                        "event": "summary_done",
                        "data": {
                            "speaker": chair.name,
                            "text": text,
                            "input_tokens": res.input_tokens,
                            "output_tokens": res.output_tokens,
                            "total_cost_usd": round(engine.cost_tracker.total_cost_usd, 6),
                            "is_estimated": res.is_estimated,
                        },
                    },
                )
            except Exception as exc:
                loop.call_soon_threadsafe(
                    q.put_nowait,
                    {
                        "event": "chair_error",
                        "data": {"member": chair.name, "error": str(exc)},
                    },
                )
        finally:
            loop.call_soon_threadsafe(q.put_nowait, None)

    thread = threading.Thread(target=run_sync, daemon=True)
    thread.start()

    async def event_generator():
        while True:
            item = await q.get()
            if item is None:
                break
            yield f"event: {item['event']}\ndata: {json.dumps(item['data'])}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/sessions/{session_id}/moderator")
async def run_moderator_stream(session_id: str):
    """Run one turn directed by the moderator LLM, or signal DONE."""
    engine, session = _get_engine_and_session(session_id)
    active = engine.active_members()
    if not active:
        raise HTTPException(status_code=400, detail="No active members available")

    # Pick a moderator member (chair or first active member)
    moderator_member = engine.chair() or active[0]

    loop = asyncio.get_running_loop()
    q: asyncio.Queue = asyncio.Queue()

    def run_sync():
        try:
            picked_name = pick_next_speaker(engine, active, moderator_member)
            if not picked_name:
                loop.call_soon_threadsafe(
                    q.put_nowait,
                    {
                        "event": "moderator_done",
                        "data": {
                            "message": "Moderator signaled discussion is complete (DONE)",
                            "total_cost_usd": round(engine.cost_tracker.total_cost_usd, 6),
                        },
                    },
                )
                return

            chosen = next((m for m in active if m.name == picked_name), active[0])
            loop.call_soon_threadsafe(
                q.put_nowait,
                {
                    "event": "moderator_pick",
                    "data": {
                        "picked": chosen.name,
                        "provider": chosen.provider,
                        "model": chosen.model,
                    },
                },
            )

            system = engine.build_system_prompt(chosen)
            user = engine.build_user_prompt(chosen)

            def on_token(tok: str):
                loop.call_soon_threadsafe(
                    q.put_nowait,
                    {
                        "event": "token",
                        "data": {"member": chosen.name, "token": tok},
                    },
                )

            try:
                res = providers.complete(
                    chosen,
                    system,
                    user,
                    engine.config.words,
                    on_token=on_token,
                )
                engine.record_cost(chosen, system, user, res)
                text = str(res)
                entry = TranscriptEntry(
                    speaker=chosen.name,
                    kind="member",
                    text=text,
                )
                engine.transcript.append(entry)
                session.transcript = engine.transcript

                loop.call_soon_threadsafe(
                    q.put_nowait,
                    {
                        "event": "turn_end",
                        "data": {
                            "member": chosen.name,
                            "speaker": chosen.name,
                            "kind": "member",
                            "text": text,
                            "input_tokens": res.input_tokens,
                            "output_tokens": res.output_tokens,
                            "total_cost_usd": round(engine.cost_tracker.total_cost_usd, 6),
                            "is_estimated": res.is_estimated,
                        },
                    },
                )
            except Exception as exc:
                loop.call_soon_threadsafe(
                    q.put_nowait,
                    {
                        "event": "member_error",
                        "data": {"member": chosen.name, "error": str(exc)},
                    },
                )
        finally:
            loop.call_soon_threadsafe(q.put_nowait, None)

    thread = threading.Thread(target=run_sync, daemon=True)
    thread.start()

    async def event_generator():
        while True:
            item = await q.get()
            if item is None:
                break
            yield f"event: {item['event']}\ndata: {json.dumps(item['data'])}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── Save, Resume & Export ──────────────────────────────────────────────────


@router.post("/sessions/{session_id}/save")
def save_active_session(session_id: str, req: SaveSessionRequest) -> dict[str, str]:
    engine, session = _get_engine_and_session(session_id)
    saved_path = save_session(
        transcript=engine.transcript,
        topic=session.topic or "session",
        optional_path=req.custom_filename or "",
    )
    return {
        "filename": saved_path.name,
        "filepath": str(saved_path),
        "status": "saved",
    }


@router.get("/sessions/{session_id}/export")
def export_session(session_id: str, format: str = Query("markdown", pattern="^(markdown|json)$")):
    engine, session = _get_engine_and_session(session_id)
    if format == "json":
        data = {
            "session_id": session.session_id,
            "topic": session.topic,
            "created_at": datetime.now().isoformat(),
            "cost_usd": engine.cost_tracker.total_cost_usd,
            "transcript": [
                {"speaker": e.speaker, "kind": e.kind, "text": e.text}
                for e in engine.transcript
            ],
        }
        return JSONResponse(
            content=data,
            headers={
                "Content-Disposition": f'attachment; filename="council-{session_id}.json"'
            },
        )
    else:
        # Markdown export
        lines = [
            f"# Council Debate: {session.topic}\n",
            f"*Exported on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n---\n",
        ]
        for entry in engine.transcript:
            if entry.kind == "user":
                header = "**You**"
            elif entry.kind == "chair":
                header = f"**👑 {entry.speaker}**"
            else:
                header = f"**{entry.speaker}**"
            lines.append(f"\n{header}:\n\n{entry.text}\n")
        content = "\n".join(lines)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f'attachment; filename="council-{session_id}.md"'
            },
        )


@router.get("/history", response_model=list[SavedSessionItem])
def list_history() -> list[SavedSessionItem]:
    if not SESSIONS_DIR.exists():
        return []

    files = sorted(SESSIONS_DIR.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
    items: list[SavedSessionItem] = []

    for f in files:
        try:
            stat = f.stat()
            dt = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M")
            text = f.read_text(encoding="utf-8")
            # Parse topic from first heading
            import re
            m = re.search(r"^# Council Debate:\s*(.+)$", text, re.MULTILINE)
            topic = m.group(1).strip() if m else f.stem
            # Count entries
            msg_count = len(re.findall(r"\*\*([^*]+?)\*\*:", text))
            items.append(
                SavedSessionItem(
                    filename=f.name,
                    filepath=str(f),
                    topic=topic,
                    date=dt,
                    message_count=msg_count,
                )
            )
        except Exception:
            continue

    return items


@router.post("/sessions/resume", response_model=SessionResponse)
def resume_session_endpoint(req: ResumeSessionRequest) -> SessionResponse:
    path = Path(req.filepath)
    if not path.is_absolute():
        path = SESSIONS_DIR / path
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Session file not found: {path}")

    topic, transcript = load_session(path)
    session_id = uuid.uuid4().hex[:8]
    cfg = load_config()

    engine = Engine(cfg)
    engine.transcript = list(transcript)

    session = SessionState(
        session_id=session_id,
        topic=topic,
        config=cfg,
        transcript=engine.transcript,
    )

    sessions[session_id] = session
    engines[session_id] = engine

    return _to_session_response(session, engine)
