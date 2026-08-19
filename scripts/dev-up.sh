#!/usr/bin/env bash
# Lance (ou relance) tout l'environnement de dev VoyagIn en écoute sur le réseau local :
# détecte l'IP Wi-Fi actuelle, met à jour les .env de web/mobile si elle a changé,
# puis (re)démarre Postgres, le backend, le web, Expo et Prisma Studio.
#
# Usage : ./scripts/dev-up.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.dev/logs"
PID_DIR="$ROOT_DIR/.dev/pids"
mkdir -p "$LOG_DIR" "$PID_DIR"

BACKEND_PORT=3000
WEB_PORT=5173
METRO_PORT=8081
STUDIO_PORT=5555

# --- 1. Détecter l'IP Wi-Fi locale -----------------------------------------

IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "$IP" ]; then
  IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [ -z "$IP" ]; then
  echo "Impossible de détecter une IP Wi-Fi (interfaces en0/en1). Es-tu connecté au réseau ?" >&2
  exit 1
fi

WEB_ENV="$ROOT_DIR/packages/web/.env"
MOBILE_ENV="$ROOT_DIR/packages/mobile/.env"

PREVIOUS_IP=""
if [ -f "$WEB_ENV" ]; then
  PREVIOUS_IP="$(sed -nE 's#.*http://([0-9.]+):.*#\1#p' "$WEB_ENV" | head -n1)"
fi

if [ "$IP" = "$PREVIOUS_IP" ]; then
  echo "IP Wi-Fi inchangée : $IP"
  IP_CHANGED=0
else
  echo "IP Wi-Fi : ${PREVIOUS_IP:-<aucune>} -> $IP"
  IP_CHANGED=1
fi

echo "VITE_API_URL=\"http://$IP:$BACKEND_PORT\"" > "$WEB_ENV"
echo "EXPO_PUBLIC_API_URL=\"http://$IP:$BACKEND_PORT\"" > "$MOBILE_ENV"

# --- 2. Base de données -----------------------------------------------------

echo "Postgres..."
(cd "$ROOT_DIR" && docker compose up -d postgres) > "$LOG_DIR/postgres.log" 2>&1

# --- 3. Libérer les ports avant de relancer ---------------------------------

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti "tcp:$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "Arrêt du process déjà sur le port $port ($pids)"
    kill -9 $pids 2>/dev/null || true
  fi
}

for port in "$BACKEND_PORT" "$WEB_PORT" "$METRO_PORT" "$STUDIO_PORT"; do
  kill_port "$port"
done

# --- 4. (Re)démarrer les 4 services -----------------------------------------

start_service() {
  local name="$1"
  local dir="$2"
  shift 2
  echo "Démarrage $name..."
  (cd "$dir" && nohup "$@" > "$LOG_DIR/$name.log" 2>&1 &)
  disown 2>/dev/null || true
}

start_service backend "$ROOT_DIR/packages/backend" npx ts-node-dev --respawn src/infrastructure/server.ts
start_service web "$ROOT_DIR/packages/web" npx vite --host 0.0.0.0 --port "$WEB_PORT"
start_service studio "$ROOT_DIR/packages/backend" npx prisma studio --port "$STUDIO_PORT"

if [ "$IP_CHANGED" = "1" ]; then
  rm -rf "$ROOT_DIR/packages/mobile/.expo" "$ROOT_DIR/packages/mobile/node_modules/.cache"
  start_service mobile "$ROOT_DIR/packages/mobile" npx expo start -c
else
  start_service mobile "$ROOT_DIR/packages/mobile" npx expo start
fi

# --- 5. Attendre que chaque service réponde ---------------------------------

wait_for() {
  local name="$1"
  local url="$2"
  for _ in $(seq 1 30); do
    if curl -s -o /dev/null "$url"; then
      echo "  $name OK -> $url"
      return 0
    fi
    sleep 1
  done
  echo "  $name ne répond pas encore sur $url (regarde $LOG_DIR/$name.log)" >&2
}

echo ""
echo "Attente des services..."
wait_for backend "http://$IP:$BACKEND_PORT/api/health"
wait_for web "http://$IP:$WEB_PORT"
wait_for mobile "http://$IP:$METRO_PORT"
wait_for studio "http://$IP:$STUDIO_PORT"

# --- 6. Résumé ---------------------------------------------------------------

echo ""
echo "=========================================="
echo " VoyagIn — environnement de dev sur $IP"
echo "=========================================="
echo " API          http://$IP:$BACKEND_PORT"
echo " Swagger      http://$IP:$BACKEND_PORT/api-docs"
echo " Web          http://$IP:$WEB_PORT"
echo " Mobile       exp://$IP:$METRO_PORT   (Expo Go)"
echo " Prisma Studio http://$IP:$STUDIO_PORT"
echo "=========================================="
echo " Logs : $LOG_DIR/"
