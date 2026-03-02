import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError, errorMessage } from "../types.js";
import {
  positiveInt,
  optionalString,
  optionalPositiveInt,
  optionalStringArray,
} from "../validate.js";

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
        const topicId = positiveInt(params.topic_id, "topic_id");
        const body: Record<string, unknown> = {};
        const title = optionalString(params.title);
        if (title != null) body.title = title;
        const categoryId = optionalPositiveInt(
          params.category_id,
          "category_id",
        );
        if (categoryId != null) body.category_id = categoryId;
        const tags = optionalStringArray(params.tags, "tags");
        if (tags != null) body.tags = tags;

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
        return toolError(errorMessage(err));
      }
    },
  });
}
