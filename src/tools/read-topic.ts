import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError, errorMessage } from "../types.js";
import { positiveInt, optionalPositiveInt } from "../validate.js";

export function registerReadTopic(
  api: PluginApi,
  client: DiscourseClient,
  _cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_read_topic",
    description:
      "Read a Discourse topic by ID. Returns title, posts, and metadata.",
    parameters: {
      type: "object" as const,
      properties: {
        topic_id: { type: "number", description: "Discourse topic ID" },
        post_limit: {
          type: "number",
          description: "Max posts to return (default 20)",
        },
      },
      required: ["topic_id"],
    },
    async execute(_id: string, params: Record<string, unknown>) {
      try {
        const topicId = positiveInt(params.topic_id, "topic_id");
        const limit = optionalPositiveInt(params.post_limit, "post_limit") ?? 20;
        const data = await client.get<Record<string, unknown>>(
          `/t/${topicId}.json`,
        );
        const postStream = data.post_stream as
          | { posts?: Array<Record<string, unknown>> }
          | undefined;
        const posts = (postStream?.posts ?? []).slice(0, limit);
        return toolResult({
          title: data.title,
          category_id: data.category_id,
          tags: data.tags,
          created_at: data.created_at,
          views: data.views,
          posts_count: data.posts_count,
          posts: posts.map((p) => ({
            id: p.id,
            username: p.username,
            created_at: p.created_at,
            raw: p.raw,
            post_number: p.post_number,
          })),
        });
      } catch (err) {
        return toolError(errorMessage(err));
      }
    },
  });
}
