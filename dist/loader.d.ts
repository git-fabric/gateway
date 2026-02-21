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
import type { FabricApp } from "./types.js";
export declare function loadApps(configPath: string): Promise<FabricApp[]>;
//# sourceMappingURL=loader.d.ts.map