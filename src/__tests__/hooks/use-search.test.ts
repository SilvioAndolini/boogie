import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from '@/hooks/use-search'

describe('useSearch', () => {
  it('inicializa con filtros vacios', () => {
    const { result } = renderHook(() => useSearch())
    expect(result.current.filtros).toEqual({})
  })

  it('inicializa con cargando false', () => {
    const { result } = renderHook(() => useSearch())
    expect(result.current.cargando).toBe(false)
  })

  it('actualizarFiltro agrega un filtro', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.actualizarFiltro('ubicacion', 'Caracas')
    })

    expect(result.current.filtros.ubicacion).toBe('Caracas')
  })

  it('actualizarFiltro permite multiple filtros', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.actualizarFiltro('ubicacion', 'Caracas')
      result.current.actualizarFiltro('huespedes', 4)
    })

    expect(result.current.filtros.ubicacion).toBe('Caracas')
    expect(result.current.filtros.huespedes).toBe(4)
  })

  it('limpiarFiltros resetea todos los filtros', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.actualizarFiltro('ubicacion', 'Caracas')
      result.current.actualizarFiltro('huespedes', 4)
    })

    act(() => {
      result.current.limpiarFiltros()
    })

    expect(result.current.filtros).toEqual({})
  })

  it('setCargando cambia el estado', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setCargando(true)
    })

    expect(result.current.cargando).toBe(true)
  })
})
