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

import { createServer } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import type { Router } from "../router.js";
import type { AppRegistry } from "../types.js";
import { routeQuery } from "../moe.js";

// ── Built-in gateway tools ──────────────────────────────────────────────────

const GATEWAY_TOOLS = [
  {
    name: "fabric_health",
    description:
      "Health check across all registered fabric apps. Returns status, latency, and details for each app.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "fabric_apps",
    description:
      "List all registered fabric apps and their tools.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "fabric_route",
    description:
      "Explicitly route a tool call to a specific fabric app. Use when tool names collide across apps.",
    inputSchema: {
      type: "object" as const,
      properties: {
        app: { type: "string", description: "App name (e.g. @git-fabric/cve)" },
        tool: { type: "string", description: "Tool name within the app" },
        args: { type: "object", description: "Arguments to pass to the tool" },
      },
      required: ["app", "tool"],
    },
  },
  {
    name: "fabric_suggest",
    description:
      "MoE router: given a natural language query, suggests which fabric app(s) can handle it and what tool prefix to use. Returns confidence scores and matched keywords. Does not execute anything.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Natural language description of what you want to do." },
      },
      required: ["query"],
    },
  },
];

// ── Server ──────────────────────────────────────────────────────────────────

export async function startGatewayServer(
  registry: AppRegistry,
  router: Router,
): Promise<void> {
  const server = new Server(
    { name: "@git-fabric/gateway", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Combine gateway tools + all registered app tools
    const appTools = registry.list().flatMap((app) =>
      app.tools.map((tool) => ({
        name: tool.name,
        description: `[${app.name}] ${tool.description}`,
        inputSchema: tool.inputSchema,
      })),
    );

    return { tools: [...GATEWAY_TOOLS, ...appTools] };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Built-in gateway tools
    switch (name) {
      case "fabric_health": {
        const health = await router.healthCheck();
        return { content: [{ type: "text", text: JSON.stringify(health, null, 2) }] };
      }

      case "fabric_apps": {
        const tools = router.listTools();
        const apps = registry.list().map((app) => ({
          name: app.name,
          version: app.version,
          description: app.description,
          tools: app.tools.map((t) => t.name),
        }));
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ apps, totalTools: tools.length }, null, 2),
          }],
        };
      }

      case "fabric_suggest": {
        const query = args?.query as string;
        if (!query) throw new Error("query is required");
        const result = routeQuery(query);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case "fabric_route": {
        const appName = args?.app as string;
        const toolName = args?.tool as string;
        const toolArgs = (args?.args as Record<string, unknown>) ?? {};

        const app = registry.get(appName);
        if (!app) throw new Error(`App not found: ${appName}`);

        const tool = app.tools.find((t) => t.name === toolName);
        if (!tool) throw new Error(`Tool ${toolName} not found in ${appName}`);

        const start = Date.now();
        const result = await tool.execute(toolArgs);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              app: appName,
              tool: toolName,
              durationMs: Date.now() - start,
              result,
            }, null, 2),
          }],
        };
      }
    }

    // Route to fabric app tool
    const routeResult = await router.route(name, (args ?? {}) as Record<string, unknown>);
    return {
      content: [{
        type: "text",
        text: typeof routeResult.result === "string"
          ? routeResult.result
          : JSON.stringify(routeResult.result, null, 2),
      }],
    };
  });

  const httpPort = process.env.MCP_HTTP_PORT ? Number(process.env.MCP_HTTP_PORT) : null;

  if (httpPort) {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);

    const readBody = (req: import("node:http").IncomingMessage): Promise<unknown> =>
      new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", () => {
          try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
          catch { resolve(undefined); }
        });
        req.on("error", reject);
      });

    const httpServer = createServer(async (req, res) => {
      if (req.url === "/healthz" || req.url === "/health") { res.writeHead(200).end("ok"); return; }
      if (req.url === "/mcp" || req.url === "/") {
        const body = await readBody(req);
        await transport.handleRequest(req, res, body);
        return;
      }
      res.writeHead(404).end("not found");
    });

    httpServer.listen(httpPort, () => {
      console.log(`@git-fabric/gateway MCP server listening on :${httpPort}`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}
