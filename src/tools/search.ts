import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError } from "../types.js";

export function registerSearch(
  api: PluginApi,
  client: DiscourseClient,
  _cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_search",
    description: "Search Discourse forum topics and posts.",
    parameters: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        max_results: {
          type: "number",
          description: "Max results to return (default 10, max 50)",
        },
      },
      required: ["query"],
    },
    async execute(_id: string, params: Record<string, unknown>) {
      try {
        const q = encodeURIComponent(params.query as string);
        const maxResults = Math.min((params.max_results as number) ?? 10, 50);
        const data = await client.get<Record<string, unknown>>(
          `/search.json?q=${q}`,
        );
        const topics = (
          (data.topics as Array<Record<string, unknown>>) ?? []
        ).slice(0, maxResults);
        const posts = (
          (data.posts as Array<Record<string, unknown>>) ?? []
        ).slice(0, maxResults);
        return toolResult({ topics, posts });
      } catch (err) {
        return toolError((err as Error).message);
      }
    },
  });
}
