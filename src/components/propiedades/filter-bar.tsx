'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo, Suspense, useState } from 'react'
import { X, SlidersHorizontal, Check } from 'lucide-react'
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

const AMENIDADES_POR_CATEGORIA: Record<string, { nombre: string; icono: string }[]> = {
  'Esenciales': [
    { nombre: 'Wi-Fi', icono: '📶' },
    { nombre: 'Aire acondicionado', icono: '❄️' },
    { nombre: 'Estacionamiento', icono: '🅿️' },
    { nombre: 'Agua caliente', icono: '🚿' },
  ],
  'Cocina': [
    { nombre: 'Cocina completa', icono: '🍳' },
    { nombre: 'Refrigerador', icono: '🧊' },
    { nombre: 'Cafetera', icono: '☕' },
    { nombre: 'Microondas', icono: '📡' },
  ],
  'Comodidades': [
    { nombre: 'TV', icono: '📺' },
    { nombre: 'Lavadora', icono: '🫧' },
    { nombre: 'Escritorio de trabajo', icono: '💻' },
    { nombre: 'Ventilador', icono: '🌀' },
  ],
  'Exterior': [
    { nombre: 'Piscina', icono: '🏊' },
    { nombre: 'Terraza/Balcón', icono: '🌅' },
    { nombre: 'Jardín', icono: '🌿' },
    { nombre: 'Área de BBQ', icono: '🔥' },
    { nombre: 'Vista al mar', icono: '🌊' },
  ],
  'Servicios': [
    { nombre: 'Se permiten mascotas', icono: '🐾' },
    { nombre: 'Adecuado para familias', icono: '👨‍👩‍👧' },
    { nombre: 'Check-in self service', icono: '🔑' },
  ],
}

const FILTER_KEYS = ['tipoPropiedad', 'precioMin', 'precioMax', 'huespedes', 'habitaciones', 'banos', 'amenidades', 'ordenarPor']
const ANY_VALUE = 'Todos los tipos'

function FilterPanelInner({ onClose, hideHeader }: { onClose?: () => void; hideHeader?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [amenidadSearch, setAmenidadSearch] = useState('')

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

  const selectedAmenidades = useMemo(() => {
    const raw = searchParams.get('amenidades')
    return raw ? raw.split(',').filter(Boolean) : []
  }, [searchParams])

  const toggleAmenidad = useCallback((nombre: string) => {
    const current = selectedAmenidades.includes(nombre)
      ? selectedAmenidades.filter((a) => a !== nombre)
      : [...selectedAmenidades, nombre]
    updateParams({ amenidades: current.join(',') })
  }, [selectedAmenidades, updateParams])

  const filteredCategorias = useMemo(() => {
    if (!amenidadSearch.trim()) return AMENIDADES_POR_CATEGORIA
    const search = amenidadSearch.toLowerCase()
    const result: Record<string, { nombre: string; icono: string }[]> = {}
    for (const [cat, items] of Object.entries(AMENIDADES_POR_CATEGORIA)) {
      const filtered = items.filter((i) => i.nombre.toLowerCase().includes(search))
      if (filtered.length > 0) result[cat] = filtered
    }
    return result
  }, [amenidadSearch])

  return (
    <div className="flex h-full flex-col">
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-[#E8E4DF] px-5 py-3.5">
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
                className="text-[11px] font-medium text-[#1B4332] hover:underline"
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
      )}

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Tipo de propiedad
          </label>
          <Select
            value={currentTipo || ANY_VALUE}
            onValueChange={(v) => setFilter('tipoPropiedad', v)}
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-[#E8E4DF] bg-white text-sm hover:border-[#D0CBC4]">
              <SelectValue className="text-sm" placeholder="Todos los tipos" />
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

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Rango de precio
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
            <SelectTrigger className="h-10 w-full rounded-xl border-[#E8E4DF] bg-white text-sm hover:border-[#D0CBC4]">
              <SelectValue className="text-sm" placeholder="Cualquier precio" />
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

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
              Huéspedes
            </label>
            <Select
              value={searchParams.get('huespedes') ?? ANY_VALUE}
              onValueChange={(v) => setFilter('huespedes', v)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-[#E8E4DF] bg-white text-sm hover:border-[#D0CBC4]">
                <SelectValue className="text-sm" placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Todos</SelectItem>
                {RANGOS_NUMERICOS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
              Habitaciones
            </label>
            <Select
              value={searchParams.get('habitaciones') ?? ANY_VALUE}
              onValueChange={(v) => setFilter('habitaciones', v)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-[#E8E4DF] bg-white text-sm hover:border-[#D0CBC4]">
                <SelectValue className="text-sm" placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Todos</SelectItem>
                {RANGOS_NUMERICOS.slice(0, 4).map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
              Baños
            </label>
            <Select
              value={searchParams.get('banos') ?? ANY_VALUE}
              onValueChange={(v) => setFilter('banos', v)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-[#E8E4DF] bg-white text-sm hover:border-[#D0CBC4]">
                <SelectValue className="text-sm" placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Todos</SelectItem>
                {RANGOS_NUMERICOS.slice(0, 3).map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Amenidades
          </label>
          <input
            type="text"
            placeholder="Buscar amenidad..."
            value={amenidadSearch}
            onChange={(e) => setAmenidadSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-[#E8E4DF] bg-white px-3 text-sm text-[#1A1A1A] placeholder-[#9E9892] outline-none transition-colors focus:border-[#1B4332]"
          />
          <div className="space-y-4">
            {Object.entries(filteredCategorias).map(([categoria, items]) => (
              <div key={categoria}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#9E9892]">
                  {categoria}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => {
                    const isSelected = selectedAmenidades.includes(item.nombre)
                    return (
                      <button
                        key={item.nombre}
                        onClick={() => toggleAmenidad(item.nombre)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-[#1B4332] bg-[#1B4332] text-white shadow-sm'
                            : 'border-[#E8E4DF] bg-white text-[#6B6560] hover:border-[#1B4332]/40 hover:text-[#1A1A1A]'
                        }`}
                      >
                        <span className="text-xs">{item.icono}</span>
                        <span>{item.nombre}</span>
                        {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560]">
            Ordenar por
          </label>
          <Select
            value={searchParams.get('ordenarPor') ?? 'recientes'}
            onValueChange={(v) => setFilter('ordenarPor', v)}
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-[#E8E4DF] bg-white text-sm hover:border-[#D0CBC4]">
              <SelectValue className="text-sm" placeholder="Más recientes" />
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

export function FilterPanel({ onClose, hideHeader }: { onClose?: () => void; hideHeader?: boolean }) {
  return (
    <Suspense fallback={<div className="h-full animate-pulse bg-[#F8F6F3]" />}>
      <FilterPanelInner onClose={onClose} hideHeader={hideHeader} />
    </Suspense>
  )
}