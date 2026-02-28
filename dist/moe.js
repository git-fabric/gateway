/**
 * @git-fabric/gateway — MoE Router
 *
 * Mixture-of-Experts keyword router. Given a natural language query,
 * scores each registered fabric app and returns a ranked list of
 * routing suggestions. Pure function — no I/O, no side effects.
 *
 * Ported and rewritten from cortex-io/cortex moe-router.js,
 * updated for the git-fabric app registry.
 */
// ── Route table ──────────────────────────────────────────────────────────────
const ROUTES = [
    {
        app: "@git-fabric/proxmox",
        toolPrefix: "pve_",
        priority: 100,
        keywords: [
            "proxmox", "pve", "vm", "virtual machine", "lxc", "container",
            "hypervisor", "node", "vcpu", "snapshot", "qemu",
            "storage", "disk", "cluster", "migrate",
        ],
    },
    {
        app: "@git-fabric/unifi",
        toolPrefix: "unifi_",
        priority: 100,
        keywords: [
            "unifi", "network", "wifi", "wireless", "ssid", "access point", "ap",
            "client", "bandwidth", "switch", "vlan", "site", "host console",
            "ubiquiti", "ui.com",
        ],
    },
    {
        app: "@git-fabric/k8s",
        toolPrefix: "k8s_",
        priority: 100,
        keywords: [
            "kubernetes", "k8s", "k3s", "pod", "deployment", "namespace",
            "kubectl", "ingress", "configmap", "secret", "service", "cluster",
            "helm", "node taint", "daemonset", "statefulset", "replicaset",
        ],
    },
    {
        app: "@git-fabric/cloudflare",
        toolPrefix: "cf_",
        priority: 90,
        keywords: [
            "cloudflare", "dns", "zone", "record", "cname", "a record",
            "cache", "kv", "worker", "page rule", "ddns", "tunnel",
        ],
    },
    {
        app: "@git-fabric/tailscale",
        toolPrefix: "tailscale_",
        priority: 90,
        keywords: [
            "tailscale", "vpn", "mesh", "acl", "auth key", "device",
            "exit node", "subnet router", "magic dns", "tailnet",
        ],
    },
    {
        app: "@git-fabric/cve",
        toolPrefix: "cve_",
        priority: 90,
        keywords: [
            "cve", "vulnerability", "vuln", "patch", "remediat",
            "security scan", "nvd", "advisory", "exploit",
        ],
    },
    {
        app: "@git-fabric/sandfly",
        toolPrefix: "sandfly_",
        priority: 90,
        keywords: [
            "sandfly", "intrusion", "threat", "malware", "rootkit",
            "incident response", "linux security", "agentless scan",
            "ioc", "indicator of compromise",
        ],
    },
    {
        app: "@git-fabric/git",
        toolPrefix: "git_",
        priority: 80,
        keywords: [
            "git", "commit", "branch", "pull request", "pr", "repo",
            "push", "merge", "diff", "stash", "tag", "release",
        ],
    },
    {
        app: "@git-fabric/chat",
        toolPrefix: "chat_",
        priority: 80,
        keywords: [
            "chat", "conversation", "session", "message", "thread",
            "fork session", "search history", "context inject",
        ],
    },
    {
        app: "@git-fabric/aiana",
        toolPrefix: "aiana_",
        priority: 80,
        keywords: [
            "aiana", "memory", "recall", "semantic search", "remember",
            "cross-project", "context recall", "vector store",
        ],
    },
];
// ── Thresholds ───────────────────────────────────────────────────────────────
const THRESHOLD_ROUTE = 1.0; // confidence >= 1.0 → force route
const THRESHOLD_SUGGEST = 0.5; // confidence >= 0.5 → suggest
// ── routeQuery ───────────────────────────────────────────────────────────────
/**
 * Score all routes against a natural language query and return a ranked result.
 */
export function routeQuery(query) {
    const lower = query.toLowerCase();
    const matches = [];
    for (const route of ROUTES) {
        let score = 0;
        const matchedKeywords = [];
        for (const kw of route.keywords) {
            if (lower.includes(kw)) {
                score += route.priority;
                matchedKeywords.push(kw);
            }
        }
        if (score > 0) {
            matches.push({
                app: route.app,
                toolPrefix: route.toolPrefix,
                score,
                confidence: Math.min(score / 100, 1.0),
                matchedKeywords,
            });
        }
    }
    matches.sort((a, b) => b.score - a.score);
    const top = matches[0] ?? null;
    let action = "none";
    if (top) {
        action = top.confidence >= THRESHOLD_ROUTE ? "route" : "suggest";
        if (top.confidence < THRESHOLD_SUGGEST)
            action = "none";
    }
    return { action, matches, top };
}
//# sourceMappingURL=moe.js.map