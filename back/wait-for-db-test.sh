#!/usr/bin/env bash
set -euo pipefail

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
WAIT_TIMEOUT=${WAIT_FOR_DB_TIMEOUT:-120}

echo "Waiting for TCP $DB_HOST:$DB_PORT (timeout=${WAIT_TIMEOUT}s)"
start_ts=$(date +%s)
while true; do
  if bash -c "</dev/tcp/$DB_HOST/$DB_PORT" >/dev/null 2>&1; then
    echo "TCP port $DB_HOST:$DB_PORT is open"
    break
  fi
  now_ts=$(date +%s)
  elapsed=$((now_ts - start_ts))
  if [ "$elapsed" -ge "$WAIT_TIMEOUT" ]; then
    echo "Timeout waiting for $DB_HOST:$DB_PORT after ${WAIT_TIMEOUT}s" >&2
    break
  fi
  echo "Waiting for DB TCP ($elapsed s elapsed)..."
  sleep 2
done

echo "Running Python DB readiness check..."
python wait_for_db.py || true