#!/usr/bin/env bash
# Stops the AutoCare Docker stack (optionally removing volumes).
# Usage: ./scripts/dev-down.sh [-v]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.yml"

cd "$ROOT_DIR"
docker compose -f "$COMPOSE_FILE" down "$@"
