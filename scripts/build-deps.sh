#!/bin/sh
# Build all @git-fabric/* dependency packages that were installed from
# GitHub source (they don't include pre-built dist/).
set -e

ROOT=$(pwd)

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
  dir="$ROOT/node_modules/$pkg"
  if [ ! -d "$dir" ]; then
    echo "  skip $pkg (not installed)"
    continue
  fi
  if [ -d "$dir/dist" ]; then
    echo "  skip $pkg (dist/ already present)"
    continue
  fi
  if [ ! -f "$dir/tsconfig.json" ]; then
    echo "  skip $pkg (no tsconfig.json)"
    continue
  fi
  echo "  building $pkg..."
  # Install dev deps for TypeScript compiler
  npm install --prefix "$dir" --include=dev --ignore-scripts 2>/dev/null || true
  # Run tsc from the package directory
  (cd "$dir" && node_modules/.bin/tsc --project tsconfig.json 2>/dev/null) || true
  if [ -d "$dir/dist" ]; then
    echo "  ✓ $pkg"
  else
    echo "  ✗ $pkg build failed"
  fi
done

echo "fabric dep build complete"
