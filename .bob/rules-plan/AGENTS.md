# Plan Mode Context — PocketLedger

## Architecture

```
Browser (React + Vite :5173)
    │  fetch /api/*  →  Vite proxy
    ▼
FastAPI (:8000)
    │  SQLite (pocketledger.db)
    ▼
.env  →  API_TOKEN (Bearer auth)
```

## Constraints for Planning

- No external charting library — SVG only (F6)
- No ORM — raw `sqlite3` with `conn.row_factory = sqlite3.Row`
- Monetary fields stored as TEXT in DB, computed with `Decimal` in Python
- Single-file backend (`main.py`) — keep it that way unless a new service is added
- New features should go through GitHub Issue → Branch → PR cycle (B-REQ-4)
