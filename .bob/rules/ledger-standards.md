# Ledger Coding Standards

All monetary values in Python must use `Decimal` from the `decimal` module — never `float`.

All FastAPI endpoints (except `/health`) must call `verify_token` via `Depends(verify_token)`.

Never hardcode API keys, tokens, or secrets in source files. Always load from `.env` via `python-dotenv` (backend) or `import.meta.env` (frontend).

After every Bob interaction, append a one-line audit entry to `bob-audit/audit.log`
in the format: `[ISO timestamp] [mode] [brief description of change]`
