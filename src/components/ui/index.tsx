import { cn } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', className)}>
      {children}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  name: string
  size?: 'sm' | 'md'
  className?: string
}

export function Avatar({ name, size = 'sm', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'

  return (
    <div
      className={cn(
        'rounded-full bg-magenta-500 flex items-center justify-center font-medium text-white flex-shrink-0',
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-magenta-500', className)} size={20} />
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-magenta-500 mb-4">{icon}</div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  action?: React.ReactNode
}

export function Card({ children, className, title, action }: CardProps) {
  return (
    <div className={cn('card', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3.5">
          {title && <h2 className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Priority dot ─────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-red-400',
  medium:   'bg-amber-400',
  low:      'bg-gray-300',
}

export function PriorityDot({ priority }: { priority: string }) {
  return (
    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', PRIORITY_COLORS[priority])} />
  )
}

// ─── Pagination ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, perPage, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-navy-600">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {from}–{to} из {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-navy-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Назад
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page * perPage >= total}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-navy-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Вперёд
        </button>
      </div>
    </div>
  )
}
