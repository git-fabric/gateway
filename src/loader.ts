/**
 * App Loader
 *
 * Loads fabric apps from a gateway config file (gateway.yaml).
 * Each app is dynamically imported and instantiated.
 *
 * Config format:
 *   apps:
 *     - name: "@git-fabric/cve"
 *       enabled: true
 *       env:
 *         STATE_REPO: "ry-ops/git-steer-state"
 *
 * For now, apps are loaded as npm packages. Future: support
 * loading from URLs, git repos, or container images.
 */

import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import type { FabricApp, GatewayConfig } from "./types.js";

export async function loadApps(configPath: string): Promise<FabricApp[]> {
  let config: GatewayConfig;

  try {
    const raw = await readFile(configPath, "utf-8");
    config = parseYaml(raw) as GatewayConfig;
  } catch {
    console.error(`[gateway] No config found at ${configPath}, starting with zero apps`);
    return [];
  }

  const apps: FabricApp[] = [];

  for (const appConfig of config.apps ?? []) {
    if (!appConfig.enabled) {
      console.error(`[gateway] skipping disabled app: ${appConfig.name}`);
      continue;
    }

    // Inject env vars for the app
    if (appConfig.env) {
      for (const [key, value] of Object.entries(appConfig.env)) {
        process.env[key] = value;
      }
    }

    try {
      // Dynamic import — the app must export a `createApp` function
      // that returns a FabricApp conforming to the interface
      const mod = await import(appConfig.name);

      if (typeof mod.createApp !== "function") {
        console.error(`[gateway] ${appConfig.name} does not export createApp(), skipping`);
        continue;
      }

      const app: FabricApp = await mod.createApp();
      apps.push(app);
    } catch (err: unknown) {
      console.error(`[gateway] failed to load ${appConfig.name}: ${(err as Error).message}`);
    }
  }

  return apps;
}
