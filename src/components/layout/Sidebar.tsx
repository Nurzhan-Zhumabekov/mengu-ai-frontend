import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Inbox, CheckSquare, FileText,
  Calendar, Lightbulb, BarChart2, Settings,
  Zap, LogOut, Bell, ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/store'
import { initials } from '@/utils/helpers'
import { cn } from '@/utils/helpers'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  badge?: number
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
    section: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex flex-col w-[220px] min-w-[220px] bg-navy-800 h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-magenta-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[17px] font-medium text-white leading-tight">Mengu</div>
            <div className="text-[10px] text-white/40">AI Execution Layer</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.section} className="mb-1">
            <div className="px-4 py-2 text-[10px] text-white/30 font-medium uppercase tracking-widest">
              {group.section}
            </div>
            {group.items.map(({ to, icon: Icon, label, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
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
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="nav-item w-full text-left"
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-magenta-500 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
            {initials(user?.full_name ?? 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-white/85 truncate">
              {user?.full_name ?? 'User'}
            </div>
            <div className="text-[11px] text-white/40">{user?.role}</div>
          </div>
          <ChevronDown size={14} className="text-white/30 flex-shrink-0" />
        </div>
      </div>
    </aside>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

interface TopbarProps {
  title: string
  actions?: React.ReactNode
}

export function Topbar({ title, actions }: TopbarProps) {
  return (
    <header className="h-14 flex items-center px-6 bg-white border-b border-gray-100 gap-4 flex-shrink-0">
      <h1 className="text-base font-medium text-gray-900">{title}</h1>
      <div className="ml-auto flex items-center gap-2.5">
        {actions}
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
          <span className="text-gray-400">Search...</span>
          <kbd className="ml-2 text-[11px] text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
        <button className="relative w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-magenta-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
