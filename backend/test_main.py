"""Tests for the Meeting to Code API."""

import pytest
from fastapi.testclient import TestClient

from main import app, _meetings

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_store():
    """Reset in-memory store before every test."""
    _meetings.clear()
    yield
    _meetings.clear()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


def test_root():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_health_check():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert "timestamp" in body


# ---------------------------------------------------------------------------
# Meetings CRUD
# ---------------------------------------------------------------------------


def test_create_meeting():
    payload = {
        "title": "Sprint Planning",
        "transcript": "Action: Set up CI pipeline\nTodo: Write unit tests",
        "participants": ["Alice", "Bob"],
    }
    resp = client.post("/api/meetings", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Sprint Planning"
    assert body["participants"] == ["Alice", "Bob"]
    assert len(body["action_items"]) == 2
    assert "id" in body


def test_create_meeting_extracts_action_items():
    payload = {
        "title": "Daily Standup",
        "transcript": "Please review the PR\nNo blockers today\nFollow up with design team",
    }
    resp = client.post("/api/meetings", json=payload)
    assert resp.status_code == 201
    items = resp.json()["action_items"]
    titles = [i["title"] for i in items]
    assert any("Please review the PR" in t for t in titles)
    assert any("Follow up with design team" in t for t in titles)


def test_list_meetings_empty():
    resp = client.get("/api/meetings")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_meetings():
    client.post(
        "/api/meetings",
        json={"title": "Meeting A", "transcript": "Action: do something"},
    )
    client.post(
        "/api/meetings",
        json={"title": "Meeting B", "transcript": "Todo: do another thing"},
    )
    resp = client.get("/api/meetings")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_meeting():
    create_resp = client.post(
        "/api/meetings",
        json={"title": "Test Meeting", "transcript": "Action: test action"},
    )
    meeting_id = create_resp.json()["id"]
    resp = client.get(f"/api/meetings/{meeting_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == meeting_id


def test_get_meeting_not_found():
    resp = client.get("/api/meetings/nonexistent-id")
    assert resp.status_code == 404


def test_delete_meeting():
    create_resp = client.post(
        "/api/meetings",
        json={"title": "To Delete", "transcript": "Action: delete me"},
    )
    meeting_id = create_resp.json()["id"]
    resp = client.delete(f"/api/meetings/{meeting_id}")
    assert resp.status_code == 204
    assert client.get(f"/api/meetings/{meeting_id}").status_code == 404


def test_delete_meeting_not_found():
    resp = client.delete("/api/meetings/nonexistent-id")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Action item updates
# ---------------------------------------------------------------------------


def test_update_action_item():
    create_resp = client.post(
        "/api/meetings",
        json={"title": "Update Test", "transcript": "Action: fix the bug"},
    )
    body = create_resp.json()
    meeting_id = body["id"]
    item_id = body["action_items"][0]["id"]

    resp = client.patch(
        f"/api/meetings/{meeting_id}/action-items/{item_id}",
        json={"status": "done", "assignee": "Charlie", "priority": "high"},
    )
    assert resp.status_code == 200
    updated = resp.json()
    assert updated["status"] == "done"
    assert updated["assignee"] == "Charlie"
    assert updated["priority"] == "high"


def test_update_action_item_meeting_not_found():
    resp = client.patch(
        "/api/meetings/no-such-meeting/action-items/no-such-item",
        json={"status": "done"},
    )
    assert resp.status_code == 404


def test_update_action_item_not_found():
    create_resp = client.post(
        "/api/meetings",
        json={"title": "Item Not Found", "transcript": "Action: something"},
    )
    meeting_id = create_resp.json()["id"]
    resp = client.patch(
        f"/api/meetings/{meeting_id}/action-items/bad-item-id",
        json={"status": "done"},
    )
    assert resp.status_code == 404


def test_create_meeting_no_participants():
    payload = {"title": "Solo Meeting", "transcript": "Action: solo task"}
    resp = client.post("/api/meetings", json=payload)
    assert resp.status_code == 201
    assert resp.json()["participants"] == []
