import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { authService } from '@/services'
import { isJWTExpired } from '@/utils/jwt'
import { Spinner } from '@/components/ui'

export function ProtectedRoute() {
  const { isAuthenticated, accessToken, refreshToken, setTokens, logout } = useAuthStore()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function verify() {
      if (!isAuthenticated || !accessToken) {
        setChecking(false)
        return
      }
      if (!isJWTExpired(accessToken)) {
        setChecking(false)
        return
      }
      // Access token expired — try a silent refresh before giving up.
      // The httpClient interceptor handles this for in-flight API calls,
      // but on initial page load there's no failed request yet to trigger it.
      if (!refreshToken) {
        logout()
        setChecking(false)
        return
      }
      try {
        const tokens = await authService.refresh(refreshToken)
        setTokens(tokens.access_token, tokens.refresh_token)
      } catch {
        logout()
      } finally {
        setChecking(false)
      }
    }
    verify()
  }, [isAuthenticated, accessToken, refreshToken, setTokens, logout])

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-navy-900">
        <Spinner />
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
