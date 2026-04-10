import { describe, it, expect, vi, beforeEach } from 'vitest'

function createMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('useMediaQuery', () => {
  beforeEach(() => {
    window.matchMedia = createMatchMedia(false)
  })

  it('retorna false cuando no hay match', async () => {
    const { useMediaQuery } = await import('@/hooks/use-media-query')
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)
  })

  it('retorna true cuando hay match', async () => {
    window.matchMedia = createMatchMedia(true)
    const { useMediaQuery } = await import('@/hooks/use-media-query')
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(true)
  })
})

import { renderHook } from '@testing-library/react'
