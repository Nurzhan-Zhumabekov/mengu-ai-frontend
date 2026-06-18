import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, CheckSquare, Calendar, Lightbulb, BarChart2, Settings, Inbox, LayoutDashboard, Users, ClipboardList } from 'lucide-react'
import { useUIStore } from '@/store'

interface SearchResult {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  category: string
}

const ALL_ITEMS: SearchResult[] = [
  { id: 'dashboard',   label: 'Dashboard',         icon: <LayoutDashboard size={16} />, path: '/',          category: 'Pages' },
  { id: 'inbox',       label: 'Inbox',              icon: <Inbox size={16} />,           path: '/inbox',     category: 'Pages' },
  { id: 'tasks',       label: 'Tasks',              icon: <CheckSquare size={16} />,     path: '/tasks',     category: 'Pages' },
  { id: 'documents',   label: 'Documents',          icon: <FileText size={16} />,        path: '/documents', category: 'Pages' },
  { id: 'calendar',    label: 'Calendar',           icon: <Calendar size={16} />,        path: '/calendar',  category: 'Pages' },
  { id: 'insights',    label: 'AI Insights',        icon: <Lightbulb size={16} />,       path: '/insights',  category: 'Pages' },
  { id: 'analytics',   label: 'Analytics',          icon: <BarChart2 size={16} />,       path: '/analytics', category: 'Pages' },
  { id: 'settings',    label: 'Settings',           icon: <Settings size={16} />,        path: '/settings',  category: 'Pages' },
  { id: 'users',       label: 'User Management',    icon: <Users size={16} />,           path: '/users',     category: 'Admin' },
  { id: 'audit',       label: 'Audit Log',          icon: <ClipboardList size={16} />,   path: '/audit',     category: 'Admin' },
  // Quick actions
  { id: 'new-task',    label: 'Create New Task',    icon: <CheckSquare size={16} />,     path: '/tasks',     category: 'Actions' },
  { id: 'upload-doc',  label: 'Upload Document',    icon: <FileText size={16} />,        path: '/documents', category: 'Actions' },
]

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // ⌘K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  const filtered = useMemo(() => {
    if (!query) return ALL_ITEMS
    const q = query.toLowerCase()
    return ALL_ITEMS.filter((item) => item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
  }, [query])

  useEffect(() => { setSelectedIndex(0) }, [query])

  function handleSelect(item: SearchResult) {
    navigate(item.path)
    setCommandPaletteOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex])
    }
  }

  if (!commandPaletteOpen) return null

  const grouped = filtered.reduce<Record<string, SearchResult[]>>((acc, item) => {
    acc[item.category] = acc[item.category] || []
    acc[item.category].push(item)
    return acc
  }, {})

  let flatIndex = 0

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" onClick={() => setCommandPaletteOpen(false)} />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-scale-in">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/5">
          <Search size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, tasks, documents..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <kbd className="text-[11px] text-gray-400 bg-gray-100 dark:bg-navy-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              No results found
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                  {category}
                </div>
                {items.map((item) => {
                  const idx = flatIndex++
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        idx === selectedIndex
                          ? 'bg-magenta-50 dark:bg-magenta-500/10 text-magenta-700 dark:text-magenta-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {idx === selectedIndex && (
                        <span className="text-[11px] text-gray-400">↵</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
