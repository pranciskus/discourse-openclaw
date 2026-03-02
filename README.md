# discourse-openclaw

[![npm version](https://img.shields.io/npm/v/openclaw-discourse)](https://www.npmjs.com/package/openclaw-discourse)
[![CI](https://github.com/pranciskus/discourse-openclaw/actions/workflows/ci.yml/badge.svg)](https://github.com/pranciskus/discourse-openclaw/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

OpenClaw plugin for Discourse forum integration. Read, search, and filter topics and posts. Optionally create and update content with an API key.

## Install

```bash
openclaw plugins install openclaw-discourse
```

Or install from GitHub:

```bash
openclaw plugins install github:pranciskus/discourse-openclaw
```

## Configuration

After installing, configure the plugin with your forum URL:

```bash
openclaw config set plugins.entries.openclaw-discourse.config.siteUrl "https://meta.discourse.org"
```

For authenticated access (private categories, write tools):

```bash
openclaw config set plugins.entries.openclaw-discourse.config.apiKey "your-discourse-api-key"
openclaw config set plugins.entries.openclaw-discourse.config.allowWrites true
```

Or edit `openclaw.json` directly:

### Minimal (read-only, public forum)

```json
{
  "plugins": {
    "entries": {
      "openclaw-discourse": {
        "config": {
          "siteUrl": "https://meta.discourse.org"
        }
      }
    }
  }
}
```

### Full (authenticated, write-enabled)

```json
{
  "plugins": {
    "entries": {
      "openclaw-discourse": {
        "config": {
          "siteUrl": "https://community.example.com",
          "apiKey": "your-discourse-api-key",
          "apiUsername": "system",
          "staffUsernames": ["admin", "moderator1"],
          "categories": ["support", "general"],
          "allowWrites": true,
          "signature": "*This content was written by AI.*",
          "requestTimeoutMs": 15000
        }
      }
    }
  }
}
```

### Config Reference

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `siteUrl` | string | Yes | — | Discourse forum base URL |
| `apiKey` | string | No | — | API key for auth. Required for write tools and private categories |
| `apiUsername` | string | No | `"system"` | API username for authenticated requests |
| `staffUsernames` | string[] | No | `[]` | Usernames treated as staff in `discourse_unanswered` |
| `categories` | string[] | No | `[]` | Category slugs to scope monitoring (empty = all) |
| `allowWrites` | boolean | No | `false` | Enable write tools. Requires `apiKey` |
| `signature` | string | No | `*This content was written by AI.*` | Appended to all AI-generated posts and topics |
| `requestTimeoutMs` | number | No | `15000` | HTTP request timeout in ms |

## Tools

### Read Tools (always available)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `discourse_read_topic` | Read a topic by ID with posts | `topic_id`, `post_limit` |
| `discourse_read_post` | Read a single post by ID | `post_id` |
| `discourse_search` | Full-text search across topics and posts | `query`, `max_results` |
| `discourse_filter_topics` | List/filter recent topics by category | `category_slug`, `order`, `page` |
| `discourse_unanswered` | Find recent topics with no staff replies | `hours`, `category_slug` |
| `discourse_get_user` | Get a user's profile | `username` |
| `discourse_list_user_posts` | List a user's recent posts | `username`, `offset`, `limit` |
| `discourse_get_categories` | List all forum categories | — |
| `discourse_get_tags` | List all tags with counts | — |
| `discourse_site_rules` | Fetch the site's AI usage policy (`/llms.txt`) | — |

### Write Tools (require `apiKey` + `allowWrites: true`)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `discourse_create_post` | Reply to an existing topic | `topic_id`, `raw` |
| `discourse_create_topic` | Create a new topic | `title`, `raw`, `category_id`, `tags` |
| `discourse_update_topic` | Update topic title/category/tags | `topic_id`, `title`, `category_id`, `tags` |

Write tools are rate-limited to ~1 request/second.

### llms.txt Policy Support

The plugin respects the [llms.txt](https://llmstxt.org/) convention. The `discourse_site_rules` tool fetches `/llms.txt` from the forum on demand and returns the site's AI usage policy. All write tool descriptions instruct the LLM to call `discourse_site_rules` first and follow the rules before posting.

The result is cached so `/llms.txt` is only fetched once per session.

### AI Content Signature

All AI-generated posts and topics automatically include a signature (configurable via the `signature` config field). This ensures AI content is clearly labeled. The signature is appended programmatically — the LLM cannot skip it.

## Getting a Discourse API Key

1. Go to your Discourse admin panel: `https://your-forum.com/admin/api/keys`
2. Click **New API Key**
3. Set a description (e.g., "OpenClaw Bot")
4. Choose **User Level**: Single User or All Users
5. Choose scope: for read-only, select "Read" scopes. For write, add "Write" scopes
6. Copy the generated key and add it to your OpenClaw config

## vs discourse-mcp

| Feature | discourse-openclaw | discourse-mcp |
|---------|-------------------|---------------|
| Platform | OpenClaw native | MCP (Claude Desktop, etc.) |
| Read tools | 9 | 10 |
| Write tools | 3 (focused) | 9 (full admin) |
| Unique tools | `discourse_unanswered` | Chat, drafts, admin tools |
| Install | `openclaw plugins install` | Standalone CLI |
| Best for | OpenClaw agents, community support workflows | General MCP clients |

This plugin is designed for agent-driven community support. The `discourse_unanswered` tool is specifically built for finding topics that need attention, which is not available in discourse-mcp.

## Development

```bash
git clone https://github.com/pranciskus/discourse-openclaw
cd discourse-openclaw
npm install
npm test
npm run typecheck
```

## License

MIT
