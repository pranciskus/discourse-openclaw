import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError } from "../types.js";

export function registerGetCategories(
  api: PluginApi,
  client: DiscourseClient,
  _cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_get_categories",
    description: "List all categories on the Discourse forum.",
    parameters: {
      type: "object" as const,
      properties: {},
    },
    async execute() {
      try {
        const data = await client.get<Record<string, unknown>>(
          "/categories.json",
        );
        const categoryList = data.category_list as
          | { categories?: Array<Record<string, unknown>> }
          | undefined;
        const categories = (categoryList?.categories ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          color: c.color,
          description: c.description_text
            ? String(c.description_text).slice(0, 200)
            : undefined,
          topic_count: c.topic_count,
          parent_category_id: c.parent_category_id,
        }));
        return toolResult(categories);
      } catch (err) {
        return toolError((err as Error).message);
      }
    },
  });
}
