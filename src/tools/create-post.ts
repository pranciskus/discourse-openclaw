import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError, errorMessage } from "../types.js";
import { positiveInt, nonEmptyString } from "../validate.js";

export function registerCreatePost(
  api: PluginApi,
  client: DiscourseClient,
  cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_create_post",
    description:
      "Reply to an existing Discourse topic. Requires API key and allowWrites. " +
      "IMPORTANT: You must call discourse_site_rules first and follow the rules.",
    parameters: {
      type: "object" as const,
      properties: {
        topic_id: {
          type: "number",
          description: "Topic ID to reply to",
        },
        raw: {
          type: "string",
          description: "Post content in Markdown",
        },
      },
      required: ["topic_id", "raw"],
    },
    async execute(_id: string, params: Record<string, unknown>) {
      try {
        const topicId = positiveInt(params.topic_id, "topic_id");
        const rawContent = nonEmptyString(params.raw, "raw");
        const raw = `${rawContent}\n\n---\n${cfg.signature}`;
        const data = await client.post<Record<string, unknown>>(
          "/posts.json",
          { topic_id: topicId, raw },
        );
        return toolResult({
          id: data.id,
          topic_id: data.topic_id,
          post_number: data.post_number,
        });
      } catch (err) {
        return toolError(errorMessage(err));
      }
    },
  });
}
