export type ActionResult<T = void> =
  | { exito: true; datos: T }
  | { exito: false; error: string }

export type ListResult<T> =
  | { exito: true; datos: T[]; total?: number }
  | { exito: false; error: string }

export function exito<T>(datos: T): ActionResult<T> & { exito: true } {
  return { exito: true, datos } as ActionResult<T> & { exito: true }
}

export function error(mensaje: string): ActionResult<never> & { exito: false } {
  return { exito: false, error: mensaje } as ActionResult<never> & { exito: false }
}

export function listaError<T>(mensaje: string): ListResult<T> & { exito: false } {
  return { exito: false, error: mensaje } as ListResult<T> & { exito: false }
}

export function isExito<T>(result: ActionResult<T>): result is { exito: true; datos: T } {
  return result.exito === true
}

export function isError<T>(result: ActionResult<T>): result is { exito: false; error: string } {
  return result.exito === false
}
