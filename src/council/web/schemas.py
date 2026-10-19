"""Pydantic schemas for Council Web API."""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class MemberInfo(BaseModel):
    name: str
    provider: str
    model: str
    role: str
    is_chair: bool = False
    is_muted: bool = False


class CreateSessionRequest(BaseModel):
    topic: str
    words: int = Field(default=150, ge=20, le=1000)
    rounds: int = Field(default=1, ge=1, le=20)
    members: list[MemberInfo] | None = None


class TranscriptEntrySchema(BaseModel):
    round: int
    speaker: str
    text: str
    tokens: int = 0
    cost_usd: float = 0.0
    is_chair: bool = False
    timestamp: str | None = None


class SessionResponse(BaseModel):
    session_id: str
    topic: str
    words: int
    members: list[MemberInfo]
    transcript: list[TranscriptEntrySchema]
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cost_usd: float = 0.0
    is_cost_estimated: bool = False


class AddMessageRequest(BaseModel):
    speaker: str = "User"
    text: str
    is_chair: bool = False


class RunRoundRequest(BaseModel):
    rounds: int = Field(default=1, ge=1, le=10)
    words: int | None = Field(default=None, ge=20, le=1000)


class RunSummaryRequest(BaseModel):
    words: int | None = Field(default=None, ge=20, le=1000)


class MemberUpdateRequest(BaseModel):
    model: str | None = None
    role: str | None = None
    is_chair: bool | None = None
    is_muted: bool | None = None


class SaveSessionRequest(BaseModel):
    custom_filename: str | None = None


class ResumeSessionRequest(BaseModel):
    filepath: str


class SavedSessionItem(BaseModel):
    filename: str
    filepath: str
    topic: str
    date: str
    message_count: int


class ConfigResponse(BaseModel):
    council: dict[str, Any]
    members: list[dict[str, Any]]


class ConfigUpdateRequest(BaseModel):
    council: dict[str, Any]
    members: list[dict[str, Any]]
