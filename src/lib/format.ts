// Utilidades de formato para la aplicación Boogie

/**
 * Formatea un precio con la moneda indicada
 */
export function formatPrecio(monto: number | string, moneda: 'USD' | 'VES' = 'USD'): string {
  const montoNum = typeof monto === 'string' ? parseFloat(monto) : monto
  if (moneda === 'USD') {
    return `$${montoNum.toFixed(2)}`
  }
  return `Bs. ${montoNum.toFixed(2)}`
}

/**
 * Formatea una fecha en formato legible en castellano
 */
export function formatFecha(fecha: Date | string): string {
  const f = typeof fecha === 'string' ? new Date(fecha) : fecha
  return f.toLocaleDateString('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formatea una fecha corta (dd/mm/aaaa)
 */
export function formatFechaCorta(fecha: Date | string): string {
  const f = typeof fecha === 'string' ? new Date(fecha) : fecha
  return f.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Trunca un texto a la longitud indicada
 */
export function truncate(texto: string, longitud: number = 100): string {
  if (texto.length <= longitud) return texto
  return texto.slice(0, longitud).trim() + '...'
}

/**
 * Formatea un número de teléfono venezolano
 */
export function formatTelefono(telefono: string): string {
  const limpio = telefono.replace(/\D/g, '')
  if (limpio.length === 11) {
    return `+58 ${limpio.slice(0, 3)}-${limpio.slice(3, 6)}-${limpio.slice(6)}`
  }
  return telefono
}

/**
 * Enmascara una cédula para mostrar solo los últimos 3 dígitos
 */
export function maskCedula(cedula: string): string {
  if (cedula.length <= 3) return '***'
  return '*'.repeat(cedula.length - 3) + cedula.slice(-3)
}

/**
 * Enmascara un número de cuenta bancaria
 */
export function maskCuenta(numero: string): string {
  if (numero.length <= 4) return '****'
  return '*'.repeat(numero.length - 4) + numero.slice(-4)
}

/**
 * Genera las iniciales de un nombre completo
 */
export function getIniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

/**
 * Calcula el número de noches entre dos fechas
 */
export function calcularNoches(entrada: Date, salida: Date): number {
  const diff = salida.getTime() - entrada.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
