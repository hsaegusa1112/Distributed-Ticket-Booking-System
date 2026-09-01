const accessTokenKey = 'ticket-booking.access-token'

type TokenClaims = {
  exp?: number
  username?: string
}

function getTokenClaims(accessToken: string): TokenClaims | null {
  try {
    const payload = accessToken.split('.')[1]
    if (!payload) return null

    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(json) as TokenClaims
    if (!claims.username || !claims.exp || claims.exp * 1000 <= Date.now()) return null

    return claims
  } catch {
    return null
  }
}

export function getAuthenticatedUser() {
  if (typeof window === 'undefined') return null

  try {
    const accessToken = window.localStorage.getItem(accessTokenKey)
    const claims = accessToken ? getTokenClaims(accessToken) : null
    if (!claims) window.localStorage.removeItem(accessTokenKey)
    return claims ? { username: claims.username } : null
  } catch {
    return null
  }
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null

  try {
    const accessToken = window.localStorage.getItem(accessTokenKey)
    return accessToken && getTokenClaims(accessToken) ? accessToken : null
  } catch {
    return null
  }
}

export function saveAccessToken(accessToken: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(accessTokenKey, accessToken)
}