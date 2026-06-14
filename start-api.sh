#!/bin/bash
set -e
cd "$(dirname "$0")"

export $(cat .env | grep -v '^#' | xargs)
export PYTHONPATH="$(pwd)/ml-api"

echo "Starting FastAPI on http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo ""

.venv/bin/uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --app-dir ml-api
