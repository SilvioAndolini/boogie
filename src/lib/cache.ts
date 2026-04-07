import { unstable_cache, revalidateTag } from 'next/cache'

export interface CacheOptions {
  revalidate?: number
  tags?: string[]
}

export function createCacheKey(prefix: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return prefix
  }
  const sortedEntries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join('&')
  return sortedEntries ? `${prefix}?${sortedEntries}` : prefix
}

export function cachedFunction<Args extends unknown[], T>(
  name: string,
  fn: (...args: Args) => Promise<T>,
  options: CacheOptions = {}
) {
  const { revalidate = 300, tags = [] } = options
  return unstable_cache(fn, [name], {
    revalidate,
    tags: [name, ...tags],
  })
}

// revalidateTag types are incorrect in Next.js - it only takes 1 argument
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const revalidateTagTyped = revalidateTag as unknown as (tag: string) => Promise<any>

export function invalidateCache(tags: string[]) {
  tags.forEach((tag) => revalidateTagTyped(tag))
}

export const CACHE_TAGS = {
  PROPIEDADES: 'propiedades',
  PROPIEDAD: (id: string) => `propiedad-${id}`,
  ZONAS: 'zonas',
  ZONA: (slug: string) => `zona-${slug}`,
  UBICACIONES: 'ubicaciones',
  COTIZACION: 'cotizacion',
} as const

export const CACHE_TIMES = {
  PROPIEDADES_LIST: 60,
  PROPIEDAD_DETALLE: 300,
  ZONAS: 3600,
  UBICACIONES: 1800,
  COTIZACION: 3600,
} as const

export async function invalidatePropiedadCache(propiedadId?: string) {
  await revalidateTagTyped(CACHE_TAGS.PROPIEDADES)
  if (propiedadId) {
    await revalidateTagTyped(CACHE_TAGS.PROPIEDAD(propiedadId))
  }
}

