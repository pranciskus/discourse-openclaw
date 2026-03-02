import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError, errorMessage } from "../types.js";
import { nonEmptyString, optionalPositiveInt } from "../validate.js";

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
        const q = nonEmptyString(params.query, "query");
        const maxResults = Math.min(
          optionalPositiveInt(params.max_results, "max_results") ?? 10,
          50,
        );
        const data = await client.get<Record<string, unknown>>(
          `/search.json?q=${encodeURIComponent(q)}`,
        );
        const topics = (
          (data.topics as Array<Record<string, unknown>>) ?? []
        ).slice(0, maxResults).map((t) => ({
          id: t.id,
          title: t.title,
          slug: t.slug,
          category_id: t.category_id,
          created_at: t.created_at,
          posts_count: t.posts_count,
          views: t.views,
        }));
        const posts = (
          (data.posts as Array<Record<string, unknown>>) ?? []
        ).slice(0, maxResults).map((p) => ({
          id: p.id,
          topic_id: p.topic_id,
          username: p.username,
          created_at: p.created_at,
          blurb: p.blurb,
          post_number: p.post_number,
        }));
        return toolResult({ topics, posts });
      } catch (err) {
        return toolError(errorMessage(err));
      }
    },
  });
}
