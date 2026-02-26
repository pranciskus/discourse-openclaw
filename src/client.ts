import type { DiscourseConfig } from "./config.js";

export class DiscourseApiError extends Error {
  constructor(
    public status: number,
    public url: string,
    message: string,
  ) {
    super(message);
    this.name = "DiscourseApiError";
  }
}

export class DiscourseClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeoutMs: number;
  private lastWriteAt = 0;

  constructor(cfg: DiscourseConfig) {
    this.baseUrl = cfg.siteUrl;
    this.timeoutMs = cfg.requestTimeoutMs;
    this.headers = {
      Accept: "application/json",
      "User-Agent": "openclaw-discourse/0.1",
    };
    if (cfg.apiKey) {
      this.headers["Api-Key"] = cfg.apiKey;
      this.headers["Api-Username"] = cfg.apiUsername;
    }
  }

  async get<T = unknown>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    await this.writeRateLimit();
    return this.request<T>("POST", path, body);
  }

  async put<T = unknown>(path: string, body: unknown): Promise<T> {
    await this.writeRateLimit();
    return this.request<T>("PUT", path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const init: RequestInit = {
        method,
        headers: { ...this.headers },
        signal: controller.signal,
      };
      if (body !== undefined) {
        (init.headers as Record<string, string>)["Content-Type"] =
          "application/json";
        init.body = JSON.stringify(body);
      }
      const res = await fetch(url, init);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new DiscourseApiError(
          res.status,
          url,
          `Discourse API ${res.status}: ${url}${text ? ` — ${text.slice(0, 200)}` : ""}`,
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof DiscourseApiError) throw err;
      if ((err as Error).name === "AbortError") {
        throw new DiscourseApiError(
          0,
          url,
          `Discourse API timeout after ${this.timeoutMs}ms: ${url}`,
        );
      }
      throw new DiscourseApiError(
        0,
        url,
        `Discourse API request failed: ${url} — ${(err as Error).message}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async writeRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastWriteAt;
    if (elapsed < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - elapsed));
    }
    this.lastWriteAt = Date.now();
  }
}
