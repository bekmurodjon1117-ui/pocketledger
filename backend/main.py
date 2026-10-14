"""
main.py — PocketLedger FastAPI Backend

Features:
  F1: Add transaction (amount, description, category, date)
  F2: List transactions newest-first
  F3: Delete transaction by ID
  F4: Live balance (total income / expense)
  F5: Category breakdown aggregation
  F8: SQLite persistent storage
  F9: Static Bearer token auth (loaded from .env)
  F10: CSV export — GET /transactions/export-csv (closes #1)

Run:
  pip install -r requirements.txt
  cp .env.example .env          # set API_TOKEN
  python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
"""

import csv
import io
import os
import sqlite3
import uuid
from datetime import date as dt_date
from decimal import Decimal, InvalidOperation
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, field_validator

load_dotenv()

API_TOKEN: str = os.environ["API_TOKEN"]
DB_PATH: str = os.getenv("DB_PATH", "pocketledger.db")

app = FastAPI(title="PocketLedger API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

bearer_scheme = HTTPBearer()


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def verify_token(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)) -> None:
    if credentials.credentials != API_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id          TEXT PRIMARY KEY,
            amount      TEXT NOT NULL,
            description TEXT NOT NULL,
            category    TEXT NOT NULL,
            date        TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


init_db()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TransactionIn(BaseModel):
    amount: str          # sent as string to preserve decimal precision
    description: str
    category: str
    date: str            # ISO format: YYYY-MM-DD

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: str) -> str:
        try:
            Decimal(v)
        except InvalidOperation:
            raise ValueError("amount must be a valid decimal number")
        return v

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            dt_date.fromisoformat(v)
        except ValueError:
            raise ValueError("date must be ISO format YYYY-MM-DD")
        return v


class TransactionOut(BaseModel):
    id: str
    amount: str
    description: str
    category: str
    date: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def row_to_tx(row: sqlite3.Row) -> TransactionOut:
    return TransactionOut(
        id=row["id"],
        amount=row["amount"],
        description=row["description"],
        category=row["category"],
        date=row["date"],
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/transactions", response_model=TransactionOut, status_code=201)
def add_transaction(
    body: TransactionIn,
    _: None = Depends(verify_token),
) -> TransactionOut:
    """F1 — Add a transaction."""
    tx_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO transactions VALUES (?, ?, ?, ?, ?)",
        (tx_id, body.amount, body.description, body.category, body.date),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
    conn.close()
    return row_to_tx(row)


@app.get("/transactions", response_model=list[TransactionOut])
def list_transactions(
    category: Optional[str] = None,
    _: None = Depends(verify_token),
) -> list[TransactionOut]:
    """F2 — List transactions newest-first. F7 — optional category filter."""
    conn = get_db()
    if category:
        rows = conn.execute(
            "SELECT * FROM transactions WHERE category = ? ORDER BY date DESC, rowid DESC",
            (category,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM transactions ORDER BY date DESC, rowid DESC"
        ).fetchall()
    conn.close()
    return [row_to_tx(r) for r in rows]


@app.get("/transactions/export-csv")
def export_transactions_csv(
    category: Optional[str] = None,
    _: None = Depends(verify_token),
) -> StreamingResponse:
    """F10 — Export transactions as CSV. Closes #1.

    Query params:
        category (optional) — filter rows by category before export.

    Response:
        Content-Type: text/csv
        Columns: id, date, description, category, amount
        Rows ordered newest-first.
    """
    conn = get_db()
    if category:
        rows = conn.execute(
            "SELECT id, date, description, category, amount "
            "FROM transactions WHERE category = ? ORDER BY date DESC, rowid DESC",
            (category,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, date, description, category, amount "
            "FROM transactions ORDER BY date DESC, rowid DESC"
        ).fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "date", "description", "category", "amount"])
    for row in rows:
        writer.writerow([row["id"], row["date"], row["description"], row["category"], row["amount"]])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=\"transactions.csv\""},
    )


@app.delete("/transactions/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: str,
    _: None = Depends(verify_token),
) -> None:
    """F3 — Delete transaction by ID."""
    conn = get_db()
    result = conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")


@app.get("/balance")
def get_balance(_: None = Depends(verify_token)) -> dict:
    """F4 — Live balance: total income and expense."""
    conn = get_db()
    rows = conn.execute("SELECT amount FROM transactions").fetchall()
    conn.close()

    income = Decimal("0")
    expense = Decimal("0")
    for row in rows:
        amt = Decimal(row["amount"])
        if amt >= 0:
            income += amt
        else:
            expense += amt

    return {
        "income": str(income),
        "expense": str(expense),
        "balance": str(income + expense),
    }


@app.get("/categories/breakdown")
def category_breakdown(_: None = Depends(verify_token)) -> list[dict]:
    """F5 — Aggregate spending/income by category."""
    conn = get_db()
    rows = conn.execute(
        "SELECT category, amount FROM transactions"
    ).fetchall()
    conn.close()

    totals: dict[str, Decimal] = {}
    for row in rows:
        cat = row["category"]
        totals[cat] = totals.get(cat, Decimal("0")) + Decimal(row["amount"])

    return [{"category": k, "total": str(v)} for k, v in sorted(totals.items())]
