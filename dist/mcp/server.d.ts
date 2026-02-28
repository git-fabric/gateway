/**
 * @git-fabric/gateway — MCP Server
 *
 * The gateway MCP server aggregates all registered fabric app tools
 * into a single MCP surface. Consumers connect to one server and
 * get access to every fabric app's tools.
 *
 * Built-in tools:
 *   fabric_health   — health check across all registered apps
 *   fabric_apps     — list registered apps and their tools
 *   fabric_route    — explicitly route a call to a specific app
 *   fabric_suggest  — MoE router: suggest which app handles a query
 *
 * All registered app tools are also exposed directly by name.
 */
import type { Router } from "../router.js";
import type { AppRegistry } from "../types.js";
export declare function startGatewayServer(registry: AppRegistry, router: Router): Promise<void>;
//# sourceMappingURL=server.d.ts.map