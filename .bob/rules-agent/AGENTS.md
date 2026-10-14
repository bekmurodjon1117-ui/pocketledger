# Agent Mode Context — PocketLedger

## File Layout (for Agent mode)

When adding new endpoints, add them to `backend/main.py`.
When adding new frontend features, add components to `frontend/src/components/`.
The API client lives in `frontend/src/api.ts` — add new functions there.

## Naming Conventions

- Python: `snake_case` for functions and variables, `PascalCase` for Pydantic models
- TypeScript: `camelCase` for functions, `PascalCase` for interfaces and components

## Key Patterns

- Backend auth: `_: None = Depends(verify_token)` on every protected endpoint
- Backend DB: call `get_db()` directly (no context manager needed — connection closed manually)
- Frontend API calls: always use functions from `api.ts`, never call `fetch` directly in components
- Amounts: stored as `TEXT` in SQLite to preserve `Decimal` precision; convert with `Decimal(row["amount"])`
