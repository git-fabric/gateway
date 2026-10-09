/**
 * @git-fabric/gateway — shared types
 *
 * The gateway's core abstraction: fabric apps register themselves,
 * and consumers discover + invoke them through the gateway.
 */

// ── App registration ────────────────────────────────────────────────────────

export interface FabricApp {
  name: string;                  // e.g. "@git-fabric/cve"
  version: string;
  description: string;
  tools: FabricTool[];
  health: () => Promise<HealthStatus>;
}

export interface FabricTool {
  name: string;                  // e.g. "cve_scan"
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: ToolAnnotations;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

// MCP tool annotation hints, passed through to tools/list unchanged.
// Consumers treat a tool without readOnlyHint/destructiveHint as one that writes.
export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;        // does not modify its environment
  destructiveHint?: boolean;     // may delete or overwrite (only meaningful when not read-only)
  idempotentHint?: boolean;      // repeat calls with the same args have no extra effect
  openWorldHint?: boolean;       // reaches systems outside the fabric
}

export interface HealthStatus {
  app: string;
  status: "healthy" | "degraded" | "unavailable";
  latencyMs?: number;
  details?: Record<string, unknown>;
}

// ── Registry ────────────────────────────────────────────────────────────────

export interface AppRegistry {
  register(app: FabricApp): void;
  unregister(name: string): void;
  get(name: string): FabricApp | undefined;
  list(): FabricApp[];
  findTool(toolName: string): { app: FabricApp; tool: FabricTool } | undefined;
}

// ── Gateway config ──────────────────────────────────────────────────────────

export interface GatewayConfig {
  apps: AppConfig[];
}

export interface AppConfig {
  name: string;                  // e.g. "@git-fabric/cve"
  enabled: boolean;
  env?: Record<string, string>;  // env vars to pass to the app
}

// ── Route result ────────────────────────────────────────────────────────────

export interface RouteResult {
  app: string;
  tool: string;
  result: unknown;
  durationMs: number;
}
