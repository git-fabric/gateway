<p align="center">
  <img src="gateway-banner.svg" alt="@git-fabric/gateway" width="900">
</p>

# @git-fabric/gateway

The connective tissue for [git-fabric](https://github.com/git-fabric). Routes, connects, and orchestrates fabric apps through a single MCP surface.

## What It Does

The gateway is a **tool aggregator**. Register any number of fabric apps (like [`@git-fabric/cve`](https://github.com/git-fabric/cve)), and the gateway exposes all their tools through one MCP server. Consumers connect once, access everything.

```
┌──────────────────────────┐
│  Consumer (git-steer,    │
│  Claude Desktop, etc.)   │
└────────────┬─────────────┘
             │ MCP (stdio)
    ┌────────▼────────┐
    │     gateway     │
    │  registry       │
    │  router         │
    │  health check   │
    └──┬─────┬─────┬──┘
       │     │     │
   ┌───▼──┐ ┌▼──┐ ┌▼───┐
   │ cve  │ │...│ │... │
   └──────┘ └───┘ └────┘
```

## Quick Start

### 1. Create a gateway config

```yaml
# gateway.yaml
apps:
  - name: "@git-fabric/cve"
    enabled: true
    env:
      GITHUB_TOKEN: "ghp_..."
      STATE_REPO: "ry-ops/git-steer-state"
      MANAGED_REPOS: "ry-ops/git-steer,ry-ops/blog"
```

### 2. Start the gateway

```bash
fabric-gateway start --config gateway.yaml
```

### 3. Connect from Claude Desktop

```json
{
  "mcpServers": {
    "git-fabric": {
      "command": "npx",
      "args": ["@git-fabric/gateway", "start"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    }
  }
}
```

Now every fabric app's tools appear as native MCP tools.

## Built-in Tools

| Tool | Description |
|------|-------------|
| `fabric_health` | Health check across all registered fabric apps |
| `fabric_apps` | List registered apps and their tools |
| `fabric_route` | Explicitly route a call to a specific app (for name collisions) |

All registered app tools are also exposed directly by their name (e.g. `cve_scan`, `cve_triage`).

## CLI

```bash
# Start gateway MCP server
fabric-gateway start

# Health check all apps
fabric-gateway health

# List registered apps and tools
fabric-gateway apps
```

## Creating a Fabric App

Any npm package can be a fabric app. Export a `createApp()` function that returns a `FabricApp`:

```typescript
import type { FabricApp } from "@git-fabric/gateway";

export async function createApp(): Promise<FabricApp> {
  return {
    name: "@git-fabric/my-app",
    version: "0.1.0",
    description: "What my app does",
    tools: [
      {
        name: "my_tool",
        description: "What my tool does",
        inputSchema: { type: "object", properties: { ... } },
        execute: async (args) => { ... },
      },
    ],
    health: async () => ({
      app: "@git-fabric/my-app",
      status: "healthy",
    }),
  };
}
```

## Architecture

```
src/
├── types.ts        # FabricApp, FabricTool, AppRegistry interfaces
├── registry.ts     # In-memory app registry
├── router.ts       # Tool routing + health checks
├── loader.ts       # Dynamic app loading from gateway.yaml
├── index.ts        # Barrel export
└── mcp/
    └── server.ts   # MCP server aggregating all app tools
```

## License

MIT
