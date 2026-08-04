#!/usr/bin/env bash
# Starts the full AutoCare stack (infra + services + frontend) via Docker.
# Usage: ./scripts/dev-up.sh [service...]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.yml"

cd "$ROOT_DIR"
docker compose -f "$COMPOSE_FILE" up --build -d "$@"

echo ""
echo "AutoCare is starting. Services:"
echo "  Frontend     -> http://localhost:3000"
echo "  API Gateway  -> http://localhost:8080"
echo "  Eureka       -> http://localhost:8761"
echo ""
echo "Follow logs with:  docker compose -f $COMPOSE_FILE logs -f"
