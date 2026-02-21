/**
 * App Registry
 *
 * In-memory registry of fabric apps. Apps register themselves
 * on startup; the gateway routes tool calls through the registry.
 */

import type { AppRegistry, FabricApp, FabricTool } from "./types.js";

export function createRegistry(): AppRegistry {
  const apps = new Map<string, FabricApp>();

  return {
    register(app: FabricApp): void {
      if (apps.has(app.name)) {
        throw new Error(`App already registered: ${app.name}`);
      }
      apps.set(app.name, app);
    },

    unregister(name: string): void {
      apps.delete(name);
    },

    get(name: string): FabricApp | undefined {
      return apps.get(name);
    },

    list(): FabricApp[] {
      return Array.from(apps.values());
    },

    findTool(toolName: string): { app: FabricApp; tool: FabricTool } | undefined {
      for (const app of apps.values()) {
        const tool = app.tools.find((t) => t.name === toolName);
        if (tool) return { app, tool };
      }
      return undefined;
    },
  };
}
