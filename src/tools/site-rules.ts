import type { PluginApi, DiscourseConfig } from "../config.js";
import { fetchLlmsTxt, type LlmsPolicy } from "../llms-txt.js";
import { toolResult } from "../types.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function registerSiteRules(api: PluginApi, cfg: DiscourseConfig) {
  let cached: LlmsPolicy | null = null;
  let cachedAt = 0;

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
      if (!cached || Date.now() - cachedAt > CACHE_TTL_MS) {
        cached = await fetchLlmsTxt(cfg.siteUrl, cfg.requestTimeoutMs);
        cachedAt = Date.now();
      }

      if (cached.error) {
        return toolResult({
          site: cfg.siteUrl,
          rules_found: false,
          error: true,
          message:
            "Failed to retrieve site rules (llms.txt). " +
            "Proceed with caution or retry later. " +
            "Do NOT assume there are no restrictions.",
        });
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
