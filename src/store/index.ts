import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthResponse, Notification } from '@/types'

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
  sidebarMobileOpen: boolean
  toggleSidebar: () => void
  setSidebarMobileOpen: (open: boolean) => void
  darkMode: boolean
  toggleDarkMode: () => void
  activeModal: string | null
  openModal: (id: string) => void
  closeModal: () => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  // Notifications
  notifications: Notification[]
  notificationsPanelOpen: boolean
  setNotificationsPanelOpen: (open: boolean) => void
  addNotification: (n: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  unreadCount: () => number
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
      darkMode: false,
      toggleDarkMode: () => {
        const next = !get().darkMode
        if (next) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ darkMode: next })
      },
      activeModal: null,
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      // Notifications
      notifications: [],
      notificationsPanelOpen: false,
      setNotificationsPanelOpen: (open) => set({ notificationsPanelOpen: open }),
      addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications].slice(0, 50) })),
      markAsRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllAsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'mengu-ui',
      partialize: (s) => ({
        darkMode: s.darkMode,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
)
