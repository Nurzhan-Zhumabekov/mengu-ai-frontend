import { clsx, type ClassValue } from 'clsx'
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns'
import { enUS } from 'date-fns/locale'
import type { TaskStatus, ActionStatus, DraftStatus } from '@/types'

// ─── Class merging ────────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: enUS })
}

export function formatDate(date: string): string {
  return format(new Date(date), 'd MMM yyyy', { locale: enUS })
}

export function formatTime(date: string): string {
  return format(new Date(date), 'HH:mm')
}

export function formatDateTime(date: string): string {
  return format(new Date(date), 'd MMM yyyy HH:mm', { locale: enUS })
}

export function isDueSoon(date?: string): boolean {
  if (!date) return false
  const d = new Date(date)
  return !isPast(d) && d.getTime() - Date.now() < 1000 * 60 * 60 * 24
}

export function isOverdue(date?: string): boolean {
  if (!date) return false
  return isPast(new Date(date))
}

export function formatDue(date?: string): string {
  if (!date) return '—'
  if (isToday(new Date(date))) return `Today ${formatTime(date)}`
  if (isOverdue(date)) return `Overdue ${timeAgo(date)}`
  return formatDate(date)
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export function taskStatusLabel(s: TaskStatus): string {
  return {
    new: 'New',
    in_progress: 'In Progress',
    done: 'Done',
    cancelled: 'Cancelled',
  }[s]
}

export function actionStatusClass(s: ActionStatus): string {
  return {
    success: 'status-approved',
    failed: 'badge-high',
    skipped: 'status-draft',
  }[s]
}

export function actionStatusLabel(s: ActionStatus): string {
  return {
    success: 'Success',
    failed: 'Failed',
    skipped: 'Skipped',
  }[s]
}

export function eventStatusClass(s: string): string {
  return {
    new: 'status-draft',
    processing: 'status-review',
    completed: 'status-approved',
    failed: 'badge-high',
  }[s] ?? 'status-draft'
}

export function draftStatusLabel(s: DraftStatus): string {
  return {
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    sent: 'Sent',
    rejected: 'Rejected',
  }[s]
}

export function draftStatusClass(s: DraftStatus): string {
  return {
    pending_approval: 'status-review',
    approved: 'status-approved',
    sent: 'status-signed',
    rejected: 'badge-high',
  }[s] ?? 'status-draft'
}

// ─── Initials ─────────────────────────────────────────────────────────────────
export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── File size ────────────────────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
