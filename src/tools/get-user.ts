import type { DiscourseClient } from "../client.js";
import type { PluginApi, DiscourseConfig } from "../config.js";
import { toolResult, toolError, errorMessage } from "../types.js";
import { nonEmptyString } from "../validate.js";

export function registerGetUser(
  api: PluginApi,
  client: DiscourseClient,
  _cfg: DiscourseConfig,
) {
  api.registerTool({
    name: "discourse_get_user",
    description: "Get a Discourse user profile by username.",
    parameters: {
      type: "object" as const,
      properties: {
        username: {
          type: "string",
          description: "Discourse username to look up",
        },
      },
      required: ["username"],
    },
    async execute(_id: string, params: Record<string, unknown>) {
      try {
        const username = nonEmptyString(params.username, "username");
        const data = await client.get<Record<string, unknown>>(
          `/u/${encodeURIComponent(username)}.json`,
        );
        const user = data.user as Record<string, unknown> | undefined;
        if (!user) return toolError(`User "${username}" not found`);
        return toolResult({
          id: user.id,
          username: user.username,
          name: user.name,
          title: user.title,
          trust_level: user.trust_level,
          admin: user.admin,
          moderator: user.moderator,
          created_at: user.created_at,
          bio_raw: user.bio_raw
            ? String(user.bio_raw).slice(0, 500)
            : undefined,
        });
      } catch (err) {
        return toolError(errorMessage(err));
      }
    },
  });
}
