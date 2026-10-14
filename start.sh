#!/usr/bin/env bash
# start.sh — Start PocketLedger (backend + frontend)
#
# Run from anywhere:
#   bash /path/to/pocketledger/start.sh
#   OR: cd pocketledger && ./start.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> PocketLedger root: $ROOT"

# Check Python version — pydantic-core requires <= 3.13 with older releases.
# Use the system python3 but warn if >= 3.14 and packages need upgrading.
PYTHON="python3"
PY_VER=$($PYTHON -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "0.0")
echo "==> Python: $PY_VER"

echo "==> Installing backend dependencies..."
cd "$ROOT/backend"
# Upgrade pip first to get the best resolver, then install with newest compatible versions
$PYTHON -m pip install -q --upgrade pip
$PYTHON -m pip install -q -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "    Created backend/.env — set API_TOKEN before proceeding"
fi

echo "==> Installing frontend dependencies..."
cd "$ROOT/frontend"
npm install --silent

if [ ! -f .env ]; then
  cp .env.example .env
  echo "    Created frontend/.env — set VITE_API_TOKEN to match backend API_TOKEN"
fi

echo ""
echo "==> Starting backend on http://127.0.0.1:8000 ..."
cd "$ROOT/backend"
$PYTHON -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

echo "==> Starting frontend on http://127.0.0.1:5173 ..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://127.0.0.1:8000"
echo "  API docs: http://127.0.0.1:8000/docs"
echo "  Frontend: http://127.0.0.1:5173"
echo ""
echo "Press Ctrl+C to stop both services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
