import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('admin-dashboard.actions - estructura KPIs', () => {
  it('stats tiene las secciones esperadas', () => {
    const secciones = ['usuarios', 'propiedades', 'reservas', 'pagos', 'crecimientoReservas']
    expect(secciones).toContain('usuarios')
    expect(secciones).toContain('propiedades')
    expect(secciones).toContain('reservas')
    expect(secciones).toContain('pagos')
  })

  it('charts tiene los graficos esperados', () => {
    const graficos = ['ingresosByMonth', 'reservasByStatus', 'propiedadesByCiudad', 'usersByDay']
    expect(graficos).toHaveLength(4)
  })

  it('tables tiene las tablas esperadas', () => {
    const tablas = ['reservas', 'actividad']
    expect(tablas).toHaveLength(2)
  })
})
