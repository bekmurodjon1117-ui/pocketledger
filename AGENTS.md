# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

**PocketLedger** — a full-stack personal finance tracker built with IBM Bob.

- **Backend:** Python 3.11+, FastAPI, SQLite, Pydantic, python-dotenv
- **Frontend:** React 19, TypeScript, Vite, plain CSS (no component library)
- **Auth:** Static Bearer token loaded from `.env` — enforced on every API endpoint

## Directory Structure

```
pocketledger/
├── backend/
│   ├── main.py           # FastAPI app — all endpoints (F1–F9)
│   ├── requirements.txt
│   └── .env.example      # copy to .env and set API_TOKEN
├── frontend/
│   ├── src/
│   │   ├── api.ts         # API client (Bearer token, all endpoints)
│   │   ├── App.tsx        # Main app (F1–F7)
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── components/
│   │       └── CategoryChart.tsx   # F6 — pure SVG bar chart
│   ├── package.json
│   ├── vite.config.ts     # proxies /api → 127.0.0.1:8000
│   └── .env.example
└── .bob/
    ├── rules/ledger-standards.md
    ├── rules-agent/AGENTS.md
    ├── rules-plan/AGENTS.md
    ├── rules-ask/AGENTS.md
    └── custom_modes.yaml
```

## Running Locally

```bash
# Backend
cd backend
pip3 install -r requirements.txt
cp .env.example .env        # set API_TOKEN
python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env        # set VITE_API_TOKEN to same value
npm run dev
```

## Critical Rules

- **Decimal only** — all monetary values in Python use `Decimal`, never `float`
- **No hardcoded secrets** — tokens and credentials always loaded from `.env`
- **Bearer token required** — every endpoint (except `/health`) calls `verify_token`
- **SQLite persistent** — `DB_PATH` points to a file, never `:memory:`
- **SVG chart** — `CategoryChart.tsx` uses raw SVG; do not add recharts/chart.js

## API Endpoints

| Method | Path | Feature |
|---|---|---|
| POST | `/transactions` | F1 — add transaction |
| GET | `/transactions?category=X` | F2 + F7 — list, filter |
| DELETE | `/transactions/{id}` | F3 — delete |
| GET | `/balance` | F4 — live balance |
| GET | `/categories/breakdown` | F5 — aggregation |
| GET | `/transactions/export-csv` | CSV export (feature/csv-export branch) |
| GET | `/health` | health check (no auth) |
