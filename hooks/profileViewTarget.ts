export type ProfileViewTarget =
  | { mode: 'self' }
  | { mode: 'userId'; userId: string }
  | { mode: 'username'; username: string }
  | { mode: 'businessSlug'; slug: string }

export function profileViewTargetKey(target: ProfileViewTarget): string {
  switch (target.mode) {
    case 'self':
      return 'self'
    case 'userId':
      return `uid:${target.userId}`
    case 'username':
      return `user:${target.username}`
    case 'businessSlug':
      return `biz:${target.slug}`
  }
}
