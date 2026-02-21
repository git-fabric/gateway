#!/usr/bin/env node

/**
 * @git-fabric/gateway CLI
 *
 * Usage:
 *   fabric-gateway start            # Start gateway MCP server (stdio)
 *   fabric-gateway health           # Health check all registered apps
 *   fabric-gateway apps             # List registered apps and tools
 *   fabric-gateway route <tool>     # Route a tool call
 */

import { Command } from "commander";

const program = new Command();

program
  .name("fabric-gateway")
  .description("Fabric gateway — routes, connects, and orchestrates git-fabric apps")
  .version("0.1.0");

// ── start ───────────────────────────────────────────────────────────────────

program
  .command("start")
  .description("Start the gateway MCP server (stdio transport)")
  .option("--config <path>", "Path to gateway config YAML", "gateway.yaml")
  .action(async (opts) => {
    const { createRegistry } = await import("../dist/registry.js");
    const { createRouter } = await import("../dist/router.js");
    const { startGatewayServer } = await import("../dist/mcp/server.js");
    const { loadApps } = await import("../dist/loader.js");

    const registry = createRegistry();
    const apps = await loadApps(opts.config);

    for (const app of apps) {
      registry.register(app);
      console.error(`[gateway] registered: ${app.name} (${app.tools.length} tools)`);
    }

    const router = createRouter(registry);
    console.error(`[gateway] starting MCP server with ${registry.list().length} apps`);
    await startGatewayServer(registry, router);
  });

// ── health ──────────────────────────────────────────────────────────────────

program
  .command("health")
  .description("Health check all registered fabric apps")
  .option("--config <path>", "Path to gateway config YAML", "gateway.yaml")
  .action(async (opts) => {
    const { createRegistry } = await import("../dist/registry.js");
    const { createRouter } = await import("../dist/router.js");
    const { loadApps } = await import("../dist/loader.js");

    const registry = createRegistry();
    const apps = await loadApps(opts.config);
    for (const app of apps) registry.register(app);

    const router = createRouter(registry);
    const health = await router.healthCheck();
    console.log(JSON.stringify(health, null, 2));
  });

// ── apps ────────────────────────────────────────────────────────────────────

program
  .command("apps")
  .description("List registered apps and their tools")
  .option("--config <path>", "Path to gateway config YAML", "gateway.yaml")
  .action(async (opts) => {
    const { createRegistry } = await import("../dist/registry.js");
    const { loadApps } = await import("../dist/loader.js");

    const registry = createRegistry();
    const apps = await loadApps(opts.config);
    for (const app of apps) registry.register(app);

    for (const app of registry.list()) {
      console.log(`\n${app.name} v${app.version}`);
      console.log(`  ${app.description}`);
      for (const tool of app.tools) {
        console.log(`  - ${tool.name}: ${tool.description.slice(0, 80)}`);
      }
    }
  });

program.parse();
