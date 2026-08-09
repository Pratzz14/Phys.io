# Phys.io

## Introduction

Phys.io is a local-first physiotherapy exercise companion for guided movement and camera-assisted practice. Its React interface brings together a personalized dashboard, editable health profile, exercise library, and live posture feedback. A FastAPI backend manages authentication, profile data, image uploads, and posture classification, while SQLite keeps the application self-contained without a cloud account or external database.

During live exercises, self-hosted MediaPipe assets detect 33 pose landmarks in the browser. Camera frames stay on the user's device; only numeric world landmarks are sent to the locally running API for classification.

## Features

- **Private accounts and profiles** — Register and sign in locally, maintain personal details, upload a JPEG or PNG profile photo, describe discomfort, and rate pain across the neck, shoulders, elbows, back, knees, and ankles.
- **Personalized dashboard** — See a time-aware greeting, profile summary, pain-range overview, camera-readiness guidance, and quick links to recommended exercises.
- **Live exercise monitoring** — Practice **Hands Up / Hands Down** and **Hands Side / Hands Up** using full-body pose tracking and trained local classifiers.
- **Real-time movement feedback** — View the detected position, next target position, confidence score, visibility prompts, and completed repetition count.
- **Long-term exercise progress** — Automatically save qualifying live-session summaries and compare repetitions, average displayed accuracy, and active tracking time across a rolling 12-week dashboard view.
- **Guided movement library** — Follow illustrated steps and safety checklists for neck release, elbow flow, knee control, and ankle mobility, with optional reference videos.
- **Local-first pose processing** — MediaPipe inference runs in a web worker using runtime, WebAssembly, and model files served by Phys.io rather than a runtime CDN.
- **Local storage and API** — FastAPI, SQLAlchemy, and SQLite provide authenticated profile storage, CSRF-protected requests, image handling, and scikit-learn classifier inference.
- **Development and release workflows** — Run the frontend and backend separately with hot reload, or build the frontend and serve the complete application through FastAPI.

## Onboarding and installation

### Prerequisites

- Git
- Node.js 22 or newer with npm
- Python 3.12 or newer
- A modern browser; a camera is required only for live monitoring

### 1. Clone the repository

```powershell
git clone https://github.com/Pratzz14/Phys.io.git
cd Phys.io
```

### 2. Set up the backend

From the repository root, create a virtual environment and install the application and development dependencies:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

On macOS or Linux, use `python3.12 -m venv .venv` and replace `.\.venv\Scripts\python.exe` with `./.venv/bin/python` in the backend commands.

### 3. Install the frontend dependencies

```powershell
cd ..\frontend
npm ci
```

### 4. Start Phys.io for development

Start FastAPI in one terminal:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Start Vite in a second terminal:

```powershell
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), create an account, complete your profile, and allow camera access when you open a live exercise. Vite proxies API requests to FastAPI at `http://127.0.0.1:8000`.

### 5. Run a local release build

```powershell
cd frontend
npm run build
cd ..\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

When `frontend/dist` exists, FastAPI serves the built application. Open [http://localhost:8000](http://localhost:8000).

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

## Local data and privacy

The SQLite database is stored in `backend/data/`, and uploaded profile images are stored in `backend/uploads/`; both locations are ignored by Git. Camera frames never leave the browser. MediaPipe generates pose landmarks on-device, and only those numeric landmarks are sent to the same-origin local FastAPI process for posture classification. Phys.io does not send them to a cloud service.

After a live visit reaches its first completed repetition, Phys.io stores only a compact derived summary in local SQLite: the exercise identifier, timestamps, repetitions, average displayed classifier accuracy, accuracy sample count, and valid-tracking duration. Video, camera images, pose landmarks, and detailed pose timelines are never added to exercise history. Visits with no completed repetitions are discarded.

The MediaPipe runtime, WebAssembly files, and Full pose model are served from `frontend/public/mediapipe`, so live monitoring requires no runtime CDN request. Model provenance and checksums are documented in `frontend/public/POSE_MODEL_ASSETS.md`.

## Configuration

The default setup requires no `.env` file. To change the SQLite database or upload location, set `DATABASE_PATH` or `UPLOAD_PATH` before starting FastAPI. Set `SESSION_COOKIE_SECURE=true` only when the application is served over HTTPS.
