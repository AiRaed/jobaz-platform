export type AuthMode = 'signup' | 'login' | 'forgot'

export function parseAuthModeParam(mode?: string | null): AuthMode {
  if (mode === 'forgot') return 'forgot'
  if (mode === 'login') return 'login'
  return 'signup'
}
