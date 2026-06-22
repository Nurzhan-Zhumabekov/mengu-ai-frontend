import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store'

export type WsEventType =
  | 'new_task'
  | 'task_updated'
  | 'new_insight'
  | 'event_processed'
  | 'workflow_status_changed'
  | 'notification'

export interface WsMessage {
  type: WsEventType
  payload: Record<string, unknown>
}

type MessageHandler = (msg: WsMessage) => void

/**
 * Hook that connects to the backend WebSocket for real-time updates.
 * Falls back gracefully if the backend hasn't implemented WebSocket yet
 * (the connection will fail silently and handlers won't fire — the app
 * already falls back to polling via LIVE_POLL_INTERVAL_MS).
 */
export function useWebSocket(handlers?: Partial<Record<WsEventType, MessageHandler>>) {
  const wsRef = useRef<WebSocket | null>(null)
  const token = useAuthStore((s) => s.accessToken)
  const orgId = useAuthStore((s) => s.user?.org_id)

  const connect = useCallback(() => {
    if (!token || !orgId) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/ws/v1?token=${token}`

    try {
      const ws = new WebSocket(url)
      ws.onopen = () => { console.debug('[WS] Connected') }
      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data)
          const handler = handlers?.[msg.type]
          if (handler) handler(msg)
        } catch { /* ignore parse errors */ }
      }
      ws.onclose = () => { console.debug('[WS] Disconnected') }
      ws.onerror = () => { /* ignore — backend may not support WS yet */ }
      wsRef.current = ws
    } catch {
      // Backend doesn't support WS — that's fine, polling handles updates
    }
  }, [token, orgId])

  useEffect(() => {
    connect()
    return () => { wsRef.current?.close() }
  }, [connect])

  return { ws: wsRef.current }
}
