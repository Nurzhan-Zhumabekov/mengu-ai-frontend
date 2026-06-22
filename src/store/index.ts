import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DecodedUser, LocalSettings } from '@/types'
import { decodeJWT } from '@/utils/jwt'

// ─── Auth Store ───────────────────────────────────────────────────────────────
//
// The real backend never returns a `user` object (see services/authService.ts
// comments) — only a JWT token pair. `user` here is decoded client-side from
// the access_token payload (id, org_id, role only — no name/email available).

interface AuthStore {
  user: DecodedUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  /** Call with the raw token pair from login/register/refresh/oauth responses. */
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setTokens: (accessToken, refreshToken) => {
        const decoded = decodeJWT(accessToken)
        set({
          user: decoded,
          accessToken,
          refreshToken,
          isAuthenticated: decoded !== null,
        })
      },
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'mengu-auth',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UIStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  activeModal: string | null
  openModal: (id: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}))

// ─── Theme Store ──────────────────────────────────────────────────────────────
//
// `preference` is what the user picked (or 'system' if they never picked
// anything). `resolvedTheme` is what's actually rendered — when preference
// is 'system' this tracks the OS-level prefers-color-scheme and updates
// live if the user changes their OS setting without touching the app.

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeClass(theme: ResolvedTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

interface ThemeStore {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (pref: ThemePreference) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      preference: 'system',
      resolvedTheme: getSystemTheme(),
      setPreference: (pref) => {
        const resolved = pref === 'system' ? getSystemTheme() : pref
        applyThemeClass(resolved)
        set({ preference: pref, resolvedTheme: resolved })
      },
    }),
    {
      name: 'mengu-theme',
      // Only the user's choice is persisted — resolvedTheme is always
      // recomputed on load so a stale system snapshot is never restored.
      partialize: (s) => ({ preference: s.preference }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const resolved = state.preference === 'system' ? getSystemTheme() : state.preference
        state.resolvedTheme = resolved
        applyThemeClass(resolved)
      },
    }
  )
)

/**
 * Call once at app startup (see main.tsx). Applies the initial theme class
 * before React mounts (avoiding a flash of the wrong theme), and subscribes
 * to OS theme changes so 'system' preference stays live.
 */
export function initTheme() {
  const { preference } = useThemeStore.getState()
  const resolved = preference === 'system' ? getSystemTheme() : preference
  applyThemeClass(resolved)
  useThemeStore.setState({ resolvedTheme: resolved })

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', (e) => {
    const { preference: currentPref } = useThemeStore.getState()
    if (currentPref !== 'system') return
    const next: ResolvedTheme = e.matches ? 'dark' : 'light'
    applyThemeClass(next)
    useThemeStore.setState({ resolvedTheme: next })
  })
}

// ─── Local Settings Store ─────────────────────────────────────────────────────
//
// The real backend has no Organization.settings field (confirmed against
// internal/model/organization.go and internal/organization/handler.go — only
// id/name/slug/plan/created_at exist). Language and reply-style preferences
// are therefore purely client-side, persisted to localStorage, and never
// sent to the backend. If the backend adds support for these later, this
// store's shape can be swapped for a real API-backed one without touching
// the components that read from it (they only care about the hook contract).

interface LocalSettingsStore extends LocalSettings {
  setLanguage: (language: LocalSettings['language']) => void
  setReplyStyle: (replyStyle: LocalSettings['replyStyle']) => void
}

export const useLocalSettingsStore = create<LocalSettingsStore>()(
  persist(
    (set) => ({
      language: 'en',
      replyStyle: 'formal',
      setLanguage: (language) => set({ language }),
      setReplyStyle: (replyStyle) => set({ replyStyle }),
    }),
    { name: 'mengu-local-settings' }
  )
)
