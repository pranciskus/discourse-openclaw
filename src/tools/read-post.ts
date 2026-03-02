import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError, errorMessage } from "../types.js";
import { positiveInt } from "../validate.js";

export function registerReadPost(
  api: PluginApi,
  client: DiscourseClient,
  _cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_read_post",
    description: "Read a single Discourse post by ID. Returns content and metadata.",
    parameters: {
      type: "object" as const,
      properties: {
        post_id: { type: "number", description: "Discourse post ID" },
      },
      required: ["post_id"],
    },
    async execute(_id: string, params: Record<string, unknown>) {
      try {
        const postId = positiveInt(params.post_id, "post_id");
        const data = await client.get<Record<string, unknown>>(
          `/posts/${postId}.json`,
        );
        return toolResult({
          id: data.id,
          topic_id: data.topic_id,
          topic_slug: data.topic_slug,
          post_number: data.post_number,
          username: data.username,
          name: data.name,
          created_at: data.created_at,
          raw: data.raw,
          reply_count: data.reply_count,
          like_count: data.like_count,
        });
      } catch (err) {
        return toolError(errorMessage(err));
      }
    },
  });
}
