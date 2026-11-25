#!/usr/bin/env bash
# Crea el pasajero de prueba y los aeropuertos de los vuelos de demostración. Se puede repetir.
set -euo pipefail
API=${VITE_API_URL:-http://localhost:8080}/api/v1

echo -n "Esperando al backend"
# /actuator/health da DOWN sin servidor de correo local; basta con que responda una ruta pública.
until curl -sf "$API/busqueda/aeropuertos" >/dev/null 2>&1; do echo -n .; sleep 3; done
echo " listo"

post() { curl -s -o /dev/null -w '%{http_code}' -X POST "$API$1" -H 'Content-Type: application/json' ${3:+-H "Authorization: Bearer $3"} -d "$2"; }

echo "Pasajero: $(post /auth/registro '{"nombres":"Pasajera","apellidos":"Prueba","correo":"pasajero.tracking@bandu.local","contrasena":"Pasajero2026","confirmacionContrasena":"Pasajero2026"}') (201 creado, 409 ya existía)"

TOKEN=$(curl -s -X POST "$API/auth/inicio-sesion" -H 'Content-Type: application/json' \
  -d '{"correo":"admin.tracking@bandu.local","contrasena":"AdminTracking2026"}' |
  python3 -c 'import json,sys; print(json.load(sys.stdin)["credencialAcceso"])')

while IFS='|' read -r iata nombre ciudad zona; do
  echo "Aeropuerto $iata: $(post /ejemplo/aeropuertos "{\"codigoIata\":\"$iata\",\"nombre\":\"$nombre\",\"ciudad\":\"$ciudad\",\"pais\":\"Chile\",\"zonaHoraria\":\"$zona\"}" "$TOKEN")"
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
curl -s "$API/admin/tracking/tablero" -H "Authorization: Bearer $TOKEN" |
  python3 -c 'import json,sys
for v in json.load(sys.stdin):
    print("  {vueloId}  {codigoVuelo}  {origenIata}->{destinoIata}  {salidaProgramada}  {estadoActual}".format(**v))'
echo
echo "Administrador: admin.tracking@bandu.local / AdminTracking2026"
echo "Pasajero:      pasajero.tracking@bandu.local / Pasajero2026"
