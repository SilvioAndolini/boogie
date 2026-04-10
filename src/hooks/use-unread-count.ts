'use client'

import { useState, useEffect, useCallback } from 'react'
import { getConteoNoLeidos } from '@/actions/chat.actions'

export function useUnreadCount(intervalMs = 15000) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const c = await getConteoNoLeidos()
    setCount(c)
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, intervalMs)
    return () => clearInterval(id)
  }, [refresh, intervalMs])

  return { count, refresh }
}
