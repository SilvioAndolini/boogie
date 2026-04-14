import { describe, it, expect } from 'vitest'
import {
  registroSchema,
  loginSchema,
  recuperacionSchema,
  propiedadSchema,
  crearReservaSchema,
  cancelarReservaSchema,
  confirmarReservaSchema,
  pagoSchema,
  resenaSchema,
  perfilSchema,
} from '@/lib/validations'

describe('registroSchema', () => {
  const validInput = {
    nombre: 'Juan',
    apellido: 'Perez',
    email: 'juan@test.com',
    password: '12345678',
    confirmPassword: '12345678',
    tipoDocumento: 'CEDULA' as const,
    numeroDocumento: 'V-12345678',
    telefono: '04121234567',
    codigoPais: '+58',
  }

  it('acepta datos validos', () => {
    expect(registroSchema.safeParse(validInput).success).toBe(true)
  })

  it('rechaza nombre menor a 2 caracteres', () => {
    const result = registroSchema.safeParse({ ...validInput, nombre: 'J' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('nombre')
    }
  })

  it('rechaza email invalido', () => {
    const result = registroSchema.safeParse({ ...validInput, email: 'no-email' })
    expect(result.success).toBe(false)
  })

  it('rechaza contrasena menor a 8 caracteres', () => {
    const result = registroSchema.safeParse({ ...validInput, password: '1234567', confirmPassword: '1234567' })
    expect(result.success).toBe(false)
  })

  it('rechaza si las contrasenas no coinciden', () => {
    const result = registroSchema.safeParse({ ...validInput, confirmPassword: 'diferent' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('confirmPassword'))
      expect(issue).toBeDefined()
      expect(issue?.message).toContain('no coinciden')
    }
  })

  it('acepta CEDULA con formato V-12345678', () => {
    const result = registroSchema.safeParse({ ...validInput, numeroDocumento: 'V-12345678' })
    expect(result.success).toBe(true)
  })

  it('acepta CEDULA con solo numeros', () => {
    const result = registroSchema.safeParse({ ...validInput, numeroDocumento: '12345678' })
    expect(result.success).toBe(true)
  })

  it('rechaza CEDULA con formato invalido', () => {
    const result = registroSchema.safeParse({ ...validInput, numeroDocumento: 'abc' })
    expect(result.success).toBe(false)
  })

  it('acepta PASAPORTE con formato alfanumerico', () => {
    const result = registroSchema.safeParse({
      ...validInput,
      tipoDocumento: 'PASAPORTE',
      numeroDocumento: 'AB12345',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza telefono menor a 7 caracteres', () => {
    const result = registroSchema.safeParse({ ...validInput, telefono: '123456' })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('acepta credenciales validas', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: '12345678' })
    expect(result.success).toBe(true)
  })

  it('rechaza email invalido', () => {
    const result = loginSchema.safeParse({ email: 'invalido', password: '12345678' })
    expect(result.success).toBe(false)
  })

  it('rechaza contrasena vacia', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('recuperacionSchema', () => {
  it('acepta email valido', () => {
    expect(recuperacionSchema.safeParse({ email: 'test@test.com' }).success).toBe(true)
  })
  it('rechaza email invalido', () => {
    expect(recuperacionSchema.safeParse({ email: 'nope' }).success).toBe(false)
  })
})

describe('propiedadSchema', () => {
  const validInput = {
    titulo: 'Hermoso apartamento en Caracas',
    descripcion: 'Un lugar increible para disfrutar con toda la familia en el centro de la ciudad',
    tipoPropiedad: 'APARTAMENTO',
    precioPorNoche: 50,
    moneda: 'USD',
    capacidadMaxima: 4,
    habitaciones: 2,
    banos: 1,
    camas: 2,
    direccion: 'Av. Principal, Edificio A',
    ciudad: 'Caracas',
    estado: 'Distrito Capital',
    politicaCancelacion: 'MODERADA',
    horarioCheckIn: '14:00',
    horarioCheckOut: '11:00',
    estanciaMinima: 1,
  }

  it('acepta datos validos', () => {
    expect(propiedadSchema.safeParse(validInput).success).toBe(true)
  })

  it('rechaza titulo menor a 5 caracteres', () => {
    const result = propiedadSchema.safeParse({ ...validInput, titulo: 'Hola' })
    expect(result.success).toBe(false)
  })

  it('rechaza titulo mayor a 100 caracteres', () => {
    const result = propiedadSchema.safeParse({ ...validInput, titulo: 'A'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rechaza descripcion menor a 20 caracteres', () => {
    const result = propiedadSchema.safeParse({ ...validInput, descripcion: 'Corto' })
    expect(result.success).toBe(false)
  })

  it('rechaza precio menor a 1', () => {
    const result = propiedadSchema.safeParse({ ...validInput, precioPorNoche: 0 })
    expect(result.success).toBe(false)
  })

  it('rechaza capacidadMaxima mayor a 20', () => {
    const result = propiedadSchema.safeParse({ ...validInput, capacidadMaxima: 21 })
    expect(result.success).toBe(false)
  })

  it('acepta tipoPropiedad valido', () => {
    const tipos = ['APARTAMENTO', 'CASA', 'VILLA', 'CABANA', 'ESTUDIO', 'HABITACION', 'LOFT', 'PENTHOUSE', 'FINCA', 'OTRO']
    tipos.forEach(tipo => {
      expect(propiedadSchema.safeParse({ ...validInput, tipoPropiedad: tipo }).success).toBe(true)
    })
  })

  it('rechaza tipoPropiedad invalido', () => {
    const result = propiedadSchema.safeParse({ ...validInput, tipoPropiedad: 'MANSION' })
    expect(result.success).toBe(false)
  })

  it('acepta campos opcionales como undefined', () => {
    const { zona, ...input } = validInput
    expect(propiedadSchema.safeParse(input).success).toBe(true)
  })

  it('coerces string numerico a number para precioPorNoche', () => {
    const result = propiedadSchema.safeParse({ ...validInput, precioPorNoche: '50' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.precioPorNoche).toBe('number')
    }
  })
})

describe('crearReservaSchema', () => {
  const futureDate = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    d.setHours(12, 0, 0, 0)
    return d
  }

  it('acepta datos validos', () => {
    const result = crearReservaSchema.safeParse({
      propiedadId: 'prop-1',
      fechaEntrada: futureDate(1),
      fechaSalida: futureDate(3),
      cantidadHuespedes: 2,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza fecha de salida anterior a entrada', () => {
    const result = crearReservaSchema.safeParse({
      propiedadId: 'prop-1',
      fechaEntrada: futureDate(5),
      fechaSalida: futureDate(3),
      cantidadHuespedes: 2,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path.includes('fechaSalida'))
      expect(issue).toBeDefined()
    }
  })

  it('rechaza 0 huespedes', () => {
    const result = crearReservaSchema.safeParse({
      propiedadId: 'prop-1',
      fechaEntrada: futureDate(1),
      fechaSalida: futureDate(3),
      cantidadHuespedes: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza mas de 20 huespedes', () => {
    const result = crearReservaSchema.safeParse({
      propiedadId: 'prop-1',
      fechaEntrada: futureDate(1),
      fechaSalida: futureDate(3),
      cantidadHuespedes: 21,
    })
    expect(result.success).toBe(false)
  })

  it('acepta notasHuesped opcional', () => {
    const result = crearReservaSchema.safeParse({
      propiedadId: 'prop-1',
      fechaEntrada: futureDate(1),
      fechaSalida: futureDate(3),
      cantidadHuespedes: 1,
      notasHuesped: 'Llego tarde',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza notasHuesped mayor a 1000 caracteres', () => {
    const result = crearReservaSchema.safeParse({
      propiedadId: 'prop-1',
      fechaEntrada: futureDate(1),
      fechaSalida: futureDate(3),
      cantidadHuespedes: 1,
      notasHuesped: 'A'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })
})

describe('cancelarReservaSchema', () => {
  it('acepta datos validos', () => {
    expect(cancelarReservaSchema.safeParse({ reservaId: 'res-1' }).success).toBe(true)
  })
  it('acepta motivo opcional', () => {
    expect(cancelarReservaSchema.safeParse({ reservaId: 'res-1', motivo: 'Cambio de planes' }).success).toBe(true)
  })
  it('rechaza reservaId vacio', () => {
    expect(cancelarReservaSchema.safeParse({ reservaId: '' }).success).toBe(false)
  })
})

describe('confirmarReservaSchema', () => {
  it('acepta confirmar', () => {
    expect(confirmarReservaSchema.safeParse({ reservaId: 'res-1', accion: 'confirmar' }).success).toBe(true)
  })
  it('acepta rechazar', () => {
    expect(confirmarReservaSchema.safeParse({ reservaId: 'res-1', accion: 'rechazar' }).success).toBe(true)
  })
  it('rechaza accion invalida', () => {
    expect(confirmarReservaSchema.safeParse({ reservaId: 'res-1', accion: 'otra' }).success).toBe(false)
  })
})

describe('pagoSchema', () => {
  it('acepta datos validos', () => {
    const result = pagoSchema.safeParse({
      reservaId: 'res-1',
      metodoPago: 'TRANSFERENCIA_BANCARIA',
      monto: 100,
      moneda: 'USD',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza monto menor a 1', () => {
    const result = pagoSchema.safeParse({
      reservaId: 'res-1',
      metodoPago: 'ZELLE',
      monto: 0,
    })
    expect(result.success).toBe(false)
  })

  it('acepta todos los metodos de pago validos', () => {
    const metodos = [
      'TRANSFERENCIA_BANCARIA', 'PAGO_MOVIL', 'ZELLE',
      'EFECTIVO_FARMATODO', 'USDT', 'EFECTIVO', 'CRIPTO', 'WALLET',
    ]
    metodos.forEach(metodo => {
      expect(pagoSchema.safeParse({
        reservaId: 'res-1',
        metodoPago: metodo,
        monto: 50,
      }).success).toBe(true)
    })
  })
})

describe('resenaSchema', () => {
  it('acepta resena valida', () => {
    const result = resenaSchema.safeParse({
      calificacion: 5,
      comentario: 'Excelente lugar, muy recomendado',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza calificacion fuera de rango', () => {
    expect(resenaSchema.safeParse({ calificacion: 0, comentario: 'Buen lugar para quedarse' }).success).toBe(false)
    expect(resenaSchema.safeParse({ calificacion: 6, comentario: 'Buen lugar para quedarse' }).success).toBe(false)
  })

  it('rechaza comentario menor a 10 caracteres', () => {
    const result = resenaSchema.safeParse({ calificacion: 4, comentario: 'Corto' })
    expect(result.success).toBe(false)
  })

  it('acepta calificaciones parciales opcionales', () => {
    const result = resenaSchema.safeParse({
      calificacion: 4,
      limpieza: 5,
      comunicacion: 4,
      ubicacion: 3,
      valor: 4,
      comentario: 'Muy buen lugar para descansar',
    })
    expect(result.success).toBe(true)
  })
})

describe('perfilSchema', () => {
  it('acepta datos validos', () => {
    const result = perfilSchema.safeParse({
      nombre: 'Juan',
      apellido: 'Perez',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza nombre menor a 2 caracteres', () => {
    const result = perfilSchema.safeParse({ nombre: 'J', apellido: 'Perez' })
    expect(result.success).toBe(false)
  })

  it('acepta bio opcional con maximo 500 caracteres', () => {
    expect(perfilSchema.safeParse({ nombre: 'Juan', apellido: 'Perez', bio: 'A'.repeat(500) }).success).toBe(true)
    expect(perfilSchema.safeParse({ nombre: 'Juan', apellido: 'Perez', bio: 'A'.repeat(501) }).success).toBe(false)
  })
})
