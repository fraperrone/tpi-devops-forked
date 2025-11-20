#!/usr/bin/env bash
set -euo pipefail

# Preserve whether DB_HOST was provided by the environment (vs using default)
ORIG_DB_HOST_RAW="${DB_HOST-}"

# Basic TCP wait loop before attempting SQLAlchemy connection. This helps when
# the MySQL server process exists but is still initializing and refusing
# connections. Use DB_HOST and DB_PORT or default to service name 'db' and 3306.
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}
WAIT_TIMEOUT=${WAIT_FOR_DB_TIMEOUT:-120}

# If neither DATABASE_URL nor an explicit DB_HOST were provided, skip waiting.
if [ -z "${DATABASE_URL-}" ] && [ -z "${ORIG_DB_HOST_RAW-}" ]; then
  echo "No DATABASE_URL/DB_HOST set, skipping DB wait"
else
  # If we have a DATABASE_URL but DB_HOST was not explicitly set, try to extract
  # host/port from DATABASE_URL (useful on platforms like Render).
  if [ -n "${DATABASE_URL-}" ] && [ -z "${ORIG_DB_HOST_RAW-}" ]; then
    parsed=$(python - <<'PY'
import os
from urllib.parse import urlparse
u=os.getenv("DATABASE_URL","")
p=urlparse(u)
host=p.hostname or ""
port=str(p.port or "")
print(host+"|"+port)
PY
)
    host_from_url="${parsed%%|*}"
    port_from_url="${parsed##*|}"
    if [ -n "$host_from_url" ]; then DB_HOST="$host_from_url"; fi
    if [ -n "$port_from_url" ]; then DB_PORT="$port_from_url"; fi
  fi

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

  # Run the Python-level wait for DB availability (will skip if non-MySQL)
  echo "Running Python DB readiness check..."
  python wait_for_db.py || true
fi

exec uvicorn app:app --host 0.0.0.0 --port 8000
