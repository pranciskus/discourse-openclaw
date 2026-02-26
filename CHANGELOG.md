# Changelog

## 0.1.0 (2026-02-26)

### Added

- 9 read tools: `discourse_read_topic`, `discourse_read_post`, `discourse_search`, `discourse_filter_topics`, `discourse_unanswered`, `discourse_get_user`, `discourse_list_user_posts`, `discourse_get_categories`, `discourse_get_tags`
- 3 write tools (gated behind `allowWrites` + API key): `discourse_create_post`, `discourse_create_topic`, `discourse_update_topic`
- Configurable auth, request timeout, and category scoping
- Staff-aware unanswered topic detection
- Write rate limiting (~1 req/sec)
