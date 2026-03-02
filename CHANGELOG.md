# Changelog

## 0.2.0 (2026-03-02)

### Added

- `discourse_site_rules` tool — fetches the site's `/llms.txt` on demand so the LLM can check AI usage policies before writing. Always registered regardless of write mode.
- `signature` config field — automatically appended to all AI-generated posts and topics. Defaults to `*This content was written by AI.*`. Ensures AI content is clearly labeled.
- Write tool descriptions instruct the LLM to call `discourse_site_rules` first.

## 0.1.0 (2026-02-26)

### Added

- 9 read tools: `discourse_read_topic`, `discourse_read_post`, `discourse_search`, `discourse_filter_topics`, `discourse_unanswered`, `discourse_get_user`, `discourse_list_user_posts`, `discourse_get_categories`, `discourse_get_tags`
- 3 write tools (gated behind `allowWrites` + API key): `discourse_create_post`, `discourse_create_topic`, `discourse_update_topic`
- Configurable auth, request timeout, and category scoping
- Staff-aware unanswered topic detection
- Write rate limiting (~1 req/sec)
