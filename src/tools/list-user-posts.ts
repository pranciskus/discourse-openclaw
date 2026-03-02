import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError, errorMessage } from "../types.js";
import {
  nonEmptyString,
  optionalNonNegativeInt,
  optionalPositiveInt,
} from "../validate.js";

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
        const username = nonEmptyString(params.username, "username");
        const offset =
          optionalNonNegativeInt(params.offset, "offset") ?? 0;
        const limit = Math.min(
          optionalPositiveInt(params.limit, "limit") ?? 30,
          50,
        );
        const data = await client.get<Record<string, unknown>>(
          `/user_actions.json?offset=${offset}&username=${encodeURIComponent(username)}&filter=4,5`,
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
        return toolError(errorMessage(err));
      }
    },
  });
}
