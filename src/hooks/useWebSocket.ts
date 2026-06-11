import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store'

type WSEvent =
  | 'new_task'
  | 'task_updated'
  | 'new_insight'
  | 'event_processed'
  | 'workflow_status_changed'
  | 'notification'

interface WSMessage {
  type: WSEvent
  payload: Record<string, unknown>
}

/**
 * useWebSocket — connects to /ws/v1 and invalidates React Query cache
 * when server events arrive.
 *
 * Call once in AppLayout or root component.
 */
export function useWebSocket() {
  const { token, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) return

    const wsBase = import.meta.env.VITE_WS_URL ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
    const url = `${wsBase}/ws/v1?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      console.info('[Mengu WS] Connected')
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg: WSMessage = JSON.parse(event.data as string)
        handleMessage(msg)
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      console.info('[Mengu WS] Disconnected, reconnecting in 3s...')
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [token, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleMessage(msg: WSMessage) {
    switch (msg.type) {
      case 'new_task':
      case 'task_updated':
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        break
      case 'new_insight':
        queryClient.invalidateQueries({ queryKey: ['insights'] })
        break
      case 'event_processed':
        queryClient.invalidateQueries({ queryKey: ['events'] })
        queryClient.invalidateQueries({ queryKey: ['analytics'] })
        break
      case 'workflow_status_changed':
        queryClient.invalidateQueries({ queryKey: ['documents'] })
        break
      default:
        break
    }
  }

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])
}
