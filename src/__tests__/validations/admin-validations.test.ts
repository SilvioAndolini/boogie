import { describe, it, expect } from 'vitest'
import {
  adminRevisarVerificacionSchema,
  adminActualizarRolSchema,
  adminSuspenderUsuarioSchema,
  adminActualizarPropiedadSchema,
  adminActualizarReservaSchema,
  adminVerificarPagoSchema,
  adminModerarResenaSchema,
  adminNotificacionSchema,
  adminRegistroUsuarioSchema,
  adminAuditFilterSchema,
} from '@/lib/admin-validations'

describe('adminRevisarVerificacionSchema', () => {
  it('acepta aprobacion sin motivo', () => {
    const result = adminRevisarVerificacionSchema.safeParse({
      verificacionId: 'v-1',
      accion: 'APROBADA',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza RECHAZADA sin motivo', () => {
    const result = adminRevisarVerificacionSchema.safeParse({
      verificacionId: 'v-1',
      accion: 'RECHAZADA',
    })
    expect(result.success).toBe(false)
  })

  it('acepta RECHAZADA con motivo valido', () => {
    const result = adminRevisarVerificacionSchema.safeParse({
      verificacionId: 'v-1',
      accion: 'RECHAZADA',
      motivoRechazo: 'Documento ilegible, por favor reenviar',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza motivo menor a 5 caracteres en rechazo', () => {
    const result = adminRevisarVerificacionSchema.safeParse({
      verificacionId: 'v-1',
      accion: 'RECHAZADA',
      motivoRechazo: 'No',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza accion invalida', () => {
    const result = adminRevisarVerificacionSchema.safeParse({
      verificacionId: 'v-1',
      accion: 'PENDIENTE',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza verificacionId vacio', () => {
    const result = adminRevisarVerificacionSchema.safeParse({
      verificacionId: '',
      accion: 'APROBADA',
    })
    expect(result.success).toBe(false)
  })
})

describe('adminActualizarRolSchema', () => {
  it('acepta actualizacion de rol', () => {
    const result = adminActualizarRolSchema.safeParse({
      usuarioId: 'u-1',
      rol: 'ANFITRION',
    })
    expect(result.success).toBe(true)
  })

  it('acepta actualizacion de plan', () => {
    const result = adminActualizarRolSchema.safeParse({
      usuarioId: 'u-1',
      plan: 'ULTRA',
    })
    expect(result.success).toBe(true)
  })

  it('acepta activo como string true/false', () => {
    expect(adminActualizarRolSchema.safeParse({ usuarioId: 'u-1', activo: 'true' }).success).toBe(true)
    expect(adminActualizarRolSchema.safeParse({ usuarioId: 'u-1', activo: 'false' }).success).toBe(true)
  })

  it('rechaza si no hay ningun cambio', () => {
    const result = adminActualizarRolSchema.safeParse({
      usuarioId: 'u-1',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza rol invalido', () => {
    const result = adminActualizarRolSchema.safeParse({
      usuarioId: 'u-1',
      rol: 'SUPERADMIN',
    })
    expect(result.success).toBe(false)
  })

  it('acepta roles validos', () => {
    const roles = ['BOOGER', 'ANFITRION', 'AMBOS', 'ADMIN']
    roles.forEach(rol => {
      expect(adminActualizarRolSchema.safeParse({ usuarioId: 'u-1', rol }).success).toBe(true)
    })
  })
})

describe('adminSuspenderUsuarioSchema', () => {
  it('acepta datos validos', () => {
    expect(adminSuspenderUsuarioSchema.safeParse({ usuarioId: 'u-1', activo: false }).success).toBe(true)
  })
  it('acepta motivo opcional', () => {
    expect(adminSuspenderUsuarioSchema.safeParse({ usuarioId: 'u-1', activo: true, motivo: 'Resuelto' }).success).toBe(true)
  })
})

describe('adminActualizarPropiedadSchema', () => {
  it('acepta actualizacion de estado', () => {
    expect(adminActualizarPropiedadSchema.safeParse({
      propiedadId: 'p-1',
      estadoPublicacion: 'PUBLICADA',
    }).success).toBe(true)
  })

  it('acepta marcar como destacada', () => {
    expect(adminActualizarPropiedadSchema.safeParse({
      propiedadId: 'p-1',
      destacada: true,
    }).success).toBe(true)
  })

  it('rechaza estado de publicacion invalido', () => {
    expect(adminActualizarPropiedadSchema.safeParse({
      propiedadId: 'p-1',
      estadoPublicacion: 'ELIMINADA',
    }).success).toBe(false)
  })
})

describe('adminActualizarReservaSchema', () => {
  it('acepta confirmar', () => {
    expect(adminActualizarReservaSchema.safeParse({ reservaId: 'r-1', accion: 'confirmar' }).success).toBe(true)
  })
  it('acepta rechazar', () => {
    expect(adminActualizarReservaSchema.safeParse({ reservaId: 'r-1', accion: 'rechazar' }).success).toBe(true)
  })
  it('acepta cancelar', () => {
    expect(adminActualizarReservaSchema.safeParse({ reservaId: 'r-1', accion: 'cancelar' }).success).toBe(true)
  })
  it('rechaza accion invalida', () => {
    expect(adminActualizarReservaSchema.safeParse({ reservaId: 'r-1', accion: 'eliminar' }).success).toBe(false)
  })
})

describe('adminVerificarPagoSchema', () => {
  it('acepta VERIFICADO', () => {
    expect(adminVerificarPagoSchema.safeParse({ pagoId: 'p-1', accion: 'VERIFICADO' }).success).toBe(true)
  })
  it('acepta ACREDITADO', () => {
    expect(adminVerificarPagoSchema.safeParse({ pagoId: 'p-1', accion: 'ACREDITADO' }).success).toBe(true)
  })
  it('acepta RECHAZADO', () => {
    expect(adminVerificarPagoSchema.safeParse({ pagoId: 'p-1', accion: 'RECHAZADO' }).success).toBe(true)
  })
  it('rechaza accion invalida', () => {
    expect(adminVerificarPagoSchema.safeParse({ pagoId: 'p-1', accion: 'PENDIENTE' }).success).toBe(false)
  })
  it('rechaza pagoId vacio', () => {
    expect(adminVerificarPagoSchema.safeParse({ pagoId: '', accion: 'VERIFICADO' }).success).toBe(false)
  })
})

describe('adminModerarResenaSchema', () => {
  it('acepta ocultar', () => {
    expect(adminModerarResenaSchema.safeParse({ resenaId: 'r-1', accion: 'ocultar' }).success).toBe(true)
  })
  it('acepta eliminar', () => {
    expect(adminModerarResenaSchema.safeParse({ resenaId: 'r-1', accion: 'eliminar' }).success).toBe(true)
  })
  it('acepta mostrar', () => {
    expect(adminModerarResenaSchema.safeParse({ resenaId: 'r-1', accion: 'mostrar' }).success).toBe(true)
  })
  it('rechaza accion invalida', () => {
    expect(adminModerarResenaSchema.safeParse({ resenaId: 'r-1', accion: 'editar' }).success).toBe(false)
  })
})

describe('adminNotificacionSchema', () => {
  it('acepta notificacion valida con usuarioId', () => {
    expect(adminNotificacionSchema.safeParse({
      usuarioId: 'u-1',
      titulo: 'Reserva confirmada',
      mensaje: 'Tu reserva ha sido confirmada exitosamente',
    }).success).toBe(true)
  })

  it('acepta notificacion sin usuarioId (broadcast)', () => {
    expect(adminNotificacionSchema.safeParse({
      titulo: 'Mantenimiento',
      mensaje: 'El sistema estara en mantenimiento esta noche',
    }).success).toBe(true)
  })

  it('rechaza titulo menor a 3 caracteres', () => {
    expect(adminNotificacionSchema.safeParse({
      titulo: 'Ok',
      mensaje: 'Un mensaje valido de prueba',
    }).success).toBe(false)
  })

  it('rechaza mensaje menor a 5 caracteres', () => {
    expect(adminNotificacionSchema.safeParse({
      titulo: 'Notificacion',
      mensaje: 'Hola',
    }).success).toBe(false)
  })

  it('acepta urlAccion valida', () => {
    expect(adminNotificacionSchema.safeParse({
      titulo: 'Ver reserva',
      mensaje: 'Tienes una nueva reserva pendiente',
      urlAccion: 'https://boogierent.com/dashboard',
    }).success).toBe(true)
  })

  it('acepta urlAccion vacia', () => {
    expect(adminNotificacionSchema.safeParse({
      titulo: 'Ver reserva',
      mensaje: 'Tienes una nueva reserva pendiente',
      urlAccion: '',
    }).success).toBe(true)
  })

  it('rechaza urlAccion invalida', () => {
    expect(adminNotificacionSchema.safeParse({
      titulo: 'Ver reserva',
      mensaje: 'Tienes una nueva reserva pendiente',
      urlAccion: 'no-es-url',
    }).success).toBe(false)
  })
})

describe('adminRegistroUsuarioSchema', () => {
  const validInput = {
    nombre: 'Admin',
    apellido: 'Test',
    email: 'admin@test.com',
    password: '12345678',
    confirmPassword: '12345678',
    tipoDocumento: 'CEDULA',
    numeroDocumento: 'V-12345678',
    telefono: '04121234567',
    codigoPais: '+58',
    rol: 'ADMIN' as const,
  }

  it('acepta datos validos', () => {
    expect(adminRegistroUsuarioSchema.safeParse(validInput).success).toBe(true)
  })

  it('rol por defecto es BOOGER', () => {
    const { rol, ...input } = validInput
    const result = adminRegistroUsuarioSchema.safeParse(input)
    if (result.success) {
      expect(result.data.rol).toBe('BOOGER')
    }
  })

  it('rechaza contrasenas que no coinciden', () => {
    expect(adminRegistroUsuarioSchema.safeParse({
      ...validInput,
      confirmPassword: 'diferente',
    }).success).toBe(false)
  })

  it('acepta todos los roles validos', () => {
    const roles = ['BOOGER', 'ANFITRION', 'AMBOS', 'ADMIN']
    roles.forEach(rol => {
      expect(adminRegistroUsuarioSchema.safeParse({ ...validInput, rol }).success).toBe(true)
    })
  })
})

describe('adminAuditFilterSchema', () => {
  it('acepta filtros vacios con defaults', () => {
    const result = adminAuditFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.pagina).toBe(1)
      expect(result.data.limite).toBe(50)
    }
  })

  it('acepta entidad valida', () => {
    const entidades = ['usuario', 'propiedad', 'reserva', 'pago', 'verificacion', 'wallet', 'resena', 'notificacion', 'configuracion']
    entidades.forEach(entidad => {
      expect(adminAuditFilterSchema.safeParse({ entidad }).success).toBe(true)
    })
  })

  it('rechaza limite mayor a 100', () => {
    expect(adminAuditFilterSchema.safeParse({ limite: 101 }).success).toBe(false)
  })

  it('rechaza pagina menor a 1', () => {
    expect(adminAuditFilterSchema.safeParse({ pagina: 0 }).success).toBe(false)
  })
})
