import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMockApi, parseToolResult } from "../helpers.js";
import { DiscourseClient } from "../../src/client.js";
import { resolveConfig } from "../../src/config.js";
import { registerCreatePost } from "../../src/tools/create-post.js";
import { registerCreateTopic } from "../../src/tools/create-topic.js";
import { registerUpdateTopic } from "../../src/tools/update-topic.js";
import { registerSiteRules } from "../../src/tools/site-rules.js";

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

    // site rules always registered
    registerSiteRules(api, cfg);

    if (cfg.allowWrites) {
      registerCreatePost(api, client, cfg);
      registerCreateTopic(api, client, cfg);
      registerUpdateTopic(api, client, cfg);
    }

    expect(api.tools.has("discourse_site_rules")).toBe(true);
    expect(api.tools.has("discourse_create_post")).toBe(false);
    expect(api.tools.has("discourse_create_topic")).toBe(false);
    expect(api.tools.has("discourse_update_topic")).toBe(false);
  });

  it("does not enable writes without apiKey even if allowWrites is true", () => {
    const api = createMockApi({
      siteUrl: "https://forum.test",
      allowWrites: true,
    });
    const cfg = resolveConfig(api);

    expect(cfg.allowWrites).toBe(false);
  });

  it("registers write tools and site rules when apiKey + allowWrites are set", () => {
    const api = createMockApi({
      siteUrl: "https://forum.test",
      allowWrites: true,
      apiKey: "test-key",
    });
    const cfg = resolveConfig(api);
    const client = new DiscourseClient(cfg);

    if (cfg.allowWrites) {
      registerSiteRules(api, cfg);
      registerCreatePost(api, client, cfg);
      registerCreateTopic(api, client, cfg);
      registerUpdateTopic(api, client, cfg);
    }

    expect(api.tools.has("discourse_site_rules")).toBe(true);
    expect(api.tools.has("discourse_create_post")).toBe(true);
    expect(api.tools.has("discourse_create_topic")).toBe(true);
    expect(api.tools.has("discourse_update_topic")).toBe(true);
  });

  it("write tool descriptions instruct LLM to call site rules first", () => {
    const api = createMockApi({
      siteUrl: "https://forum.test",
      allowWrites: true,
      apiKey: "test-key",
    });
    const cfg = resolveConfig(api);
    const client = new DiscourseClient(cfg);

    registerSiteRules(api, cfg);
    registerCreatePost(api, client, cfg);
    registerCreateTopic(api, client, cfg);
    registerUpdateTopic(api, client, cfg);

    for (const name of [
      "discourse_create_post",
      "discourse_create_topic",
      "discourse_update_topic",
    ]) {
      const tool = api.tools.get(name)!;
      expect(tool.description).toContain("discourse_site_rules");
    }
  });
});

describe("discourse_site_rules tool", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns rules when llms.txt exists", async () => {
    const rulesText = "AI must not post content on this site.";
    globalThis.fetch = vi.fn(async () =>
      new Response(rulesText, { status: 200 }),
    ) as unknown as typeof globalThis.fetch;

    const api = createMockApi({
      siteUrl: "https://forum.test",
      allowWrites: true,
      apiKey: "test-key",
    });
    const cfg = resolveConfig(api);
    registerSiteRules(api, cfg);

    const tool = api.tools.get("discourse_site_rules")!;
    const result = await tool.execute("1", {});
    const parsed = parseToolResult(result) as Record<string, unknown>;

    expect(parsed.rules_found).toBe(true);
    expect(parsed.rules).toBe(rulesText);
  });

  it("returns no-rules when llms.txt is 404", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("Not Found", { status: 404 }),
    ) as unknown as typeof globalThis.fetch;

    const api = createMockApi({
      siteUrl: "https://forum.test",
      allowWrites: true,
      apiKey: "test-key",
    });
    const cfg = resolveConfig(api);
    registerSiteRules(api, cfg);

    const tool = api.tools.get("discourse_site_rules")!;
    const result = await tool.execute("1", {});
    const parsed = parseToolResult(result) as Record<string, unknown>;

    expect(parsed.rules_found).toBe(false);
  });

  it("caches the result across multiple calls", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("Some rules", { status: 200 }),
    ) as unknown as typeof globalThis.fetch;

    const api = createMockApi({
      siteUrl: "https://forum.test",
      allowWrites: true,
      apiKey: "test-key",
    });
    const cfg = resolveConfig(api);
    registerSiteRules(api, cfg);

    const tool = api.tools.get("discourse_site_rules")!;
    await tool.execute("1", {});
    await tool.execute("2", {});
    await tool.execute("3", {});

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
