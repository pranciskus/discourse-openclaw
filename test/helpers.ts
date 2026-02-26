import { vi } from "vitest";
import type { PluginApi, ToolDefinition } from "../src/config.js";

/** Create a mock PluginApi that captures registered tools. */
export function createMockApi(
  config: Record<string, unknown> = {},
): PluginApi & { tools: Map<string, ToolDefinition> } {
  const tools = new Map<string, ToolDefinition>();
  return {
    pluginConfig: config,
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    registerTool(tool: ToolDefinition) {
      tools.set(tool.name, tool);
    },
    tools,
  };
}

/** Create a mock fetch that returns predefined responses. */
export function mockFetch(
  responses: Record<string, unknown>,
): typeof globalThis.fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const [pattern, body] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return new Response("Not Found", { status: 404 });
  }) as unknown as typeof globalThis.fetch;
}

/** Parse tool result JSON from the content array. */
export function parseToolResult(result: {
  content: Array<{ type: string; text: string }>;
}): unknown {
  return JSON.parse(result.content[0].text);
}
