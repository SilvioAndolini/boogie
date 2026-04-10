import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('retorna el valor inicial inmediatamente', () => {
    const { result } = renderHook(() => useDebounce('hola', 300))
    expect(result.current).toBe('hola')
  })

  it('retorna el valor debounced despues del delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hola', delay: 300 } }
    )

    rerender({ value: 'mundo', delay: 300 })
    expect(result.current).toBe('hola')

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('mundo')
  })

  it('usa delay por defecto de 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'b' })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('b')
  })

  it('cancela el timer anterior al cambiar rapidamente', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(150) })
    rerender({ value: 'c' })
    act(() => { vi.advanceTimersByTime(150) })

    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(150) })
    expect(result.current).toBe('c')
  })

  it('funciona con valores numericos', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } }
    )

    rerender({ value: 42 })
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe(42)
  })
})
