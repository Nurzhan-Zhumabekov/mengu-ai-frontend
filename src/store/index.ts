import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthResponse } from '@/types'

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthStore {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (res: AuthResponse) => void
  logout: () => void
  updateUser: (patch: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (res) => {
        localStorage.setItem('mengu_token', res.access_token)
        set({
          user: res.user,
          token: res.access_token,
          refreshToken: res.refresh_token,
          isAuthenticated: true,
        })
      },
      logout: () => {
        localStorage.removeItem('mengu_token')
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },
      updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),
    }),
    {
      name: 'mengu-auth',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
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
