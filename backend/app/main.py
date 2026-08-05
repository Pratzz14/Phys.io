from __future__ import annotations

import io
import logging
import mimetypes
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from pwdlib import PasswordHash
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import ROOT_DIR, UPLOAD_PATH
from .db import Profile, User, get_db, init_db
from .schemas import (
    AuthResponse,
    CsrfResponse,
    HealthResponse,
    LoginRequest,
    ProfileResponse,
    ProfileUpdate,
    RegisterRequest,
    UserResponse,
)
from .security import (
    auth_limiter,
    client_key,
    clear_session,
    create_session,
    current_user,
    get_session,
    require_csrf,
    replace_session,
    rotate_csrf,
)


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("physio")
password_hash = PasswordHash.recommended()

@asynccontextmanager
async def lifespan(_application: FastAPI):
    init_db()
    UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="Phys.io API", docs_url="/api/docs", redoc_url=None, lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=1000)
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
    response.headers.setdefault("Permissions-Policy", "camera=(self), microphone=(), geolocation=()")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    return response


@app.get("/api/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)) -> HealthResponse:
    db.execute(text("SELECT 1"))
    return HealthResponse(status="ok", database="sqlite")


@app.get("/api/auth/csrf", response_model=CsrfResponse)
def csrf_token(request: Request, response: Response, db: Session = Depends(get_db)) -> CsrfResponse:
    record = get_session(request, db)
    if not record:
        _, raw_token = create_session(db, response)
        return CsrfResponse(csrf_token=raw_token)
    return CsrfResponse(csrf_token=rotate_csrf(db, record))


@app.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    if not auth_limiter.allow(f"register:{client_key(request)}"):
        raise HTTPException(status_code=429, detail="Too many attempts")
    record = require_csrf(request, db)
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    email = str(payload.email).lower()
    name = payload.name.strip()
    if db.scalar(select(User).where((User.email == email) | (User.name == name))):
        raise HTTPException(status_code=409, detail="Account details are already in use")
    user = User(id=str(uuid.uuid4()), email=email, name=name, password_hash=password_hash.hash(payload.password))
    user.profile = Profile(user_id=user.id)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Account details are already in use")
    _, csrf = replace_session(db, response, record, user.id)
    return AuthResponse(user=UserResponse(id=user.id, name=user.name, email=user.email), csrf_token=csrf)


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    if not auth_limiter.allow(f"login:{client_key(request)}"):
        raise HTTPException(status_code=429, detail="Too many attempts")
    record = require_csrf(request, db)
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not password_hash.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if password_hash.needs_update(user.password_hash):
        user.password_hash = password_hash.hash(payload.password)
    _, csrf = replace_session(db, response, record, user.id)
    return AuthResponse(user=UserResponse(id=user.id, name=user.name, email=user.email), csrf_token=csrf)


@app.post("/api/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> Response:
    require_csrf(request, db)
    clear_session(request, response, db)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@app.get("/api/auth/me", response_model=UserResponse)
def me(user: User = Depends(current_user)) -> UserResponse:
    return UserResponse(id=user.id, name=user.name, email=user.email)


def profile_response(user: User, profile: Profile) -> ProfileResponse:
    return ProfileResponse(
        user_id=user.id,
        name=user.name,
        email=user.email,
        fullname=profile.fullname,
        phone=profile.phone,
        age=profile.age,
        weight=profile.weight,
        height=profile.height,
        gender=profile.gender,
        specify=profile.specify,
        neck_pain=profile.neck_pain,
        shoulder_pain=profile.shoulder_pain,
        elbow_pain=profile.elbow_pain,
        back_pain=profile.back_pain,
        knee_pain=profile.knee_pain,
        ankle_pain=profile.ankle_pain,
        image_url="/api/profile/image" if profile.image_filename else None,
    )


@app.get("/api/profile", response_model=ProfileResponse)
def get_profile(user: User = Depends(current_user), db: Session = Depends(get_db)) -> ProfileResponse:
    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_response(user, profile)


@app.get("/api/profile/image")
def get_profile_image(user: User = Depends(current_user), db: Session = Depends(get_db)) -> FileResponse:
    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    if not profile or not profile.image_filename:
        raise HTTPException(status_code=404, detail="Profile image not found")
    image_path = UPLOAD_PATH / profile.image_filename
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="Profile image not found")
    return FileResponse(image_path, media_type=mimetypes.guess_type(image_path.name)[0])


@app.put("/api/profile", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdate,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    require_csrf(request, db)
    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for key, value in payload.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    return profile_response(user, profile)


@app.post("/api/profile/image", response_model=ProfileResponse)
async def upload_profile_image(
    request: Request,
    image: UploadFile = File(...),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    require_csrf(request, db)
    content = await image.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")
    try:
        with Image.open(io.BytesIO(content)) as source:
            if source.width > 4096 or source.height > 4096 or source.width * source.height > 4096 * 4096:
                raise HTTPException(status_code=400, detail="Only bounded JPEG and PNG images are supported")
            source.verify()
        with Image.open(io.BytesIO(content)) as source:
            if source.format not in {"JPEG", "PNG"}:
                raise HTTPException(status_code=400, detail="Only bounded JPEG and PNG images are supported")
            output = io.BytesIO()
            if source.format == "JPEG":
                source.convert("RGB").save(output, format="JPEG", quality=90, optimize=True)
                extension = "jpg"
            else:
                source.save(output, format="PNG", optimize=True)
                extension = "png"
    except (Image.DecompressionBombError, UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400, detail="Invalid image") from exc

    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    filename = f"{uuid.uuid4()}.{extension}"
    UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
    target = UPLOAD_PATH / filename
    target.write_bytes(output.getvalue())
    previous = profile.image_filename
    profile.image_filename = filename
    try:
        db.commit()
    except Exception:
        db.rollback()
        target.unlink(missing_ok=True)
        raise
    if previous:
        old_path = UPLOAD_PATH / previous
        if old_path.is_file() and old_path != target:
            old_path.unlink()
    return profile_response(user, profile)


@app.delete("/api/profile/image", response_model=ProfileResponse)
def delete_profile_image(request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)) -> ProfileResponse:
    require_csrf(request, db)
    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    previous = profile.image_filename
    profile.image_filename = None
    db.commit()
    if previous:
        path = UPLOAD_PATH / previous
        path.unlink(missing_ok=True)
    return profile_response(user, profile)


FRONTEND_DIST = ROOT_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    for directory_name in ("assets", "vendor", "models"):
        directory = FRONTEND_DIST / directory_name
        if directory.exists():
            app.mount(f"/{directory_name}", StaticFiles(directory=directory), name=directory_name)

    @app.get("/{path:path}")
    def serve_frontend(path: str) -> FileResponse:
        return FileResponse(FRONTEND_DIST / "index.html")
