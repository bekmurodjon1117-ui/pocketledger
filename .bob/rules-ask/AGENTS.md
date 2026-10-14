# Ask Mode Context — PocketLedger

## What is PocketLedger?

A full-stack personal finance tracker built as an IBM Bob workshop challenge project.
Users can track income and expenses, view category breakdowns, and filter transactions.

## Glossary

- **Transaction** — a single financial event: amount (positive=income, negative=expense), description, category, date
- **Balance** — sum of all transactions (income − |expense|)
- **Category breakdown** — aggregated total per category (F5)
- **Bearer token** — static API secret loaded from `.env`, sent as `Authorization: Bearer <token>`

## Key Files to Reference

- `backend/main.py` — all business logic and endpoints
- `frontend/src/api.ts` — API client with all endpoint definitions
- `frontend/src/components/CategoryChart.tsx` — SVG chart implementation
- `.bob/rules/ledger-standards.md` — coding standards Bob enforces
