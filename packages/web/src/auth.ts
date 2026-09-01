const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export async function getAuthenticatedUser() {
  try {
    const response = await fetch(`${apiUrl}/api/me`, { credentials: 'include' })
    if (!response.ok) return null

    const body = await response.json()
    return body.user && typeof body.user.username === 'string'
      ? { username: body.user.username }
      : null
  } catch {
    return null
  }
}