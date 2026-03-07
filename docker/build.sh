#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

IMAGE_NAME="viascom/openfeature-editor"
TAG="${1:-latest}"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f "$SCRIPT_DIR/Dockerfile" \
  -t "$IMAGE_NAME:$TAG" \
  --push \
  "$PROJECT_DIR"
