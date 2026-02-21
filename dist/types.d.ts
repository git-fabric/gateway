/**
 * @git-fabric/gateway — shared types
 *
 * The gateway's core abstraction: fabric apps register themselves,
 * and consumers discover + invoke them through the gateway.
 */
export interface FabricApp {
    name: string;
    version: string;
    description: string;
    tools: FabricTool[];
    health: () => Promise<HealthStatus>;
}
export interface FabricTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (args: Record<string, unknown>) => Promise<unknown>;
}
export interface HealthStatus {
    app: string;
    status: "healthy" | "degraded" | "unavailable";
    latencyMs?: number;
    details?: Record<string, unknown>;
}
export interface AppRegistry {
    register(app: FabricApp): void;
    unregister(name: string): void;
    get(name: string): FabricApp | undefined;
    list(): FabricApp[];
    findTool(toolName: string): {
        app: FabricApp;
        tool: FabricTool;
    } | undefined;
}
export interface GatewayConfig {
    apps: AppConfig[];
}
export interface AppConfig {
    name: string;
    enabled: boolean;
    env?: Record<string, string>;
}
export interface RouteResult {
    app: string;
    tool: string;
    result: unknown;
    durationMs: number;
}
//# sourceMappingURL=types.d.ts.map