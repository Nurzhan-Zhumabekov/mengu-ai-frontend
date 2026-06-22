import type { DecodedUser } from '@/types'

/**
 * Decodes a JWT's payload WITHOUT verifying the signature. This is safe here
 * because we only use the claims for client-side display/routing decisions —
 * every actual API call still gets validated server-side by the real backend
 * (internal/middleware/auth.go), which would reject a tampered token outright.
 *
 * Returns null if the token is malformed or missing the expected claims.
 */
export function decodeJWT(token: string): DecodedUser | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    // base64url → base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )
    const claims = JSON.parse(json) as { sub?: string; org_id?: string; role?: string; exp?: number }

    if (!claims.sub || !claims.org_id || !claims.role) return null

    return {
      id: claims.sub,
      org_id: claims.org_id,
      role: claims.role === 'admin' ? 'admin' : 'employee',
    }
  } catch {
    return null
  }
}

/** Returns true if the JWT's `exp` claim is in the past. Malformed tokens are treated as expired. */
export function isJWTExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1]
    if (!payload) return true
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(base64)) as { exp?: number }
    if (!claims.exp) return true
    return claims.exp * 1000 < Date.now()
  } catch {
    return true
  }
}
