import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError } from "../types.js";

export function registerUnanswered(
  api: PluginApi,
  client: DiscourseClient,
  cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_unanswered",
    description:
      "Find recent unanswered topics (no staff replies). Uses configured staff usernames to detect answered topics.",
    parameters: {
      type: "object" as const,
      properties: {
        hours: {
          type: "number",
          description: "Look back N hours (default 24)",
        },
        category_slug: {
          type: "string",
          description: "Category slug to filter by (optional)",
        },
        max_results: {
          type: "number",
          description: "Max topics to return (default 10)",
        },
      },
    },
    async execute(_id: string, params: Record<string, unknown>) {
      try {
        const hours = (params.hours as number) ?? 24;
        const cat = params.category_slug as string | undefined;
        const maxResults = (params.max_results as number) ?? 10;
        const cutoff = new Date(
          Date.now() - hours * 3_600_000,
        ).toISOString();
        const path = cat
          ? `/c/${cat}.json?order=created`
          : `/latest.json?order=created`;
        const data = await client.get<Record<string, unknown>>(path);
        const topicList = data.topic_list as
          | { topics?: Array<Record<string, unknown>> }
          | undefined;
        const topics = (topicList?.topics ?? []).filter(
          (t) => (t.created_at as string) >= cutoff,
        );

        const staff = new Set(cfg.staffUsernames);
        const unanswered: Array<Record<string, unknown>> = [];

        for (const t of topics) {
          if (unanswered.length >= maxResults) break;
          try {
            const topic = await client.get<Record<string, unknown>>(
              `/t/${t.id}.json`,
            );
            const postStream = topic.post_stream as
              | { posts?: Array<Record<string, unknown>> }
              | undefined;
            const posts = postStream?.posts ?? [];
            const hasStaffReply = posts
              .slice(1)
              .some((p) => staff.has(p.username as string));
            if (!hasStaffReply) {
              unanswered.push({
                id: t.id,
                title: t.title,
                category_id: t.category_id,
                created_at: t.created_at,
                url: `${cfg.siteUrl}/t/${t.slug}/${t.id}`,
                post_count: t.posts_count,
              });
            }
          } catch {
            // Skip topics we can't read (e.g. private)
          }
        }

        return toolResult(unanswered);
      } catch (err) {
        return toolError((err as Error).message);
      }
    },
  });
}
