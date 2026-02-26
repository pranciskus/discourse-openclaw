import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockApi, mockFetch, parseToolResult } from "../helpers.js";
import { DiscourseClient } from "../../src/client.js";
import { resolveConfig } from "../../src/config.js";
import { registerReadTopic } from "../../src/tools/read-topic.js";
import topicFixture from "../fixtures/topic.json";

describe("discourse_read_topic", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("reads a topic and returns posts", async () => {
    const api = createMockApi({ siteUrl: "https://forum.test" });
    const cfg = resolveConfig(api);
    globalThis.fetch = mockFetch({ "/t/42.json": topicFixture });
    const client = new DiscourseClient(cfg);

    registerReadTopic(api, client, cfg);

    const tool = api.tools.get("discourse_read_topic")!;
    const result = await tool.execute("id", { topic_id: 42 });
    const data = parseToolResult(result) as Record<string, unknown>;

    expect(data.title).toBe("How to configure Pisound");
    expect((data.posts as unknown[]).length).toBe(3);
  });

  it("respects post_limit", async () => {
    const api = createMockApi({ siteUrl: "https://forum.test" });
    const cfg = resolveConfig(api);
    globalThis.fetch = mockFetch({ "/t/42.json": topicFixture });
    const client = new DiscourseClient(cfg);

    registerReadTopic(api, client, cfg);

    const tool = api.tools.get("discourse_read_topic")!;
    const result = await tool.execute("id", { topic_id: 42, post_limit: 1 });
    const data = parseToolResult(result) as Record<string, unknown>;

    expect((data.posts as unknown[]).length).toBe(1);
  });

  it("handles API error gracefully", async () => {
    const api = createMockApi({ siteUrl: "https://forum.test" });
    const cfg = resolveConfig(api);
    globalThis.fetch = vi.fn(async () =>
      new Response("Not Found", { status: 404 }),
    ) as unknown as typeof fetch;
    const client = new DiscourseClient(cfg);

    registerReadTopic(api, client, cfg);

    const tool = api.tools.get("discourse_read_topic")!;
    const result = await tool.execute("id", { topic_id: 999 });
    expect(result.content[0].text).toContain("Error:");
  });
});
