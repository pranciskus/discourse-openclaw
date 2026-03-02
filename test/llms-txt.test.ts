import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fetchLlmsTxt } from "../src/llms-txt.js";

describe("fetchLlmsTxt", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns policy when llms.txt exists", async () => {
    const policyText = "AI systems must not post content on this site.";
    globalThis.fetch = vi.fn(async () =>
      new Response(policyText, { status: 200 }),
    ) as unknown as typeof globalThis.fetch;

    const result = await fetchLlmsTxt("https://forum.test");

    expect(result.found).toBe(true);
    expect(result.text).toBe(policyText);
  });

  it("returns not-found when llms.txt is 404", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("Not Found", { status: 404 }),
    ) as unknown as typeof globalThis.fetch;

    const result = await fetchLlmsTxt("https://forum.test");

    expect(result.found).toBe(false);
    expect(result.text).toBe("");
  });

  it("returns not-found on network error", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("Network error");
    }) as unknown as typeof globalThis.fetch;

    const result = await fetchLlmsTxt("https://forum.test");

    expect(result.found).toBe(false);
  });

  it("fetches from the correct URL", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("", { status: 404 }),
    ) as unknown as typeof globalThis.fetch;

    await fetchLlmsTxt("https://forum.test");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://forum.test/llms.txt",
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "text/plain" }),
      }),
    );
  });
});
