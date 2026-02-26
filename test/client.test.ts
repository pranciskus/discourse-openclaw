import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DiscourseClient, DiscourseApiError } from "../src/client.js";
import type { DiscourseConfig } from "../src/config.js";

function makeConfig(overrides: Partial<DiscourseConfig> = {}): DiscourseConfig {
  return {
    siteUrl: "https://forum.example.com",
    apiUsername: "system",
    staffUsernames: [],
    categories: [],
    allowWrites: false,
    requestTimeoutMs: 5000,
    ...overrides,
  };
}

describe("DiscourseClient", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET request without auth headers when no apiKey", async () => {
    const cfg = makeConfig();
    const client = new DiscourseClient(cfg);

    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ) as unknown as typeof fetch;

    await client.get("/test.json");

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = call[1].headers;
    expect(headers["Api-Key"]).toBeUndefined();
    expect(headers.Accept).toBe("application/json");
  });

  it("sends auth headers when apiKey is set", async () => {
    const cfg = makeConfig({ apiKey: "test-key", apiUsername: "bot" });
    const client = new DiscourseClient(cfg);

    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ) as unknown as typeof fetch;

    await client.get("/test.json");

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].headers["Api-Key"]).toBe("test-key");
    expect(call[1].headers["Api-Username"]).toBe("bot");
  });

  it("throws DiscourseApiError on non-OK response", async () => {
    const cfg = makeConfig();
    const client = new DiscourseClient(cfg);

    globalThis.fetch = vi.fn(async () =>
      new Response("Not Found", { status: 404 }),
    ) as unknown as typeof fetch;

    await expect(client.get("/missing.json")).rejects.toThrow(
      DiscourseApiError,
    );
  });

  it("sends POST with JSON body and Content-Type header", async () => {
    const cfg = makeConfig({ apiKey: "key", allowWrites: true });
    const client = new DiscourseClient(cfg);

    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ id: 1 }), { status: 200 }),
    ) as unknown as typeof fetch;

    await client.post("/posts.json", { raw: "hello", topic_id: 1 });

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].method).toBe("POST");
    expect(call[1].headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(call[1].body)).toEqual({ raw: "hello", topic_id: 1 });
  });

  it("sends PUT with JSON body", async () => {
    const cfg = makeConfig({ apiKey: "key", allowWrites: true });
    const client = new DiscourseClient(cfg);

    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ basic_topic: { id: 1 } }), { status: 200 }),
    ) as unknown as typeof fetch;

    await client.put("/t/-/1.json", { title: "new title" });

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].method).toBe("PUT");
  });
});
