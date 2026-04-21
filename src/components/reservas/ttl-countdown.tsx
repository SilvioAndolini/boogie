'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface TTLCountdownProps {
  fechaExpiracion: Date
  onExpired: () => void
}

export function TTLCountdown({ fechaExpiracion, onExpired }: TTLCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = Math.floor((fechaExpiracion.getTime() - Date.now()) / 1000)
    return Math.max(0, diff)
  })

  useEffect(() => {
    if (secondsLeft <= 0) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsLeft])

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpired()
    }
  }, [secondsLeft, onExpired])

  const format = useCallback((totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  const urgent = secondsLeft <= 60
  const isExpired = secondsLeft <= 0

  if (isExpired) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-sm font-semibold text-red-600">Tiempo agotado</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-colors ${
      urgent
        ? 'border-red-200 bg-red-50 animate-pulse'
        : 'border-amber-200 bg-amber-50'
    }`}>
      <Clock className={`h-4 w-4 ${urgent ? 'text-red-600' : 'text-amber-700'}`} />
      <span className={`text-xs font-medium ${urgent ? 'text-red-600' : 'text-amber-700'}`}>
        Tiempo para pagar
      </span>
      <span className={`font-mono text-sm font-bold ${urgent ? 'text-red-700' : 'text-amber-800'}`}>
        {format(secondsLeft)}
      </span>
    </div>
  )
}
