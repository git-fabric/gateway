# @git-fabric/gateway — multi-stage build
#
# Fabric app deps are installed from GitHub source (no pre-built dist/).
# scripts/build-deps.sh compiles each one during the Docker build.

FROM node:22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

# Install gateway deps (including GitHub-sourced fabric apps)
COPY package*.json ./
RUN npm ci

# Build each @git-fabric/* dependency (they ship without dist/)
COPY scripts/build-deps.sh ./scripts/build-deps.sh
RUN sh scripts/build-deps.sh

# Build the gateway itself
COPY tsconfig.json ./
COPY src/ ./src/
COPY bin/ ./bin/
RUN npm run build

# ── Production image ─────────────────────────────────────────────────────────

FROM node:22-alpine

LABEL org.opencontainers.image.title="@git-fabric/gateway"
LABEL org.opencontainers.image.description="Fabric gateway — routes, connects, and orchestrates git-fabric apps"
LABEL org.opencontainers.image.source="https://github.com/git-fabric/gateway"

RUN addgroup -g 1001 -S fabric && adduser -u 1001 -S fabric -G fabric

WORKDIR /app

# Copy everything from builder (node_modules includes built fabric apps)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/package.json ./

# Default gateway config — override by mounting a ConfigMap at /app/gateway.yaml
COPY gateway.yaml ./

USER fabric
ENV NODE_ENV=production

ENTRYPOINT ["node", "bin/cli.js"]
CMD ["start"]
