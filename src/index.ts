/**
 * OpenClaw Discourse Plugin
 *
 * Provides agent tools for reading, searching, filtering, and writing
 * Discourse forum topics and posts. Uses the Discourse REST API directly.
 *
 * Read tools work on any public forum. Write tools require an API key
 * and the `allowWrites` config flag. A `discourse_site_rules` tool is
 * always registered — it fetches the site's llms.txt on demand so the
 * LLM can check the policy before writing.
 */

import { resolveConfig, type PluginApi } from "./config.js";
import { DiscourseClient } from "./client.js";

// Read tools
import { registerReadTopic } from "./tools/read-topic.js";
import { registerReadPost } from "./tools/read-post.js";
import { registerSearch } from "./tools/search.js";
import { registerFilterTopics } from "./tools/filter-topics.js";
import { registerUnanswered } from "./tools/unanswered.js";
import { registerGetUser } from "./tools/get-user.js";
import { registerListUserPosts } from "./tools/list-user-posts.js";
import { registerGetCategories } from "./tools/get-categories.js";
import { registerGetTags } from "./tools/get-tags.js";

// Write tools
import { registerCreatePost } from "./tools/create-post.js";
import { registerCreateTopic } from "./tools/create-topic.js";
import { registerUpdateTopic } from "./tools/update-topic.js";
import { registerSiteRules } from "./tools/site-rules.js";

export default function register(api: PluginApi) {
  const cfg = resolveConfig(api);

  if (!cfg.siteUrl) {
    api.logger.warn("Discourse plugin: siteUrl is required but not configured");
    return;
  }

  const client = new DiscourseClient(cfg);

  // Always register read tools
  registerReadTopic(api, client, cfg);
  registerReadPost(api, client, cfg);
  registerSearch(api, client, cfg);
  registerFilterTopics(api, client, cfg);
  registerUnanswered(api, client, cfg);
  registerGetUser(api, client, cfg);
  registerListUserPosts(api, client, cfg);
  registerGetCategories(api, client, cfg);
  registerGetTags(api, client, cfg);

  // Always register site rules so the LLM can check the policy
  registerSiteRules(api, cfg);

  // Conditionally register write tools
  if (cfg.allowWrites) {
    registerCreatePost(api, client, cfg);
    registerCreateTopic(api, client, cfg);
    registerUpdateTopic(api, client, cfg);
    api.logger.info(
      `Discourse plugin: write tools enabled for ${cfg.siteUrl}`,
    );
  }

  api.logger.info(
    `Discourse plugin loaded for ${cfg.siteUrl} (${cfg.allowWrites ? "read+write" : "read-only"} mode)`,
  );
}
