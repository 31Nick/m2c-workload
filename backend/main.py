"""
Meeting to Code (m2c) — FastAPI Backend
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Meeting to Code API",
    description="Convert meeting transcripts into structured action items and tasks.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory store (replace with a real database for production)
# ---------------------------------------------------------------------------
_meetings: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class ActionItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    assignee: Optional[str] = None
    priority: str = "medium"  # low | medium | high
    status: str = "open"  # open | in_progress | done


class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    transcript: str = Field(..., min_length=1)
    participants: Optional[List[str]] = None


class Meeting(BaseModel):
    id: str
    title: str
    transcript: str
    participants: List[str]
    action_items: List[ActionItem]
    created_at: str
    updated_at: str


class ActionItemUpdate(BaseModel):
    status: Optional[str] = None
    assignee: Optional[str] = None
    priority: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _extract_action_items(transcript: str) -> List[ActionItem]:
    """
    Naive keyword-based extractor.  In production this would call an LLM.
    Looks for lines that contain action-oriented keywords.
    """
    keywords = [
        "action:",
        "todo:",
        "task:",
        "follow up",
        "action item",
        "will do",
        "should do",
        "needs to",
        "please",
        "assign",
    ]
    items: List[ActionItem] = []
    for line in transcript.splitlines():
        clean = line.strip()
        if not clean:
            continue
        lower = clean.lower()
        if any(kw in lower for kw in keywords):
            items.append(ActionItem(title=clean[:200]))
    return items


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "message": "Meeting to Code API is running"}


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "healthy", "timestamp": _now_iso()}


@app.get("/api/meetings", response_model=List[Meeting], tags=["meetings"])
def list_meetings():
    return list(_meetings.values())


@app.post(
    "/api/meetings",
    response_model=Meeting,
    status_code=status.HTTP_201_CREATED,
    tags=["meetings"],
)
def create_meeting(payload: MeetingCreate):
    meeting_id = str(uuid.uuid4())
    now = _now_iso()
    action_items = _extract_action_items(payload.transcript)
    meeting = {
        "id": meeting_id,
        "title": payload.title,
        "transcript": payload.transcript,
        "participants": payload.participants or [],
        "action_items": [item.model_dump() for item in action_items],
        "created_at": now,
        "updated_at": now,
    }
    _meetings[meeting_id] = meeting
    return meeting


@app.get("/api/meetings/{meeting_id}", response_model=Meeting, tags=["meetings"])
def get_meeting(meeting_id: str):
    meeting = _meetings.get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@app.patch(
    "/api/meetings/{meeting_id}/action-items/{item_id}",
    response_model=ActionItem,
    tags=["meetings"],
)
def update_action_item(meeting_id: str, item_id: str, payload: ActionItemUpdate):
    meeting = _meetings.get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    for item in meeting["action_items"]:
        if item["id"] == item_id:
            if payload.status is not None:
                item["status"] = payload.status
            if payload.assignee is not None:
                item["assignee"] = payload.assignee
            if payload.priority is not None:
                item["priority"] = payload.priority
            meeting["updated_at"] = _now_iso()
            return item
    raise HTTPException(status_code=404, detail="Action item not found")


@app.delete(
    "/api/meetings/{meeting_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["meetings"],
)
def delete_meeting(meeting_id: str):
    if meeting_id not in _meetings:
        raise HTTPException(status_code=404, detail="Meeting not found")
    del _meetings[meeting_id]
