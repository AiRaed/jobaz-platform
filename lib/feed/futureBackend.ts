/**
 * Future Supabase / backend schema (NOT implemented in this MVP).
 *
 * profiles          — user public feed identity, career badge, avatar
 * posts             — text, visibility, group_id, author_id, category
 * post_media        — image/video URLs linked to posts
 * comments          — threaded replies on posts
 * likes             — polymorphic: post_id or comment_id + user_id
 * groups            — community name, category, privacy, description
 * group_members     — group_id, user_id, role
 * friend_requests   — from_user_id, to_user_id, status
 * notifications     — activity feed for likes, comments, joins
 * saved_posts       — user_id, post_id
 */

export const FEED_BACKEND_TABLES = [
  'profiles',
  'posts',
  'post_media',
  'comments',
  'likes',
  'groups',
  'group_members',
  'friend_requests',
  'notifications',
  'saved_posts',
] as const
