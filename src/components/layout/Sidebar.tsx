import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Inbox, CheckSquare, FileText,
  Calendar, Lightbulb, BarChart2, Settings,
  Zap, LogOut, Bell, ChevronDown, Menu, X,
  Moon, Sun, Search, Users, ClipboardList,
} from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'
import { initials, cn } from '@/utils/helpers'
import { NotificationPanel } from '@/components/NotificationPanel'
import { CommandPalette } from '@/components/CommandPalette'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  badge?: number
  roles?: string[]
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Main',
    items: [
      { to: '/',        icon: LayoutDashboard, label: 'Dashboard',   badge: 7 },
      { to: '/inbox',   icon: Inbox,           label: 'Inbox',  badge: 12 },
    ],
  },
  {
    section: 'Work',
    items: [
      { to: '/tasks',     icon: CheckSquare, label: 'Tasks' },
      { to: '/documents', icon: FileText,    label: 'Documents' },
      { to: '/calendar',  icon: Calendar,    label: 'Calendar' },
    ],
  },
  {
    section: 'Analytics',
    items: [
      { to: '/insights',  icon: Lightbulb, label: 'AI Insights' },
      { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
  {
    section: 'Admin',
    items: [
      { to: '/users',    icon: Users,          label: 'Users',     roles: ['admin'] },
      { to: '/audit',    icon: ClipboardList,  label: 'Audit Log', roles: ['admin', 'manager'] },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { sidebarMobileOpen, setSidebarMobileOpen } = useUIStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <aside className="flex flex-col w-[220px] min-w-[220px] bg-navy-800 h-screen" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-magenta-500 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse-glow">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[17px] font-semibold text-white leading-tight">Mengu</div>
            <div className="text-[10px] text-white/40">AI Execution Layer</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((group) => {
          const filteredItems = group.items.filter((item) => {
            if (!item.roles) return true
            return item.roles.includes(user?.role ?? 'viewer')
          })
          if (filteredItems.length === 0) return null

          return (
            <div key={group.section} className="mb-1">
              <div className="px-4 py-2 text-[10px] text-white/30 font-medium uppercase tracking-widest">
                {group.section}
              </div>
              {filteredItems.map(({ to, icon: Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setSidebarMobileOpen(false)}
                  className={({ isActive }) =>
                    cn('nav-item', isActive && 'active')
                  }
                >
                  <Icon size={17} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="text-[10px] font-medium bg-magenta-500 text-white px-1.5 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="nav-item w-full text-left"
          aria-label="Sign out"
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-magenta-500 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
            {initials(user?.full_name ?? 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-white/80 truncate">
              {user?.full_name ?? 'User'}
            </div>
            <div className="text-[11px] text-white/40 capitalize">{user?.role}</div>
          </div>
          <ChevronDown size={14} className="text-white/30 flex-shrink-0" />
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarMobileOpen(false)} />
          <div className="relative animate-slide-left">
            {sidebarContent}
          </div>
          <button
            onClick={() => setSidebarMobileOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white z-50"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

interface TopbarProps {
  title: string
  actions?: React.ReactNode
}

export function Topbar({ title, actions }: TopbarProps) {
  const { setSidebarMobileOpen, darkMode, toggleDarkMode, notificationsPanelOpen, setNotificationsPanelOpen, setCommandPaletteOpen } = useUIStore()
  const unread = useUIStore((s) => s.unreadCount())

  return (
    <>
      <header className="h-14 flex items-center px-4 md:px-6 bg-white dark:bg-navy-800 border-b border-gray-100 dark:border-white/5 gap-3 flex-shrink-0 transition-colors" role="banner">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h1>

        <div className="ml-auto flex items-center gap-2">
          {actions}

          {/* Search trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-1.5 bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Search"
          >
            <Search size={14} />
            <span className="hidden lg:inline">Search...</span>
            <kbd className="ml-1 text-[11px] text-gray-400 bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
            className="relative w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-magenta-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Notification dropdown */}
      {notificationsPanelOpen && <NotificationPanel />}

      {/* Command Palette */}
      <CommandPalette />
    </>
  )
}
