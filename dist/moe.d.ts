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
export interface MoeRoute {
    app: string;
    toolPrefix: string;
    keywords: string[];
    priority: number;
}
export interface MoeMatch {
    app: string;
    toolPrefix: string;
    score: number;
    confidence: number;
    matchedKeywords: string[];
}
export interface MoeResult {
    action: "route" | "suggest" | "none";
    matches: MoeMatch[];
    top: MoeMatch | null;
}
/**
 * Score all routes against a natural language query and return a ranked result.
 */
export declare function routeQuery(query: string): MoeResult;
//# sourceMappingURL=moe.d.ts.map