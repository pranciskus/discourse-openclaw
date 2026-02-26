# Discourse Meta Announcement (Draft)

**Post this as a reply to:** https://meta.discourse.org/t/discourse-openclaw/396086
**Or as a new topic in:** Integrations category

---

**Title:** discourse-openclaw: Discourse Integration for OpenClaw AI Agents

**Body:**

Hi everyone,

I've built an OpenClaw plugin that provides native Discourse API tools for AI agents: **[discourse-openclaw](https://github.com/pranciskus/discourse-openclaw)**

## What it does

The plugin gives OpenClaw agents 12 tools for interacting with any Discourse forum:

**Read tools (9):** read topics, read individual posts, search, filter topics by category, find unanswered questions, look up users, list user posts, get categories, get tags.

**Write tools (3, opt-in):** create posts (replies), create topics, update topics. These require an API key and explicit `allowWrites: true` in config.

## Quick start

```bash
openclaw plugins install openclaw-discourse
```

Minimal config:
```json
{
  "plugins": {
    "entries": {
      "discourse": {
        "config": { "siteUrl": "https://your-forum.com" }
      }
    }
  }
}
```

## Unique feature: discourse_unanswered

The `discourse_unanswered` tool finds recent topics that haven't received a staff reply yet. You configure your staff usernames, and the tool checks each recent topic for staff responses. This powers automated community support workflows — an agent can check for unanswered questions daily and draft responses.

## How it relates to discourse-mcp

This complements [discourse-mcp](https://github.com/discourse/discourse-mcp) — discourse-mcp works with any MCP client (Claude Desktop, etc.), while this plugin is specifically for OpenClaw agents. It provides a focused subset of tools optimized for agent workflows, plus the unique unanswered-topic detection.

GitHub: https://github.com/pranciskus/discourse-openclaw
npm: `openclaw-discourse`

Feedback and contributions welcome!
