from __future__ import annotations

import os
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
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]
