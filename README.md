# PocketLedger

Personal finance tracker built with IBM Bob for the OpenSlava Final Challenge.

**Stack:** FastAPI · SQLite · React · Vite · TypeScript · Plain CSS

## Features

| # | Feature |
|---|---|
| F1 | Add transaction (amount, description, category, date) |
| F2 | List transactions — newest first |
| F3 | Delete transaction by ID |
| F4 | Live balance (income / expense / net) |
| F5 | Category breakdown aggregation |
| F6 | Category bar chart — pure SVG, no external library |
| F7 | Filter by category dropdown |
| F8 | SQLite persistent storage |
| F9 | Static Bearer token auth on all endpoints |

## Quick Start

```bash
chmod +x start.sh
./start.sh
```

Then open **http://127.0.0.1:5173** in your browser.

The first run copies `.env.example` → `.env`. Edit `backend/.env` and `frontend/.env`
to set your `API_TOKEN` / `VITE_API_TOKEN` (must match).

## Bob Configuration

| Path | Purpose |
|---|---|
| `AGENTS.md` | Project context loaded in all Bob modes |
| `.bob/rules/ledger-standards.md` | Decimal enforcement, auth rules, audit log |
| `.bob/custom_modes.yaml` | `ledger-reviewer` — read-only compliance mode |
| `.bob/rules-agent/AGENTS.md` | Agent mode: file layout and patterns |
| `.bob/rules-plan/AGENTS.md` | Plan mode: architecture constraints |
| `.bob/rules-ask/AGENTS.md` | Ask mode: glossary and overview |

## Development

```bash
# Backend only
cd backend && python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Frontend only
cd frontend && npm run dev

# Type-check frontend
cd frontend && npm run type-check

# Lint frontend
cd frontend && npm run lint
```
