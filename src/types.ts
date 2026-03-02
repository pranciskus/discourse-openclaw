export interface DiscourseTopic {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  tags: string[];
  created_at: string;
  posts_count: number;
  views: number;
  like_count: number;
  last_posted_at: string;
  bumped_at: string;
  pinned: boolean;
  visible: boolean;
  closed: boolean;
  archived: boolean;
}

export interface DiscoursePost {
  id: number;
  username: string;
  name?: string;
  created_at: string;
  cooked: string;
  raw?: string;
  post_number: number;
  topic_id: number;
  topic_slug?: string;
  reply_count: number;
  like_count: number;
}

export interface DiscourseCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
  description?: string;
  topic_count: number;
  parent_category_id?: number;
}

export interface DiscourseTag {
  id: string;
  text: string;
  count: number;
}

export interface DiscourseUser {
  id: number;
  username: string;
  name?: string;
  trust_level: number;
  admin: boolean;
  moderator: boolean;
  created_at: string;
  bio_raw?: string;
  title?: string;
}

/** Helpers for tool return values. */
export function toolResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

export function toolError(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: `Error: ${message}` }],
  };
}

/** Extract a useful error message, preserving DiscourseApiError details. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    const status = (err as { status?: number }).status;
    if (status) return `[${status}] ${err.message}`;
    return err.message;
  }
  return String(err);
}
