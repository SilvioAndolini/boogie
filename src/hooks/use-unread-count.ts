'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getConteoNoLeidos } from '@/actions/chat.actions'

export function useUnreadCount(intervalMs = 30000) {
  const [count, setCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    const c = await getConteoNoLeidos()
    setCount(c)
  }, [])

  useEffect(() => {
    const startPolling = () => {
      refresh()
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(refresh, intervalMs)
    }

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startPolling()
      } else {
        stopPolling()
      }
    }

    if (document.visibilityState === 'visible') {
      startPolling()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refresh, intervalMs])

  return { count, refresh }
}
