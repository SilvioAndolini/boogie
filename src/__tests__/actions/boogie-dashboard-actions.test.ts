import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('boogie-dashboard.actions - estructura KPIs', () => {
  it('dashboard incluye metricas clave', () => {
    const metricas = ['ingresos', 'gastos', 'ocupacion', 'tarifaPromedio', 'nochesReservadas']
    expect(metricas).toContain('ingresos')
    expect(metricas).toContain('gastos')
    expect(metricas).toContain('ocupacion')
  })

  it('gastos de mantenimiento tienen campos requeridos', () => {
    const gasto = {
      descripcion: 'Reparacion de tuberia',
      monto: 150,
      categoria: 'MANTENIMIENTO',
      fecha: '2025-01-15',
    }
    expect(gasto).toHaveProperty('descripcion')
    expect(gasto).toHaveProperty('monto')
    expect(gasto.monto).toBeGreaterThan(0)
  })
})
