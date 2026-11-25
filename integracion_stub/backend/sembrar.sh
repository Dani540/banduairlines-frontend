#!/usr/bin/env bash
# Crea el pasajero de prueba y los aeropuertos de los vuelos de demostración. Se puede repetir.
set -euo pipefail
BASE=${VITE_API_URL:-http://localhost:8080}
API=${BASE%/}/api/v1

echo -n "Esperando al backend"
# /actuator/health da DOWN sin servidor de correo local; basta con que responda una ruta pública.
for intento in $(seq 1 60); do
  curl -sf --max-time 5 "$API/busqueda/aeropuertos" >/dev/null 2>&1 && break
  [ "$intento" -eq 60 ] && { echo; echo "El backend no respondió en 3 minutos ($API)." >&2; exit 1; }
  echo -n .
  sleep 3
done
echo " listo"

# El token va por un descriptor y no como argumento, para que no aparezca en ps.
autorizacion() { printf 'Authorization: Bearer %s' "$TOKEN"; }
post() {
  if [ -n "${TOKEN:-}" ]; then
    curl -s --max-time 10 -o /dev/null -w '%{http_code}' -X POST "$API$1" -H 'Content-Type: application/json' -H @<(autorizacion) -d "$2"
  else
    curl -s --max-time 10 -o /dev/null -w '%{http_code}' -X POST "$API$1" -H 'Content-Type: application/json' -d "$2"
  fi
}

TOKEN=
echo "Pasajero: $(post /auth/registro '{"nombres":"Pasajera","apellidos":"Prueba","correo":"pasajero.tracking@bandu.local","contrasena":"Pasajero2026","confirmacionContrasena":"Pasajero2026"}') (201 creado, 409 ya existía)"

if ! RESPUESTA=$(curl -sf --max-time 10 -X POST "$API/auth/inicio-sesion" -H 'Content-Type: application/json' \
  -d '{"correo":"admin.tracking@bandu.local","contrasena":"AdminTracking2026"}'); then
  echo "No se pudo iniciar sesión como administrador. ¿El backend se levantó con levantar.sh?" >&2
  exit 1
fi
TOKEN=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["credencialAcceso"])' <<<"$RESPUESTA")

while IFS='|' read -r iata nombre ciudad zona; do
  echo "Aeropuerto $iata: $(post /ejemplo/aeropuertos "{\"codigoIata\":\"$iata\",\"nombre\":\"$nombre\",\"ciudad\":\"$ciudad\",\"pais\":\"Chile\",\"zonaHoraria\":\"$zona\"}")"
done <<'LISTA'
SCL|Aeropuerto Internacional Arturo Merino Benítez|Santiago|America/Santiago
PUQ|Aeropuerto Presidente Carlos Ibáñez del Campo|Punta Arenas|America/Punta_Arenas
ANF|Aeropuerto Andrés Sabella Gálvez|Antofagasta|America/Santiago
CCP|Aeropuerto Carriel Sur|Concepción|America/Santiago
PMC|Aeropuerto El Tepual|Puerto Montt|America/Santiago
CJC|Aeropuerto El Loa|Calama|America/Santiago
LISTA

echo
echo "Vuelos en el tablero de hoy:"
curl -sf --max-time 10 "$API/admin/tracking/tablero" -H @<(autorizacion) |
  python3 -c 'import json,sys
for v in json.load(sys.stdin):
    print("  {vueloId}  {codigoVuelo}  {origenIata}->{destinoIata}  {salidaProgramada}  {estadoActual}".format(**v))'
echo
echo "Administrador: admin.tracking@bandu.local / AdminTracking2026"
echo "Pasajero:      pasajero.tracking@bandu.local / Pasajero2026"
