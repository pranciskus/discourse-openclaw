import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockApi, parseToolResult } from "../helpers.js";
import { DiscourseClient } from "../../src/client.js";
import { resolveConfig } from "../../src/config.js";
import { registerUnanswered } from "../../src/tools/unanswered.js";
import latestFixture from "../fixtures/latest.json";
import topicFixture from "../fixtures/topic.json";

describe("discourse_unanswered", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("filters out topics with staff replies", async () => {
    const api = createMockApi({
      siteUrl: "https://forum.test",
      staffUsernames: ["bob"],
    });
    const cfg = resolveConfig(api);

    // Topic 10 = unanswered (1 post from alice only)
    const unansweredTopic = {
      ...topicFixture,
      post_stream: {
        posts: [topicFixture.post_stream.posts[0]], // only alice's OP
      },
    };

    // Topic 11 = answered by staff "bob"
    const answeredTopic = {
      ...topicFixture,
      post_stream: {
        posts: [
          topicFixture.post_stream.posts[0],
          topicFixture.post_stream.posts[1], // bob replies
        ],
      },
    };

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/latest.json")) {
        return new Response(JSON.stringify(latestFixture), { status: 200 });
      }
      if (url.includes("/t/10.json")) {
        return new Response(JSON.stringify(unansweredTopic), { status: 200 });
      }
      if (url.includes("/t/11.json")) {
        return new Response(JSON.stringify(answeredTopic), { status: 200 });
      }
      return new Response("Not Found", { status: 404 });
    }) as unknown as typeof fetch;

    const client = new DiscourseClient(cfg);
    registerUnanswered(api, client, cfg);

    const tool = api.tools.get("discourse_unanswered")!;
    // Use a very large hours window to include all fixture topics
    const result = await tool.execute("id", { hours: 999_999 });
    const data = parseToolResult(result) as Array<Record<string, unknown>>;

    // Only topic 10 should be unanswered (topic 11 has bob reply, topic 12 is old but would be caught)
    const ids = data.map((t) => t.id);
    expect(ids).toContain(10);
    expect(ids).not.toContain(11);
  });
});
