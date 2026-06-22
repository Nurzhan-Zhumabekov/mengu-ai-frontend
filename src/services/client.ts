import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/store'

// ─── HTTP client ──────────────────────────────────────────────────────────────
//
// Real backend: Go/Gin on :8080, base path /api/v1 (confirmed in
// cmd/server/main.go swagger annotations and docs/API_SPEC.md).
//
// In dev, Vite proxies /api/* to the backend (see vite.config.ts) so we
// default to a relative baseURL and let the proxy handle the rest. Set
// VITE_API_URL to override (e.g. pointing straight at a deployed backend).

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Tracks an in-flight refresh so concurrent 401s don't each trigger their own
// refresh call (which would race against the backend's single-use refresh
// token semantics — see docs/API_SPEC.md "Refresh tokens are single-use").
let refreshPromise: Promise<string | null> | null = null

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config
    if (error.response?.status !== 401 || !originalRequest || (originalRequest as { _retried?: boolean })._retried) {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout()
      }
      return Promise.reject(error)
    }

    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) {
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }

    if (!refreshPromise) {
      refreshPromise = httpClient
        .post('/auth/refresh', { refresh_token: refreshToken })
        .then((res) => {
          const { access_token, refresh_token } = res.data
          useAuthStore.getState().setTokens(access_token, refresh_token)
          return access_token as string
        })
        .catch(() => {
          useAuthStore.getState().logout()
          return null
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const newToken = await refreshPromise
    if (!newToken) return Promise.reject(error)

    ;(originalRequest as { _retried?: boolean })._retried = true
    originalRequest.headers = originalRequest.headers ?? {}
    originalRequest.headers.Authorization = `Bearer ${newToken}`
    return httpClient.request(originalRequest)
  }
)
