export type ConnectionStatus = 'none' | 'pending_out' | 'pending_in' | 'connected'

export type IncomingConnectionRequest = {
  id: string
  requesterId: string
  createdAt: string
  name: string
  headline: string | null
  avatarUrl: string | null
  username: string | null
}

export type SuggestedConnection = {
  userId: string
  profileId: string
  profileType: 'personal' | 'business'
  name: string
  headline: string | null
  avatarUrl: string | null
  role: string
  mutualGroups: string
  username: string | null
  businessSlug: string | null
  connectionStatus: ConnectionStatus
  score: number
}

export type PulseSearchResult = {
  id: string
  type: 'person' | 'business' | 'opportunity' | 'group'
  title: string
  subtitle: string
  href: string
  avatarUrl?: string | null
}
