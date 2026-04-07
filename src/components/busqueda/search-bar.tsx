'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MapPin, Calendar, Users, Building2, TreePine, Navigation, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'

interface LocationResult {
  id?: string
  tipo: string
  nombre: string
  detalle: string
  lat?: number
  lng?: number
}

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

const TIPO_ICON_MAP: Record<string, typeof Building2> = {
  Estado: Navigation,
  Ciudad: Building2,
  Pueblo: Building2,
  Zona: TreePine,
  Barrio: TreePine,
  'Zona residencial': TreePine,
  Isla: TreePine,
  'Destino turístico': TreePine,
  Lugar: MapPin,
}

const MAX_GUESTS = 20
const MIN_GUESTS = 1

function getIconForTipo(tipo: string) {
  return TIPO_ICON_MAP[tipo] ?? MapPin
}

const VENEZUELA_LOCATIONS: LocationResult[] = [
  { tipo: 'Estado', nombre: 'Amazonas', detalle: '' },
  { tipo: 'Estado', nombre: 'Anzoátegui', detalle: '' },
  { tipo: 'Estado', nombre: 'Apure', detalle: '' },
  { tipo: 'Estado', nombre: 'Aragua', detalle: '' },
  { tipo: 'Estado', nombre: 'Barinas', detalle: '' },
  { tipo: 'Estado', nombre: 'Bolívar', detalle: '' },
  { tipo: 'Estado', nombre: 'Carabobo', detalle: '' },
  { tipo: 'Estado', nombre: 'Cojedes', detalle: '' },
  { tipo: 'Estado', nombre: 'Delta Amacuro', detalle: '' },
  { tipo: 'Estado', nombre: 'Distrito Capital', detalle: '' },
  { tipo: 'Estado', nombre: 'Falcón', detalle: '' },
  { tipo: 'Estado', nombre: 'Guárico', detalle: '' },
  { tipo: 'Estado', nombre: 'La Guaira', detalle: '' },
  { tipo: 'Estado', nombre: 'Lara', detalle: '' },
  { tipo: 'Estado', nombre: 'Mérida', detalle: '' },
  { tipo: 'Estado', nombre: 'Miranda', detalle: '' },
  { tipo: 'Estado', nombre: 'Monagas', detalle: '' },
  { tipo: 'Estado', nombre: 'Nueva Esparta', detalle: '' },
  { tipo: 'Estado', nombre: 'Portuguesa', detalle: '' },
  { tipo: 'Estado', nombre: 'Sucre', detalle: '' },
  { tipo: 'Estado', nombre: 'Táchira', detalle: '' },
  { tipo: 'Estado', nombre: 'Trujillo', detalle: '' },
  { tipo: 'Estado', nombre: 'Yaracuy', detalle: '' },
  { tipo: 'Estado', nombre: 'Zulia', detalle: '' },
  { tipo: 'Ciudad', nombre: 'Caracas', detalle: 'Distrito Capital' },
  { tipo: 'Ciudad', nombre: 'Valencia', detalle: 'Carabobo' },
  { tipo: 'Ciudad', nombre: 'Maracaibo', detalle: 'Zulia' },
  { tipo: 'Ciudad', nombre: 'Maracay', detalle: 'Aragua' },
  { tipo: 'Ciudad', nombre: 'Barquisimeto', detalle: 'Lara' },
  { tipo: 'Ciudad', nombre: 'Mérida', detalle: 'Mérida' },
  { tipo: 'Ciudad', nombre: 'Porlamar', detalle: 'Nueva Esparta' },
  { tipo: 'Ciudad', nombre: 'Puerto La Cruz', detalle: 'Anzoátegui' },
  { tipo: 'Ciudad', nombre: 'Cumaná', detalle: 'Sucre' },
  { tipo: 'Ciudad', nombre: 'Coro', detalle: 'Falcón' },
  { tipo: 'Ciudad', nombre: 'San Cristóbal', detalle: 'Táchira' },
  { tipo: 'Ciudad', nombre: 'Ciudad Bolívar', detalle: 'Bolívar' },
  { tipo: 'Ciudad', nombre: 'Los Teques', detalle: 'Miranda' },
  { tipo: 'Ciudad', nombre: 'Guarenas', detalle: 'Miranda' },
  { tipo: 'Ciudad', nombre: 'Guatire', detalle: 'Miranda' },
  { tipo: 'Ciudad', nombre: 'Puerto Ordaz', detalle: 'Bolívar' },
  { tipo: 'Ciudad', nombre: 'Lechería', detalle: 'Anzoátegui' },
  { tipo: 'Ciudad', nombre: 'Punto Fijo', detalle: 'Falcón' },
  { tipo: 'Ciudad', nombre: 'La Guaira', detalle: 'La Guaira' },
  { tipo: 'Ciudad', nombre: 'Maturín', detalle: 'Monagas' },
  { tipo: 'Ciudad', nombre: 'Guanare', detalle: 'Portuguesa' },
  { tipo: 'Ciudad', nombre: 'San Felipe', detalle: 'Yaracuy' },
  { tipo: 'Ciudad', nombre: 'Trujillo', detalle: 'Trujillo' },
  { tipo: 'Ciudad', nombre: 'Barinas', detalle: 'Barinas' },
  { tipo: 'Ciudad', nombre: 'Valera', detalle: 'Trujillo' },
  { tipo: 'Ciudad', nombre: 'Acarigua', detalle: 'Portuguesa' },
  { tipo: 'Ciudad', nombre: 'Tucacas', detalle: 'Falcón' },
  { tipo: 'Ciudad', nombre: 'El Vigía', detalle: 'Mérida' },
  { tipo: 'Zona', nombre: 'Isla de Margarita', detalle: 'Nueva Esparta' },
  { tipo: 'Zona', nombre: 'Los Roques', detalle: 'Distrito Capital' },
  { tipo: 'Zona', nombre: 'Morrocoy', detalle: 'Falcón' },
  { tipo: 'Zona', nombre: 'Canaima', detalle: 'Bolívar' },
  { tipo: 'Zona', nombre: 'Salto Ángel', detalle: 'Bolívar' },
  { tipo: 'Zona', nombre: 'Colonia Tovar', detalle: 'Aragua' },
  { tipo: 'Zona', nombre: 'Choroní', detalle: 'Aragua' },
  { tipo: 'Zona', nombre: 'Playa Medina', detalle: 'Sucre' },
  { tipo: 'Zona', nombre: 'Galipán', detalle: 'La Guaira' },
  { tipo: 'Zona', nombre: 'El Hatillo', detalle: 'Miranda' },
  { tipo: 'Zona', nombre: 'Altos de Pipe', detalle: 'Miranda' },
]

