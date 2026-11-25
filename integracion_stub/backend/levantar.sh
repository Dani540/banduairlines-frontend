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
[ -s "$AQUI/.jwt-secret" ] || openssl rand -base64 48 | tr -d '\n' > "$AQUI/.jwt-secret"
echo "Backend: $BACKEND ($(git -C "$BACKEND" rev-parse --short HEAD), se esperaba fa04b6f)"
cd "$BACKEND"
exec env \
  SECURITY_ENABLED=true \
  JWT_SECRET="$(cat "$AQUI/.jwt-secret")" \
  ADMIN_EMAIL=admin.tracking@bandu.local \
  ADMIN_PASSWORD=AdminTracking2026 \
  TRACKING_FUENTEVUELOS=demo \
  ./mvnw -q spring-boot:run
