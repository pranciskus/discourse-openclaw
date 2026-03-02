import type { PluginApi, DiscourseConfig } from "../config.js";
import { fetchLlmsTxt } from "../llms-txt.js";
import { toolResult } from "../types.js";

export function registerSiteRules(api: PluginApi, cfg: DiscourseConfig) {
  let cached: Awaited<ReturnType<typeof fetchLlmsTxt>> | null = null;

  api.registerTool({
    name: "discourse_site_rules",
    description:
      "Fetch the site's AI usage rules (llms.txt). " +
      "You MUST call this tool and follow the rules before using any write tool.",
    parameters: {
      type: "object" as const,
      properties: {},
    },
    async execute() {
      if (!cached) {
        cached = await fetchLlmsTxt(cfg.siteUrl, cfg.requestTimeoutMs);
      }

      if (!cached.found) {
        return toolResult({
          site: cfg.siteUrl,
          rules_found: false,
          message: "No llms.txt found. No additional restrictions apply.",
        });
      }

      return toolResult({
        site: cfg.siteUrl,
        rules_found: true,
        rules: cached.text,
        message:
          "You MUST follow these rules. If they prohibit your intended " +
          "action, do NOT proceed and inform the user.",
      });
    },
  });
}
