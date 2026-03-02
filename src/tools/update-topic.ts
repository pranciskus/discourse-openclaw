import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError } from "../types.js";

export function registerUpdateTopic(
  api: PluginApi,
  client: DiscourseClient,
  _cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_update_topic",
    description:
      "Update a Discourse topic's title, category, or tags. Requires API key and allowWrites. " +
      "IMPORTANT: You must call discourse_site_rules first and follow the rules.",
    parameters: {
      type: "object" as const,
      properties: {
        topic_id: {
          type: "number",
          description: "Topic ID to update",
        },
        title: {
          type: "string",
          description: "New title (optional)",
        },
        category_id: {
          type: "number",
          description: "New category ID (optional)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "New tags (optional)",
        },
      },
      required: ["topic_id"],
    },
    async execute(_id: string, params: Record<string, unknown>) {
      try {
        const topicId = params.topic_id as number;
        const body: Record<string, unknown> = {};
        if (params.title != null) body.title = params.title;
        if (params.category_id != null) body.category_id = params.category_id;
        if (params.tags != null) body.tags = params.tags;

        if (Object.keys(body).length === 0) {
          return toolError(
            "At least one of title, category_id, or tags must be provided",
          );
        }

        const data = await client.put<Record<string, unknown>>(
          `/t/-/${topicId}.json`,
          body,
        );
        const basic = data.basic_topic as Record<string, unknown> | undefined;
        return toolResult({
          id: basic?.id ?? topicId,
          title: basic?.title,
          slug: basic?.slug,
          category_id: basic?.category_id,
        });
      } catch (err) {
        return toolError((err as Error).message);
      }
    },
  });
}
