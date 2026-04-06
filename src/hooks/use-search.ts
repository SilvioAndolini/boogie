// Hook para búsqueda de propiedades
'use client'

import { useState, useCallback } from 'react'
import { useDebounce } from './use-debounce'
import type { FiltrosBusqueda } from '@/types'

export function useSearch() {
  const [filtros, setFiltros] = useState<FiltrosBusqueda>({})
  const [cargando, setCargando] = useState(false)

  const ubicacionDebounceada = useDebounce(filtros.ubicacion, 400)

  const actualizarFiltro = useCallback(<K extends keyof FiltrosBusqueda>(
    key: K,
    value: FiltrosBusqueda[K]
  ) => {
    setFiltros(prev => ({ ...prev, [key]: value }))
  }, [])

  const limpiarFiltros = useCallback(() => {
    setFiltros({})
  }, [])

  return {
    filtros,
    ubicacionDebounceada,
    cargando,
    setCargando,
    actualizarFiltro,
    limpiarFiltros,
  }
}
