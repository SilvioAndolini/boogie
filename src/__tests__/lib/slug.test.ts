import { describe, it, expect } from 'vitest'
import { generarSlug } from '@/lib/slug'

describe('generarSlug', () => {
  it('convierte a minusculas', () => {
    const slug = generarSlug('APARTAMENTO CARACAS')
    expect(slug).toMatch(/apartamento-caracas-[a-z0-9]{6}/)
  })

  it('elimina acentos', () => {
    const slug = generarSlug('Cabaña en Mérida')
    expect(slug).toMatch(/cabana-en-merida-[a-z0-9]{6}/)
  })

  it('elimina caracteres especiales', () => {
    const slug = generarSlug('Apto. #3 @Caracas!')
    expect(slug).toMatch(/apto-3-caracas-[a-z0-9]{6}/)
  })

  it('reemplaza espacios con guiones', () => {
    const slug = generarSlug('mi apartamento bonito')
    expect(slug).toMatch(/mi-apartamento-bonito-[a-z0-9]{6}/)
  })

  it('elimina guiones duplicados', () => {
    const slug = generarSlug('mi---apartamento---bonito')
    expect(slug).toMatch(/mi-apartamento-bonito-[a-z0-9]{6}/)
  })

  it('trunca a 60 caracteres maximo (sin sufijo)', () => {
    const titulo = 'A'.repeat(100)
    const slug = generarSlug(titulo)
    const sinSufijo = slug.slice(0, -7)
    expect(sinSufijo.length).toBeLessThanOrEqual(60)
  })

  it('agrega sufijo random de 6 caracteres', () => {
    const slug1 = generarSlug('Mismo Titulo')
    const slug2 = generarSlug('Mismo Titulo')
    expect(slug1).not.toBe(slug2)
  })

  it('no termina con guion antes del sufijo', () => {
    const slug = generarSlug('titulo con guion-')
    expect(slug).not.toMatch(/--/)
  })

  it('maneja string vacio', () => {
    const slug = generarSlug('')
    expect(slug).toMatch(/-[a-z0-9]{6}$/)
  })

  it('maneja solo caracteres especiales', () => {
    const slug = generarSlug('@#$%^&*')
    expect(slug).toMatch(/-[a-z0-9]{6}$/)
  })
})
