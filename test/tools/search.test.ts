import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createMockApi, mockFetch, parseToolResult } from "../helpers.js";
import { DiscourseClient } from "../../src/client.js";
import { resolveConfig } from "../../src/config.js";
import { registerSearch } from "../../src/tools/search.js";
import searchFixture from "../fixtures/search-results.json";

describe("discourse_search", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("searches and returns topics and posts", async () => {
    const api = createMockApi({ siteUrl: "https://forum.test" });
    const cfg = resolveConfig(api);
    globalThis.fetch = mockFetch({ "/search.json": searchFixture });
    const client = new DiscourseClient(cfg);

    registerSearch(api, client, cfg);

    const tool = api.tools.get("discourse_search")!;
    const result = await tool.execute("id", { query: "pisound" });
    const data = parseToolResult(result) as Record<string, unknown>;

    expect((data.topics as unknown[]).length).toBe(2);
    expect((data.posts as unknown[]).length).toBe(1);
  });

  it("limits results with max_results", async () => {
    const api = createMockApi({ siteUrl: "https://forum.test" });
    const cfg = resolveConfig(api);
    globalThis.fetch = mockFetch({ "/search.json": searchFixture });
    const client = new DiscourseClient(cfg);

    registerSearch(api, client, cfg);

    const tool = api.tools.get("discourse_search")!;
    const result = await tool.execute("id", {
      query: "pisound",
      max_results: 1,
    });
    const data = parseToolResult(result) as Record<string, unknown>;

    expect((data.topics as unknown[]).length).toBe(1);
  });
});
