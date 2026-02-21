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
    listTools(): {
        app: string;
        tool: string;
        description: string;
    }[];
}
export declare function createRouter(registry: AppRegistry): Router;
//# sourceMappingURL=router.d.ts.map