from __future__ import annotations

import os
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.sqlite"))
    monkeypatch.setenv("UPLOAD_PATH", str(tmp_path / "uploads"))
    from app import config

    config.DATABASE_PATH = tmp_path / "test.sqlite"
    config.UPLOAD_PATH = tmp_path / "uploads"
    from app import db

    db.configure_database(config.DATABASE_PATH)
    db.init_db()
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


def csrf(client: TestClient) -> str:
    return client.get("/api/auth/csrf").json()["csrf_token"]


def register_user(client: TestClient, name: str, email: str) -> str:
    token = csrf(client)
    response = client.post(
        "/api/auth/register",
        headers={"X-CSRF-Token": token},
        json={
            "name": name,
            "email": email,
            "password": "a-strong-local-password",
            "confirm_password": "a-strong-local-password",
        },
    )
    assert response.status_code == 201
    return response.json()["csrf_token"]


def test_register_login_and_profile(client: TestClient) -> None:
    token = csrf(client)
    anonymous_session = client.cookies.get("physio.sid")
    response = client.post(
        "/api/auth/register",
        headers={"X-CSRF-Token": token},
        json={
            "name": "localuser",
            "email": "local@example.com",
            "password": "a-strong-local-password",
            "confirm_password": "a-strong-local-password",
        },
    )
    assert response.status_code == 201
    assert client.cookies.get("physio.sid") != anonymous_session
    assert response.json()["user"]["email"] == "local@example.com"
    token = response.json()["csrf_token"]
    profile = client.get("/api/profile")
    assert profile.status_code == 200
    assert profile.json()["name"] == "localuser"

    update = client.put(
        "/api/profile",
        headers={"X-CSRF-Token": token},
        json={"fullname": "Local User", "age": 30, "gender": "unspecified"},
    )
    assert update.status_code == 200
    assert update.json()["fullname"] == "Local User"

    logout = client.post("/api/auth/logout", headers={"X-CSRF-Token": token})
    assert logout.status_code == 204

    token = csrf(client)
    login = client.post(
        "/api/auth/login",
        headers={"X-CSRF-Token": token},
        json={"email": "local@example.com", "password": "a-strong-local-password"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["email"] == "local@example.com"
    assert client.get("/api/auth/me").status_code == 200


def test_state_change_requires_csrf(client: TestClient) -> None:
    csrf_token = csrf(client)
    response = client.post(
        "/api/auth/register",
        json={
            "name": "localuser",
            "email": "local@example.com",
            "password": "a-strong-local-password",
            "confirm_password": "a-strong-local-password",
        },
    )
    assert response.status_code == 403
    assert csrf_token


def test_protected_profile_requires_login(client: TestClient) -> None:
    assert client.get("/api/profile").status_code == 401


def test_image_validation_and_logout(client: TestClient) -> None:
    token = csrf(client)
    registered = client.post(
        "/api/auth/register",
        headers={"X-CSRF-Token": token},
        json={
            "name": "imageuser",
            "email": "image@example.com",
            "password": "a-strong-local-password",
            "confirm_password": "a-strong-local-password",
        },
    )
    assert registered.status_code == 201
    token = registered.json()["csrf_token"]

    invalid_image = client.post(
        "/api/profile/image",
        headers={"X-CSRF-Token": token},
        files={"image": ("avatar.jpg", b"not-an-image", "image/jpeg")},
    )
    assert invalid_image.status_code == 400

    logout = client.post("/api/auth/logout", headers={"X-CSRF-Token": token})
    assert logout.status_code == 204
    assert client.get("/api/profile").status_code == 401


def test_spa_fallback_does_not_expose_files_outside_dist(client: TestClient) -> None:
    response = client.get("/%2e%2e/package.json")
    assert response.status_code == 200
    assert "Phys.io" in response.text
    assert '"name": "physio-frontend"' not in response.text


def test_security_headers_are_present(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    content_security_policy = response.headers["content-security-policy"]
    assert "frame-src https://www.youtube-nocookie.com" in content_security_policy
    assert "frame-ancestors 'none'" in content_security_policy


def _world_landmarks() -> list[dict[str, float]]:
    landmarks = [
        {
            "x": ((index % 5) - 2) * 0.08,
            "y": (index - 16) * 0.04,
            "z": ((index % 3) - 1) * 0.03,
            "visibility": 1.0,
            "presence": 1.0,
        }
        for index in range(33)
    ]
    landmarks[11].update(x=0.25, y=-0.5, z=0.0)
    landmarks[12].update(x=-0.25, y=-0.5, z=0.0)
    landmarks[23].update(x=0.18, y=0.0, z=0.02)
    landmarks[24].update(x=-0.18, y=0.0, z=-0.02)
    return landmarks


def test_classifier_prediction_is_local_authenticated_and_allowlisted(client: TestClient) -> None:
    assert client.post(
        "/api/classifiers/hands-up-vs-down.joblib/predict",
        json={"world_landmarks": _world_landmarks()},
    ).status_code == 401

    token = csrf(client)
    registered = client.post(
        "/api/auth/register",
        headers={"X-CSRF-Token": token},
        json={
            "name": "poseuser",
            "email": "pose@example.com",
            "password": "a-strong-local-password",
            "confirm_password": "a-strong-local-password",
        },
    )
    token = registered.json()["csrf_token"]
    headers = {"X-CSRF-Token": token}

    for model_id in ("hands-up-vs-down.joblib", "hands-side-vs-up.joblib"):
        response = client.post(
            f"/api/classifiers/{model_id}/predict",
            headers=headers,
            json={"world_landmarks": _world_landmarks()},
        )
        assert response.status_code == 200
        prediction = response.json()
        assert prediction["modelId"] == model_id
        assert prediction["classes"]
        assert 0 <= prediction["featureCoverage"] <= 1

    rejected = client.post(
        "/api/classifiers/unknown.joblib/predict",
        headers=headers,
        json={"world_landmarks": _world_landmarks()},
    )
    assert rejected.status_code == 422

    malformed = client.post(
        "/api/classifiers/hands-up-vs-down.joblib/predict",
        headers=headers,
        json={"world_landmarks": _world_landmarks()[:-1]},
    )
    assert malformed.status_code == 422


def exercise_session_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "exercise_id": "hands-up-down",
        "started_at": "2026-07-20T09:00:00Z",
        "last_active_at": "2026-07-20T09:02:00Z",
        "active_seconds": 90,
        "repetitions": 4,
        "average_accuracy": 84.5,
        "accuracy_sample_count": 20,
        "revision": 1,
    }
    payload.update(overrides)
    return payload


def test_exercise_session_write_requires_auth_csrf_and_valid_summary(client: TestClient) -> None:
    session_id = str(uuid.uuid4())
    assert client.put(f"/api/exercise-sessions/{session_id}", json=exercise_session_payload()).status_code == 401
    token = register_user(client, "metricsuser", "metrics@example.com")

    missing_csrf = client.put(f"/api/exercise-sessions/{session_id}", json=exercise_session_payload())
    assert missing_csrf.status_code == 403
    headers = {"X-CSRF-Token": token}
    assert client.put(
        f"/api/exercise-sessions/{session_id}",
        headers=headers,
        json=exercise_session_payload(repetitions=0),
    ).status_code == 422
    assert client.put(
        f"/api/exercise-sessions/{session_id}",
        headers=headers,
        json=exercise_session_payload(exercise_id="unknown-exercise"),
    ).status_code == 422
    assert client.put(
        f"/api/exercise-sessions/{session_id}",
        headers=headers,
        json=exercise_session_payload(started_at="2026-07-20T09:00:00"),
    ).status_code == 422


def test_exercise_sessions_are_idempotent_revisioned_and_date_filtered(client: TestClient) -> None:
    token = register_user(client, "progressuser", "progress@example.com")
    headers = {"X-CSRF-Token": token}
    session_id = str(uuid.uuid4())

    created = client.put(
        f"/api/exercise-sessions/{session_id}",
        headers=headers,
        json=exercise_session_payload(),
    )
    assert created.status_code == 200
    assert created.json()["session_id"] == session_id
    assert created.json()["repetitions"] == 4

    stale = client.put(
        f"/api/exercise-sessions/{session_id}",
        headers=headers,
        json=exercise_session_payload(repetitions=1, revision=1),
    )
    assert stale.status_code == 200
    assert stale.json()["repetitions"] == 4

    updated = client.put(
        f"/api/exercise-sessions/{session_id}",
        headers=headers,
        json=exercise_session_payload(
            last_active_at="2026-07-20T09:04:00Z",
            active_seconds=150,
            repetitions=7,
            average_accuracy=86.25,
            accuracy_sample_count=40,
            revision=2,
        ),
    )
    assert updated.status_code == 200
    assert updated.json()["repetitions"] == 7
    assert updated.json()["revision"] == 2

    changed_exercise = client.put(
        f"/api/exercise-sessions/{session_id}",
        headers=headers,
        json=exercise_session_payload(
            exercise_id="hands-side-up",
            last_active_at="2026-07-20T09:05:00Z",
            active_seconds=160,
            repetitions=8,
            accuracy_sample_count=45,
            revision=3,
        ),
    )
    assert changed_exercise.status_code == 409

    backwards = client.put(
        f"/api/exercise-sessions/{session_id}",
        headers=headers,
        json=exercise_session_payload(
            last_active_at="2026-07-20T09:03:00Z",
            active_seconds=120,
            repetitions=6,
            accuracy_sample_count=30,
            revision=3,
        ),
    )
    assert backwards.status_code == 409

    history = client.get("/api/exercise-sessions", params={"since": "2026-07-14T00:00:00+05:30"})
    assert history.status_code == 200
    assert [item["session_id"] for item in history.json()] == [session_id]
    assert history.json()[0]["last_active_at"].endswith("Z")
    assert client.get("/api/exercise-sessions", params={"since": "2026-07-21T00:00:00Z"}).json() == []
    assert client.get("/api/exercise-sessions", params={"since": "2026-07-14T00:00:00"}).status_code == 422


def test_exercise_sessions_are_isolated_by_user(client: TestClient) -> None:
    first_token = register_user(client, "firstmetrics", "first-metrics@example.com")
    session_id = str(uuid.uuid4())
    assert client.put(
        f"/api/exercise-sessions/{session_id}",
        headers={"X-CSRF-Token": first_token},
        json=exercise_session_payload(),
    ).status_code == 200
    assert client.post("/api/auth/logout", headers={"X-CSRF-Token": first_token}).status_code == 204

    second_token = register_user(client, "secondmetrics", "second-metrics@example.com")
    hidden = client.get("/api/exercise-sessions", params={"since": "2026-01-01T00:00:00Z"})
    assert hidden.status_code == 200
    assert hidden.json() == []
    collision = client.put(
        f"/api/exercise-sessions/{session_id}",
        headers={"X-CSRF-Token": second_token},
        json=exercise_session_payload(revision=2),
    )
    assert collision.status_code == 404
