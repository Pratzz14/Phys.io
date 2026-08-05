# Phys.io

Phys.io is a local physiotherapy exercise monitor. The React frontend handles the dashboard, profile forms, camera view, and browser-side pose classification. FastAPI provides local authentication, profile storage, and image uploads. SQLite is the only database; no cloud account or external database is required.

## Requirements

- Node.js 22+ and npm
- Python 3.12+

## Run locally

From the repository root, create a Python environment and install the backend dependencies:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

Start the API in one terminal:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Start the React development server in another:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite server proxies `/api` and `/media` to FastAPI.

For a local release build:

```powershell
cd frontend
npm run build
cd ..\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

FastAPI serves `frontend/dist` when it exists.

## Checks

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m pip_audit -r requirements.txt

cd ..\frontend
npm test
npm run build
npm audit --omit=dev
```

The application keeps the SQLite database in `backend/data/` and profile images in `backend/uploads/`; both are ignored by Git. Camera frames and pose data remain in the browser and are never sent to FastAPI.

The default configuration needs no `.env` file. To change the SQLite or upload location, set `DATABASE_PATH` or `UPLOAD_PATH` in the shell before starting FastAPI. Set `SESSION_COOKIE_SECURE=true` only behind HTTPS.
