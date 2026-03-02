import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError, errorMessage } from "../types.js";
import {
  optionalString,
  enumValue,
  optionalNonNegativeInt,
  optionalPositiveInt,
} from "../validate.js";

const ORDERS = [
  "default",
  "latest",
  "created",
  "activity",
  "views",
  "posts",
  "category",
  "likes",
  "op_likes",
  "posters",
] as const;

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
            "Sort order: default, latest, created, activity, views, posts, category, likes, op_likes, posters (default: latest)",
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
        const cat = optionalString(params.category_slug);
        const order = enumValue(params.order, ORDERS, "order", "latest");
        const page = optionalNonNegativeInt(params.page, "page") ?? 0;
        const maxResults =
          optionalPositiveInt(params.max_results, "max_results") ?? 20;
        const path = cat
          ? `/c/${encodeURIComponent(cat)}.json?order=${order}&page=${page}`
          : `/latest.json?order=${order}&page=${page}`;
        const data = await client.get<Record<string, unknown>>(path);
        const topicList = data.topic_list as
          | { topics?: Array<Record<string, unknown>> }
          | undefined;
        const topics = (topicList?.topics ?? []).slice(0, maxResults).map(
          (t) => ({
            id: t.id,
            title: t.title,
            slug: t.slug,
            category_id: t.category_id,
            created_at: t.created_at,
            posts_count: t.posts_count,
            views: t.views,
          }),
        );
        return toolResult(topics);
      } catch (err) {
        return toolError(errorMessage(err));
      }
    },
  });
}
