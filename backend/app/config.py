from __future__ import annotations

import os
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", ROOT_DIR / "data" / "physio.sqlite")).expanduser()
UPLOAD_PATH = Path(os.getenv("UPLOAD_PATH", ROOT_DIR / "uploads")).expanduser()
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
