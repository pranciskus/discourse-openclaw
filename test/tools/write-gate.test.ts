import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createMockApi } from "../helpers.js";
import { DiscourseClient } from "../../src/client.js";
import { resolveConfig } from "../../src/config.js";
import { registerCreatePost } from "../../src/tools/create-post.js";
import { registerCreateTopic } from "../../src/tools/create-topic.js";
import { registerUpdateTopic } from "../../src/tools/update-topic.js";

describe("write tool gating", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("does not register write tools when allowWrites is false", () => {
    const api = createMockApi({
      siteUrl: "https://forum.test",
      allowWrites: false,
    });
    const cfg = resolveConfig(api);
    const client = new DiscourseClient(cfg);

    // Simulate what index.ts does: only register if allowWrites
    if (cfg.allowWrites) {
      registerCreatePost(api, client, cfg);
      registerCreateTopic(api, client, cfg);
      registerUpdateTopic(api, client, cfg);
    }

    expect(api.tools.has("discourse_create_post")).toBe(false);
    expect(api.tools.has("discourse_create_topic")).toBe(false);
    expect(api.tools.has("discourse_update_topic")).toBe(false);
  });

  it("does not enable writes without apiKey even if allowWrites is true", () => {
    const api = createMockApi({
      siteUrl: "https://forum.test",
      allowWrites: true,
      // no apiKey!
    });
    const cfg = resolveConfig(api);
    const client = new DiscourseClient(cfg);

    if (cfg.allowWrites) {
      registerCreatePost(api, client, cfg);
      registerCreateTopic(api, client, cfg);
      registerUpdateTopic(api, client, cfg);
    }

    // allowWrites should be false because apiKey is missing
    expect(cfg.allowWrites).toBe(false);
    expect(api.tools.has("discourse_create_post")).toBe(false);
  });

  it("registers write tools when apiKey + allowWrites are both set", () => {
    const api = createMockApi({
      siteUrl: "https://forum.test",
      allowWrites: true,
      apiKey: "test-key",
    });
    const cfg = resolveConfig(api);
    const client = new DiscourseClient(cfg);

    if (cfg.allowWrites) {
      registerCreatePost(api, client, cfg);
      registerCreateTopic(api, client, cfg);
      registerUpdateTopic(api, client, cfg);
    }

    expect(cfg.allowWrites).toBe(true);
    expect(api.tools.has("discourse_create_post")).toBe(true);
    expect(api.tools.has("discourse_create_topic")).toBe(true);
    expect(api.tools.has("discourse_update_topic")).toBe(true);
  });
});
