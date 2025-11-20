#!/usr/bin/env bashh
set -euo pipefail

# Extraer host y puerto desde DATABASE_URL
if [ -n "${DATABASE_URL-}" ]; then
  echo "📡 Detectando host y puerto desde DATABASE_URL..."
  parsed=$(python - <<'PY'
import os
from urllib.parse import urlparse
u = os.getenv("DATABASE_URL", "")
p = urlparse(u)
host = p.hostname or "localhost"
port = str(p.port or "5432")
print(host + "|" + port)
PY
)
  DB_HOST="${parsed%%|*}"
  DB_PORT="${parsed##*|}"
else
  echo "❌ ERROR: DATABASE_URL no está definida"
  exit 1
fi

WAIT_TIMEOUT=${WAIT_FOR_DB_TIMEOUT:-120}

echo "⏳ Esperando TCP $DB_HOST:$DB_PORT (timeout=${WAIT_TIMEOUT}s)"
start_ts=$(date +%s)
while true; do
  if bash -c "</dev/tcp/$DB_HOST/$DB_PORT" >/dev/null 2>&1; then
    echo "✅ Puerto TCP $DB_HOST:$DB_PORT abierto"
    break
  fi
  now_ts=$(date +%s)
  elapsed=$((now_ts - start_ts))
  if [ "$elapsed" -ge "$WAIT_TIMEOUT" ]; then
    echo "❌ Timeout esperando $DB_HOST:$DB_PORT después de ${WAIT_TIMEOUT}s" >&2
    break
  fi
  echo "⌛ Esperando DB TCP ($elapsed s transcurridos)..."
  sleep 2
done

echo "🚦 Ejecutando chequeo Python de readiness..."
python wait_for_db.py || true

# Iniciar la app
exec uvicorn app:app --host 0.0.0.0 --port 8000
