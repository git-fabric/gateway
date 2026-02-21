/**
 * Router
 *
 * Routes tool calls to the correct fabric app. Handles:
 * - Tool name resolution (finds which app owns a tool)
 * - Execution with timing
 * - Health checks across all registered apps
 * - Error isolation (one app failing doesn't take down others)
 */

import type { AppRegistry, RouteResult, HealthStatus } from "./types.js";

export interface Router {
  route(toolName: string, args: Record<string, unknown>): Promise<RouteResult>;
  healthCheck(): Promise<HealthStatus[]>;
  listTools(): { app: string; tool: string; description: string }[];
}

export function createRouter(registry: AppRegistry): Router {
  return {
    async route(toolName, args) {
      const match = registry.findTool(toolName);
      if (!match) {
        throw new Error(
          `No fabric app registered for tool "${toolName}". ` +
          `Available tools: ${registry.list().flatMap((a) => a.tools.map((t) => t.name)).join(", ") || "(none)"}`,
        );
      }

      const start = Date.now();
      try {
        const result = await match.tool.execute(args);
        return {
          app: match.app.name,
          tool: toolName,
          result,
          durationMs: Date.now() - start,
        };
      } catch (err: unknown) {
        throw new Error(
          `[${match.app.name}] ${toolName} failed: ${(err as Error).message}`,
        );
      }
    },

    async healthCheck() {
      const apps = registry.list();
      const results: HealthStatus[] = [];

      for (const app of apps) {
        const start = Date.now();
        try {
          const status = await app.health();
          results.push({ ...status, latencyMs: Date.now() - start });
        } catch {
          results.push({
            app: app.name,
            status: "unavailable",
            latencyMs: Date.now() - start,
          });
        }
      }

      return results;
    },

    listTools() {
      return registry.list().flatMap((app) =>
        app.tools.map((tool) => ({
          app: app.name,
          tool: tool.name,
          description: tool.description,
        })),
      );
    },
  };
}
