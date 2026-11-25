#!/usr/bin/env bash
# Levanta el backend del ramo con seguridad real y vuelos de demostración, sin modificarlo.
# Uso: integracion_stub/backend/levantar.sh [ruta-al-backend]   (por defecto ../banduairlines-backend)
set -euo pipefail
cd "$(dirname "$0")"
AQUI=$(pwd)
BACKEND=$(cd "${1:-$AQUI/../../../banduairlines-backend}" && pwd)

if ! (exec 3<>/dev/tcp/127.0.0.1/5432) 2>/dev/null; then
  echo "Postgres no responde en localhost:5432. En $BACKEND: docker compose up -d db" >&2
  exit 1
fi

# Spring no lee el .env del backend: las variables van en el entorno del proceso.
[ -s "$AQUI/.jwt-secret" ] || (umask 077 && openssl rand -base64 48 | tr -d '\n' > "$AQUI/.jwt-secret")
chmod 600 "$AQUI/.jwt-secret"
echo "Backend: $BACKEND ($(git -C "$BACKEND" rev-parse --short HEAD 2>/dev/null || echo "sin git"), se esperaba fa04b6f)"
cd "$BACKEND"
# export y no argumentos de env: así el secreto no aparece en ps.
export SECURITY_ENABLED=true
export JWT_SECRET="$(cat "$AQUI/.jwt-secret")"
export ADMIN_EMAIL=admin.tracking@bandu.local
export ADMIN_PASSWORD=AdminTracking2026
export TRACKING_FUENTEVUELOS=demo
exec ./mvnw -q spring-boot:run
