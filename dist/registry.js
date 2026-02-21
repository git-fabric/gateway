/**
 * App Registry
 *
 * In-memory registry of fabric apps. Apps register themselves
 * on startup; the gateway routes tool calls through the registry.
 */
export function createRegistry() {
    const apps = new Map();
    return {
        register(app) {
            if (apps.has(app.name)) {
                throw new Error(`App already registered: ${app.name}`);
            }
            apps.set(app.name, app);
        },
        unregister(name) {
            apps.delete(name);
        },
        get(name) {
            return apps.get(name);
        },
        list() {
            return Array.from(apps.values());
        },
        findTool(toolName) {
            for (const app of apps.values()) {
                const tool = app.tools.find((t) => t.name === toolName);
                if (tool)
                    return { app, tool };
            }
            return undefined;
        },
    };
}
//# sourceMappingURL=registry.js.map