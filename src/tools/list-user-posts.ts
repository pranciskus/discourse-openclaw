import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError } from "../types.js";

export function registerListUserPosts(
  api: PluginApi,
  client: DiscourseClient,
  _cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_list_user_posts",
    description: "List recent posts by a Discourse user.",
    parameters: {
      type: "object" as const,
      properties: {
        username: {
          type: "string",
          description: "Username whose posts to list",
        },
        offset: {
          type: "number",
          description: "Offset for pagination (default 0)",
        },
        limit: {
          type: "number",
          description: "Max posts to return (default 30, max 50)",
        },
      },
      required: ["username"],
    },
    async execute(_id: string, params: Record<string, unknown>) {
      try {
        const username = encodeURIComponent(params.username as string);
        const offset = (params.offset as number) ?? 0;
        const limit = Math.min((params.limit as number) ?? 30, 50);
        // filter=4 is "posts", filter=5 is "replies"
        const data = await client.get<Record<string, unknown>>(
          `/user_actions.json?offset=${offset}&username=${username}&filter=4,5`,
        );
        const actions = (
          (data.user_actions as Array<Record<string, unknown>>) ?? []
        ).slice(0, limit);
        return toolResult(
          actions.map((a) => ({
            post_id: a.post_id,
            topic_id: a.topic_id,
            post_number: a.post_number,
            slug: a.slug,
            title: a.title,
            created_at: a.created_at,
            excerpt: a.excerpt,
            category_id: a.category_id,
          })),
        );
      } catch (err) {
        return toolError((err as Error).message);
      }
    },
  });
}
