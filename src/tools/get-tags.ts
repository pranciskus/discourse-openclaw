import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError, errorMessage } from "../types.js";

export function registerGetTags(
  api: PluginApi,
  client: DiscourseClient,
  _cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_get_tags",
    description: "List all tags on the Discourse forum with usage counts.",
    parameters: {
      type: "object" as const,
      properties: {},
    },
    async execute(_id: string, _params: Record<string, unknown>) {
      try {
        const data = await client.get<Record<string, unknown>>("/tags.json");
        const tags = (
          (data.tags as Array<Record<string, unknown>>) ?? []
        ).map((t) => ({
          id: t.id,
          text: t.text,
          count: t.count,
        }));
        return toolResult(tags);
      } catch (err) {
        return toolError(errorMessage(err));
      }
    },
  });
}
