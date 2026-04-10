import { describe, it, expect } from 'vitest'
import { formatFileSize } from '@/lib/image-optimize'

describe('formatFileSize', () => {
  it('formatea bytes menores a 1KB', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formatea kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
  })

  it('formatea megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB')
  })

  it('formatea 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('formatea KB con decimal', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('formatea MB con decimales', () => {
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.50 MB')
  })
})
