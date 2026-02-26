import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError } from "../types.js";

export function registerCreateTopic(
  api: PluginApi,
  client: DiscourseClient,
  _cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_create_topic",
    description:
      "Create a new Discourse topic. Requires API key and allowWrites.",
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
        const body: Record<string, unknown> = {
          title: params.title,
          raw: params.raw,
        };
        if (params.category_id != null) body.category = params.category_id;
        if (params.tags != null) body.tags = params.tags;

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
        return toolError((err as Error).message);
      }
    },
  });
}
