export interface DiscourseConfig {
  siteUrl: string;
  apiKey?: string;
  apiUsername: string;
  staffUsernames: string[];
  categories: string[];
  allowWrites: boolean;
  signature: string;
  requestTimeoutMs: number;
}

export interface PluginApi {
  pluginConfig?: Record<string, unknown>;
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
  registerTool: (tool: ToolDefinition) => void;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (
    id: string,
    params: Record<string, unknown>,
  ) => Promise<{ content: Array<{ type: string; text: string }> }>;
}

export function resolveConfig(api: PluginApi): DiscourseConfig {
  const raw = (api.pluginConfig ?? {}) as Record<string, unknown>;
  const apiKey = raw.apiKey ? String(raw.apiKey) : undefined;
  return {
    siteUrl: String(raw.siteUrl ?? "").replace(/\/$/, ""),
    apiKey,
    apiUsername: String(raw.apiUsername ?? "system"),
    staffUsernames: Array.isArray(raw.staffUsernames)
      ? raw.staffUsernames.map(String)
      : [],
    categories: Array.isArray(raw.categories)
      ? raw.categories.map(String)
      : [],
    allowWrites: Boolean(raw.allowWrites) && !!apiKey,
    signature: String(
      raw.signature ?? "*This content was written by AI.*",
    ),
    requestTimeoutMs: Number(raw.requestTimeoutMs) || 15_000,
  };
}
