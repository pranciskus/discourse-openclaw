import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError } from "../types.js";

export function registerFilterTopics(
  api: PluginApi,
  client: DiscourseClient,
  _cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_filter_topics",
    description:
      "List recent topics, optionally filtered by category. Useful for browsing and finding posts.",
    parameters: {
      type: "object" as const,
      properties: {
        category_slug: {
          type: "string",
          description: "Category slug to filter by (optional)",
        },
        order: {
          type: "string",
          description:
            "Sort order: latest, created, activity (default: latest)",
        },
        max_results: {
          type: "number",
          description: "Max topics to return (default 20)",
        },
        page: {
          type: "number",
          description: "Page number for pagination (default 0)",
        },
      },
    },
    async execute(_id: string, params: Record<string, unknown>) {
      try {
        const cat = params.category_slug as string | undefined;
        const order = (params.order as string) ?? "latest";
        const page = (params.page as number) ?? 0;
        const path = cat
          ? `/c/${cat}.json?order=${order}&page=${page}`
          : `/latest.json?order=${order}&page=${page}`;
        const data = await client.get<Record<string, unknown>>(path);
        const topicList = data.topic_list as
          | { topics?: Array<Record<string, unknown>> }
          | undefined;
        const topics = (topicList?.topics ?? []).slice(
          0,
          (params.max_results as number) ?? 20,
        );
        return toolResult(topics);
      } catch (err) {
        return toolError((err as Error).message);
      }
    },
  });
}
