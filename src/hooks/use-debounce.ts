// Hook de debounce para búsquedas
'use client'

import { useState, useEffect } from 'react'

export function useDebounce<T>(valor: T, delay: number = 300): T {
  const [valorDebounceado, setValorDebounceado] = useState(valor)

  useEffect(() => {
    const timer = setTimeout(() => {
      setValorDebounceado(valor)
    }, delay)

    return () => clearTimeout(timer)
  }, [valor, delay])

  return valorDebounceado
}
