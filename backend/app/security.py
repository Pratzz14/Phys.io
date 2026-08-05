from __future__ import annotations

import time
import secrets
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy import delete
from sqlalchemy.orm import Session

from .config import SESSION_COOKIE_SECURE
from .db import SessionRecord, User, get_db, new_token, token_hash


SESSION_COOKIE = "physio.sid"
SESSION_MAX_AGE = 60 * 60


class RateLimiter:
    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > self.window_seconds:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            return True


auth_limiter = RateLimiter(limit=8, window_seconds=15 * 60)


def _set_session_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        raw_token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite="strict",
        path="/",
    )


def create_session(db: Session, response: Response, user_id: str | None = None) -> tuple[SessionRecord, str]:
    expires_before = datetime.now(timezone.utc).replace(tzinfo=None)
    db.execute(delete(SessionRecord).where(SessionRecord.expires_at <= expires_before).execution_options(synchronize_session=False))
    raw_session = new_token()
    csrf_token = new_token()
    record = SessionRecord(
        id_hash=token_hash(raw_session),
        user_id=user_id,
        csrf_hash=token_hash(csrf_token),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=SESSION_MAX_AGE),
    )
    db.add(record)
    db.commit()
    _set_session_cookie(response, raw_session)
    return record, csrf_token


def replace_session(db: Session, response: Response, previous: SessionRecord, user_id: str) -> tuple[SessionRecord, str]:
    db.delete(previous)
    return create_session(db, response, user_id)


def get_session(request: Request, db: Session) -> SessionRecord | None:
    raw_session = request.cookies.get(SESSION_COOKIE)
    if not raw_session:
        return None
    record = db.get(SessionRecord, token_hash(raw_session))
    if not record:
        return None
    now = datetime.now(timezone.utc)
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        db.delete(record)
        db.commit()
        return None
    return record


def rotate_csrf(db: Session, record: SessionRecord) -> str:
    csrf_token = new_token()
    record.csrf_hash = token_hash(csrf_token)
    record.expires_at = datetime.now(timezone.utc) + timedelta(seconds=SESSION_MAX_AGE)
    db.commit()
    return csrf_token


def require_csrf(request: Request, db: Session) -> SessionRecord:
    record = get_session(request, db)
    supplied = request.headers.get("X-CSRF-Token")
    if not record or not supplied or not secrets.compare_digest(token_hash(supplied), record.csrf_hash):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token")
    return record


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    record = get_session(request, db)
    if not record or not record.user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user = db.get(User, record.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


def clear_session(request: Request, response: Response, db: Session) -> None:
    record = get_session(request, db)
    if record:
        db.delete(record)
        db.commit()
    response.delete_cookie(SESSION_COOKIE, path="/")


def client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"