const VENEZUELA_LOCATIONS_INDEX = VENEZUELA_LOCATIONS.map(loc => ({
  ...loc,
  nombreLower: loc.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
}))

function searchLocal(query: string): LocationResult[] {
  const lower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return VENEZUELA_LOCATIONS_INDEX.filter((loc) => {
    return loc.nombreLower.includes(lower)
  }).slice(0, 8)
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function GuestPickerPopup({
  buttonRef,
  guests,
  onGuestsChange,
  onClose,
}: {
  buttonRef?: React.RefObject<HTMLButtonElement | null>
  guests: string
  onGuestsChange: (value: string) => void
  onClose: () => void
}) {
  const [position, setPosition] = useState({ left: 0, top: 0 })

  useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const containerRect = buttonRef.current.closest('.relative')?.getBoundingClientRect()
      if (containerRect) {
        setPosition({
          left: rect.left - containerRect.left,
          top: rect.bottom - containerRect.top + 8,
        })
      }
    }
  }, [buttonRef])

  const count = parseInt(guests) || 1

  const updateCount = (newCount: number) => {
    if (newCount < MIN_GUESTS) newCount = MIN_GUESTS
    if (newCount > MAX_GUESTS) newCount = MAX_GUESTS
    onGuestsChange(String(newCount))
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute z-[200] w-64 rounded-2xl border border-[#E8E4DF] bg-white p-4 shadow-2xl"
      style={{ left: position.left, top: position.top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#1A1A1A]">Huéspedes</p>
          <p className="text-xs text-[#6B6560]">Máximo 20</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updateCount(count - 1)}
            disabled={count <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E4DF] text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg font-medium">-</span>
          </button>
          <span className="w-8 text-center text-lg font-semibold text-[#1A1A1A]">{count}</span>
          <button
            type="button"
            onClick={() => updateCount(count + 1)}
            disabled={count >= 20}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E4DF] text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg font-medium">+</span>
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-lg bg-[#1B4332] py-2 text-sm font-medium text-white transition-colors hover:bg-[#2D6A4F]"
      >
        Listo
      </button>
    </motion.div>
  )
}

function DatePickerPopup({
  buttonRef,
  dateRange,
  onDateChange,
  onClose,
}: {
  buttonRef?: React.RefObject<HTMLButtonElement | null>
  dateRange: DateRange
  onDateChange: (range: DateRange) => void
  onClose: () => void
}) {
  const [viewMonth, setViewMonth] = useState(new Date())
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')
  const [position, setPosition] = useState({ left: 0, top: 0 })

  useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const containerRect = buttonRef.current.closest('.relative')?.getBoundingClientRect()
      if (containerRect) {
        setPosition({
          left: rect.left - containerRect.left,
          top: rect.bottom - containerRect.top + 8,
        })
      }
    }
  }, [buttonRef])

  const año = viewMonth.getFullYear()
  const mes = viewMonth.getMonth()

  const primerDia = new Date(año, mes, 1).getDay()
  const ajustePrimerDia = primerDia === 0 ? 6 : primerDia - 1
  const diasEnMes = new Date(año, mes + 1, 0).getDate()

  const diasCompletos = []
  for (let i = 0; i < ajustePrimerDia; i++) {
    diasCompletos.push(null)
  }
  for (let i = 1; i <= diasEnMes; i++) {
    diasCompletos.push(i)
  }

  const handleDayClick = (dia: number) => {
    const clickedDate = new Date(año, mes, dia)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (clickedDate < today) return

    if (selecting === 'from') {
      onDateChange({ from: clickedDate, to: undefined })
      setSelecting('to')
    } else {
      if (dateRange.from && clickedDate > dateRange.from) {
        onDateChange({ from: dateRange.from, to: clickedDate })
        setSelecting('from')
        onClose()
      } else {
        onDateChange({ from: clickedDate, to: undefined })
        setSelecting('from')
      }
    }
  }

  const isSelected = (dia: number | null) => {
    if (!dia) return false
    const date = new Date(año, mes, dia)
    if (dateRange.from && date.getTime() === dateRange.from.getTime()) return true
    if (dateRange.to && date.getTime() === dateRange.to.getTime()) return true
    return false
  }

  const isInRange = (dia: number | null) => {
    if (!dia) return false
    const date = new Date(año, mes, dia)
    if (!dateRange.from || !dateRange.to) return false
    return date > dateRange.from && date < dateRange.to
  }

  const isDisabled = (dia: number | null) => {
    if (!dia) return true
    const date = new Date(año, mes, dia)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isToday = (dia: number | null) => {
    if (!dia) return false
    const date = new Date(año, mes, dia)
    const today = new Date()
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear()
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute z-[200] w-auto rounded-2xl border border-[#E8E4DF] bg-white p-4 shadow-2xl" 
      style={{ left: position.left, top: position.top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setViewMonth(new Date(año, mes - 1, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#F8F6F3]"
        >
          <ChevronLeft className="h-4 w-4 text-[#6B6560]" />
        </button>
        <span className="text-sm font-semibold text-[#1A1A1A]">
          {MESES[mes]} {año}
        </span>
        <button
          onClick={() => setViewMonth(new Date(año, mes + 1, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#F8F6F3]"
        >
          <ChevronRight className="h-4 w-4 text-[#6B6560]" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((dia) => (
          <span key={dia} className="text-[10px] font-medium text-[#6B6560]">
            {dia}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {diasCompletos.map((dia, idx) => (
          <button
            key={idx}
            disabled={dia === null || isDisabled(dia)}
            onClick={() => dia && handleDayClick(dia)}
            className={`
              flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors
              ${dia === null ? 'invisible' : ''}
              ${isDisabled(dia) ? 'text-[#D0CBC4] cursor-not-allowed' : 'hover:bg-[#F8F6F3] cursor-pointer'}
              ${isToday(dia) ? 'border border-[#1B4332]' : ''}
              ${isSelected(dia) ? 'bg-[#1B4332] text-white hover:bg-[#1B4332]' : ''}
              ${isInRange(dia) ? 'bg-[#1B4332]/10 text-[#1B4332]' : ''}
            `}
          >
            {dia}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#E8E4DF] pt-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-[#6B6560]">Entrada</span>
          <span className="text-xs text-[#1A1A1A]">
            {dateRange.from ? `${dateRange.from.getDate()} ${MESES[dateRange.from.getMonth()]}` : 'Selecciona'}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-medium text-[#6B6560]">Salida</span>
          <span className="text-xs text-[#1A1A1A]">
            {dateRange.to ? `${dateRange.to.getDate()} ${MESES[dateRange.to.getMonth()]}` : 'Selecciona'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ubicacion, setUbicacion] = useState(searchParams.get('ubicacion') || '')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: searchParams.get('entrada') ? new Date(searchParams.get('entrada')!) : undefined,
    to: searchParams.get('salida') ? new Date(searchParams.get('salida')!) : undefined,
  })
  const [huespedes, setHuespedes] = useState(searchParams.get('huespedes') || '1')
  const [guestPickerOpen, setGuestPickerOpen] = useState(false)
  const [resultados, setResultados] = useState<LocationResult[]>([])
  const [open, setOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selected, setSelected] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const datesButtonRef = useRef<HTMLButtonElement>(null)
  const guestsButtonRef = useRef<HTMLButtonElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setDatePickerOpen(false)
        setGuestPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [])

  const fetchResults = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResultados([])
      setOpen(false)
      return
    }
    const localResults = searchLocal(query)
    if (localResults.length > 0) {
      setResultados(localResults)
      setSelected(-1)
      setOpen(true)
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/ubicaciones?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const apiResults: LocationResult[] = (data.resultados ?? []).map(
        (r: { id?: string; nombre: string; detalle: string; tipo: string; lat: number; lng: number }) => ({
          id: r.id,
          tipo: r.tipo,
          nombre: r.nombre,
          detalle: r.detalle,
          lat: r.lat,
          lng: r.lng,
        })
      )
      if (apiResults.length > 0) {
        setResultados(apiResults)
      } else if (localResults.length === 0) {
        setResultados([])
      }
      setSelected(-1)
      setOpen(true)
    } catch {
      if (localResults.length === 0) {
        setResultados([])
      }
      setSelected(-1)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setUbicacion(value)
    setSelectedLocation(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchResults(value), 250)
  }

  const handleSelect = (item: LocationResult) => {
    setUbicacion(item.nombre)
    setSelectedLocation(item)
    setOpen(false)
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const doSearch = () => {
    const params = new URLSearchParams()
    const loc = ubicacion
    const lat = selectedLocation?.lat
    const lng = selectedLocation?.lng

    if (loc) params.set('ubicacion', loc)
    if (lat != null) params.set('lat', String(lat))
    if (lng != null) params.set('lng', String(lng))
    if (lat != null && lng != null) params.set('radio', '25')
    if (dateRange.from) params.set('entrada', formatDate(dateRange.from))
    if (dateRange.to) params.set('salida', formatDate(dateRange.to))
    if (huespedes && huespedes !== '1') params.set('huespedes', huespedes)
    router.push(`/propiedades?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((prev) => Math.min(prev + 1, resultados.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selected >= 0 && resultados[selected]) {
        handleSelect(resultados[selected])
      } else {
        setOpen(false)
        doSearch()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showDropdown = open && (resultados.length > 0 || (loading && ubicacion.length >= 2) || (!loading && resultados.length === 0 && ubicacion.length >= 2))

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-3xl">
      <div className="flex items-center gap-1 rounded-full border border-[#E8E4DF] bg-white px-2 py-1.5 shadow-md transition-shadow focus-within:shadow-lg sm:gap-2 sm:px-3 sm:py-2">
        <div className="flex flex-1 items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-[#F8F6F3] focus-within:bg-[#F8F6F3]">
          <MapPin className="h-4 w-4 shrink-0 text-[#E76F51]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">
              ¿A dónde vas?
            </span>
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (ubicacion.length >= 2) {
                  if (resultados.length > 0) {
                    setOpen(true)
                  } else {
                    fetchResults(ubicacion)
                  }
                }
              }}
              placeholder="Busca un destino en Venezuela"
              className="w-full border-none bg-transparent text-sm text-[#1A1A1A] outline-none placeholder:text-[#6B6560]"
              autoComplete="off"
              role="combobox"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
            />
          </div>
        </div>

        <div className="hidden h-8 w-px bg-[#E8E4DF] sm:block" />

        <button
          ref={datesButtonRef}
          type="button"
          onClick={() => {
            setDatePickerOpen(!datePickerOpen)
            setOpen(false)
            setGuestPickerOpen(false)
          }}
          className="hidden flex-1 cursor-pointer items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-[#F8F6F3] sm:flex"
        >
          <Calendar className="h-4 w-4 shrink-0 text-[#E76F51]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">
              Fechas
            </span>
            <span className="text-sm text-[#1A1A1A]">
              {dateRange.from && dateRange.to
                ? `${dateRange.from.getDate()}/${dateRange.from.getMonth() + 1} - ${dateRange.to.getDate()}/${dateRange.to.getMonth() + 1}`
                : dateRange.from
                  ? `${dateRange.from.getDate()}/${dateRange.from.getMonth() + 1} - ...`
                  : '¿Cuándo viajas?'}
            </span>
          </div>
        </button>

        <div className="hidden h-8 w-px bg-[#E8E4DF] sm:block" />

        <button
          ref={guestsButtonRef}
          type="button"
          onClick={() => {
            setGuestPickerOpen(!guestPickerOpen)
            setOpen(false)
            setDatePickerOpen(false)
          }}
          className="hidden flex-1 items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-[#F8F6F3] sm:flex"
        >
          <Users className="h-4 w-4 shrink-0 text-[#E76F51]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">
              Huéspedes
            </span>
            <span className="text-sm text-[#1A1A1A]">
              {huespedes === '1' ? '1 huésped' : `${huespedes} huéspedes`}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setUbicacion('')
            setSelectedLocation(null)
            setDateRange({ from: undefined, to: undefined })
            setHuespedes('1')
            router.push('/propiedades')
          }}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
            ubicacion || dateRange.from || dateRange.to || huespedes !== '1'
              ? 'border-[#E76F51] text-[#E76F51] hover:bg-[#E76F51]/10'
              : 'border-[#E8E4DF] text-[#D0CBC4]'
          }`}
          aria-label="Limpiar filtros"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M5 6l1 14h12l1-14" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
          </svg>
        </button>

        <Button
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-[#E76F51] hover:bg-[#D45D3E]"
          aria-label="Buscar Boogies"
          onClick={() => {
            setOpen(false)
            setDatePickerOpen(false)
            setGuestPickerOpen(false)
            doSearch()
          }}
        >
          <Search className="h-4 w-4 text-white" />
        </Button>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-3 overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white shadow-2xl">
          <div className="border-b border-[#E8E4DF] px-4 py-2.5">
            <span className="text-xs font-semibold text-[#1A1A1A]">Destinos en Venezuela</span>
          </div>
          <ul role="listbox" className="max-h-80 overflow-y-auto py-1">
            {loading && resultados.length === 0 && (
              <li className="flex items-center gap-2 px-4 py-3 text-sm text-[#6B6560]">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Buscando destinos...
              </li>
            )}
            {resultados.map((item, idx) => {
              const Icon = getIconForTipo(item.tipo)
              const isHighlighted = idx === selected
              return (
                <li key={item.id ?? `${item.tipo}-${item.nombre}-${idx}`} role="option" aria-selected={isHighlighted}>
                  <button
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelected(idx)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isHighlighted ? 'bg-[#F8F6F3]' : 'hover:bg-[#F8F6F3]'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isHighlighted ? 'bg-[#1B4332]/10' : 'bg-[#F0EDE8]'
                    }`}>
                      <Icon className={`h-4 w-4 ${isHighlighted ? 'text-[#1B4332]' : 'text-[#6B6560]'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#1A1A1A]">
                        {item.nombre}
                      </p>
                      <p className="truncate text-[11px] text-[#6B6560]">
                        {item.tipo}{item.detalle ? ` · ${item.detalle}` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
            {!loading && resultados.length === 0 && ubicacion.length >= 2 && (
              <li className="px-4 py-3 text-sm text-[#6B6560]">
                No encontramos destinos para &quot;{ubicacion}&quot;
              </li>
            )}
          </ul>
        </div>
      )}

      <AnimatePresence>
        {datePickerOpen && (
          <DatePickerPopup
            buttonRef={datesButtonRef}
            dateRange={dateRange}
            onDateChange={setDateRange}
            onClose={() => setDatePickerOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {guestPickerOpen && (
          <GuestPickerPopup
            buttonRef={guestsButtonRef}
            guests={huespedes}
            onGuestsChange={setHuespedes}
            onClose={() => setGuestPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
