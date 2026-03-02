import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError, errorMessage } from "../types.js";
import {
  nonEmptyString,
  optionalPositiveInt,
  optionalStringArray,
} from "../validate.js";

export function registerCreateTopic(
  api: PluginApi,
  client: DiscourseClient,
  cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_create_topic",
    description:
      "Create a new Discourse topic. Requires API key and allowWrites. " +
      "IMPORTANT: You must call discourse_site_rules first and follow the rules.",
    parameters: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Topic title (required)",
        },
        raw: {
          type: "string",
          description: "Topic body content in Markdown (required)",
        },
        category_id: {
          type: "number",
          description: "Category ID to post in (optional)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags to apply (optional)",
        },
      },
      required: ["title", "raw"],
    },
    async execute(_id: string, params: Record<string, unknown>) {
      try {
        const title = nonEmptyString(params.title, "title");
        const rawContent = nonEmptyString(params.raw, "raw");
        const raw = `${rawContent}\n\n---\n${cfg.signature}`;
        const body: Record<string, unknown> = { title, raw };
        const categoryId = optionalPositiveInt(
          params.category_id,
          "category_id",
        );
        if (categoryId != null) body.category = categoryId;
        const tags = optionalStringArray(params.tags, "tags");
        if (tags != null) body.tags = tags;

        const data = await client.post<Record<string, unknown>>(
          "/posts.json",
          body,
        );
        return toolResult({
          id: data.id,
          topic_id: data.topic_id,
          topic_slug: data.topic_slug,
        });
      } catch (err) {
        return toolError(errorMessage(err));
      }
    },
  });
}
