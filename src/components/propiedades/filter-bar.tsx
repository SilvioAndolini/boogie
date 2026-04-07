'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo, Suspense } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const TIPOS = [
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'CASA', label: 'Casa' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'CABANA', label: 'Cabaña' },
  { value: 'ESTUDIO', label: 'Estudio' },
  { value: 'HABITACION', label: 'Habitación' },
  { value: 'LOFT', label: 'Loft' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'FINCA', label: 'Finca' },
]

const PRECIOS = [
  { value: '0-20', label: 'Hasta $20', min: 0, max: 20 },
  { value: '20-50', label: '$20 - $50', min: 20, max: 50 },
  { value: '50-100', label: '$50 - $100', min: 50, max: 100 },
  { value: '100-200', label: '$100 - $200', min: 100, max: 200 },
  { value: '200-500', label: '$200 - $500', min: 200, max: 500 },
  { value: '500+', label: '$500+', min: 500, max: 0 },
]

const RANGOS_NUMERICOS = [
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '6', label: '6+' },
  { value: '8', label: '8+' },
]

const ORDENAR = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'rating', label: 'Mejor calificados' },
]

const FILTER_KEYS = ['tipoPropiedad', 'precioMin', 'precioMax', 'huespedes', 'habitaciones', 'banos', 'ordenarPor']
const ANY_VALUE = 'Todos los tipos'

const selectClass =
  'h-8 w-full rounded-lg border-[#E8E4DF] bg-white text-xs'
const triggerClass = 'text-[11px] font-medium'

function FilterPanelInner({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const setFilter = useCallback(
    (key: string, raw: string | null) => {
      const v = raw ?? ''
      updateParams({ [key]: v === ANY_VALUE ? '' : v })
    },
    [updateParams],
  )

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false })
    onClose?.()
  }, [router, pathname, onClose])

  const activeCount = useMemo(
    () => FILTER_KEYS.filter((key) => searchParams.has(key) && searchParams.get(key) !== '').length,
    [searchParams],
  )

  const currentTipo = searchParams.get('tipoPropiedad') || ''
  const currentPrecioKey = useMemo(() => {
    const min = searchParams.get('precioMin')
    const max = searchParams.get('precioMax')
    if (!min && !max) return ''
    return `${min || '0'}-${max || ''}`
  }, [searchParams])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#E8E4DF] px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#1B4332]" />
          <span className="text-sm font-semibold text-[#1A1A1A]">Filtros</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1B4332] text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-[11px] font-medium text-[#E76F51] hover:underline"
            >
              Limpiar todo
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-md text-[#6B6560] transition-colors hover:bg-[#F8F6F3] hover:text-[#1A1A1A]"
              aria-label="Cerrar filtros"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Tipo de propiedad
          </label>
          <Select
            value={currentTipo || ANY_VALUE}
            onValueChange={(v) => setFilter('tipoPropiedad', v)}
          >
            <SelectTrigger className={selectClass}>
              <SelectValue className={triggerClass} placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_VALUE}>Todos los tipos</SelectItem>
              {TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Precio por noche
          </label>
          <Select
            value={currentPrecioKey || ANY_VALUE}
            onValueChange={(v) => {
              if (v === ANY_VALUE) {
                updateParams({ precioMin: '', precioMax: '' })
              } else {
                const found = PRECIOS.find((p) => p.value === v)
                if (found) {
                  updateParams({
                    precioMin: found.min > 0 ? String(found.min) : '',
                    precioMax: found.max > 0 ? String(found.max) : '',
                  })
                }
              }
            }}
          >
            <SelectTrigger className={selectClass}>
              <SelectValue className={triggerClass} placeholder="Cualquier precio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_VALUE}>Cualquier precio</SelectItem>
              {PRECIOS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Huéspedes
          </label>
          <Select
            value={searchParams.get('huespedes') ?? ANY_VALUE}
            onValueChange={(v) => setFilter('huespedes', v)}
          >
            <SelectTrigger className={selectClass}>
              <SelectValue className={triggerClass} placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_VALUE}>Cualquiera</SelectItem>
              {RANGOS_NUMERICOS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label} huéspedes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Habitaciones
          </label>
          <Select
            value={searchParams.get('habitaciones') ?? ANY_VALUE}
            onValueChange={(v) => setFilter('habitaciones', v)}
          >
            <SelectTrigger className={selectClass}>
              <SelectValue className={triggerClass} placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_VALUE}>Cualquiera</SelectItem>
              {RANGOS_NUMERICOS.slice(0, 4).map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Baños
          </label>
          <Select
            value={searchParams.get('banos') ?? ANY_VALUE}
            onValueChange={(v) => setFilter('banos', v)}
          >
            <SelectTrigger className={selectClass}>
              <SelectValue className={triggerClass} placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_VALUE}>Cualquiera</SelectItem>
              {RANGOS_NUMERICOS.slice(0, 3).map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Ordenar por
          </label>
          <Select
            value={searchParams.get('ordenarPor') ?? 'recientes'}
            onValueChange={(v) => setFilter('ordenarPor', v)}
          >
            <SelectTrigger className={selectClass}>
              <SelectValue className={triggerClass} placeholder="Más recientes" />
            </SelectTrigger>
            <SelectContent>
              {ORDENAR.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export function FilterPanel({ onClose }: { onClose?: () => void }) {
  return (
    <Suspense fallback={<div className="h-full animate-pulse bg-[#F8F6F3]" />}>
      <FilterPanelInner onClose={onClose} />
    </Suspense>
  )
}
