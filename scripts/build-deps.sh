#!/bin/sh
# Build all @git-fabric/* dependency packages that were installed from
# GitHub source (they don't include pre-built dist/).
set -e

FABRIC_PKGS="
  @git-fabric/k8s
  @git-fabric/chat
  @git-fabric/git
  @git-fabric/cve
  @git-fabric/cloudflare
  @git-fabric/tailscale
  @git-fabric/proxmox
  @git-fabric/unifi
  @git-fabric/sandfly
  @git-fabric/aiana
"

for pkg in $FABRIC_PKGS; do
  dir="node_modules/$pkg"
  if [ ! -d "$dir" ]; then
    echo "  skip $pkg (not installed)"
    continue
  fi
  if [ -d "$dir/dist" ]; then
    echo "  skip $pkg (dist/ already present)"
    continue
  fi
  echo "  building $pkg..."
  cd "$dir"
  # Install dev deps for tsc, then build
  npm install --include=dev --ignore-scripts 2>/dev/null || true
  node_modules/.bin/tsc --project tsconfig.json 2>/dev/null || npx tsc --project tsconfig.json 2>/dev/null || true
  cd - > /dev/null
  if [ -d "$dir/dist" ]; then
    echo "  ✓ $pkg built"
  else
    echo "  ✗ $pkg build failed (will be skipped at runtime)"
  fi
done

echo "fabric dep build complete"
