/**
 * Fetches the site's /llms.txt policy file.
 *
 * llms.txt is a convention that lets sites communicate their rules to
 * AI systems. A dedicated tool exposes the policy, and write tools
 * instruct the LLM to read it first.
 */

export interface LlmsPolicy {
  /** Raw text content of llms.txt (empty string if not found). */
  text: string;
  /** Whether llms.txt was found on the site. */
  found: boolean;
  /** Whether the fetch failed due to a network/server error (not a 404). */
  error?: boolean;
}

/** Fetch /llms.txt from the given site URL. Never throws. */
export async function fetchLlmsTxt(
  siteUrl: string,
  timeoutMs = 10_000,
): Promise<LlmsPolicy> {
  const url = `${siteUrl}/llms.txt`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "text/plain",
        "User-Agent": "openclaw-discourse/0.2",
      },
      signal: controller.signal,
    });

    if (res.status === 404) {
      return { text: "", found: false };
    }
    if (!res.ok) {
      return { text: "", found: false, error: true };
    }

    const text = (await res.text()).trim();
    if (!text) return { text: "", found: false };
    return { text, found: true };
  } catch {
    return { text: "", found: false, error: true };
  } finally {
    clearTimeout(timeout);
  }
}
