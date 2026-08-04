#!/usr/bin/env bash
# Builds every AutoCare service (backend + frontend).
# Usage: ./scripts/build-all.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Building all backend services (aggregator POM)"
mvn clean package -DskipTests -f backend/pom.xml

if command -v npm >/dev/null 2>&1; then
  echo "==> Building frontend"
  (cd frontend && npm install && npm run build)
else
  echo "Skipping frontend build - npm not found"
fi

echo "==> Build complete"
