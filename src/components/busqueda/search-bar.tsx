'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MapPin, Calendar, Users, Building2, TreePine, Navigation, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Trophy, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchMode, TIPOS_CANCHA } from '@/lib/constants'
import { SearchModeToggle } from './search-mode-toggle'

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

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
const ANY_HOUR = '__any__'

function usePopupPosition(buttonRef: React.RefObject<HTMLButtonElement | null> | undefined) {
  const [pos, setPos] = useState({ left: 0, top: 0 })
  useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const containerRect = buttonRef.current.closest('.search-bar-container')?.getBoundingClientRect()
      if (containerRect) {
        setPos({
          left: rect.left - containerRect.left,
          top: rect.bottom - containerRect.top + 8,
        })
      }
    }
  }, [buttonRef])
  return pos
}

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
  const pos = usePopupPosition(buttonRef)
  const count = parseInt(guests) || 1

  const updateCount = (newCount: number) => {
    if (newCount < MIN_GUESTS) newCount = MIN_GUESTS
    if (newCount > MAX_GUESTS) newCount = MAX_GUESTS
    onGuestsChange(String(newCount))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-[200] w-64 rounded-2xl border border-[#E8E4DF] bg-white p-4 shadow-2xl"
      style={{ left: pos.left, top: pos.top }}
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
  const pos = usePopupPosition(buttonRef)
  const [viewMonth, setViewMonth] = useState(new Date())
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')

  const año = viewMonth.getFullYear()
  const mes = viewMonth.getMonth()

  const primerDia = new Date(año, mes, 1).getDay()
  const ajustePrimerDia = primerDia === 0 ? 6 : primerDia - 1
  const diasEnMes = new Date(año, mes + 1, 0).getDate()

  const diasCompletos = []
  for (let i = 0; i < ajustePrimerDia; i++) diasCompletos.push(null)
  for (let i = 1; i <= diasEnMes; i++) diasCompletos.push(i)

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
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-[200] w-auto rounded-2xl border border-[#E8E4DF] bg-white p-4 shadow-2xl"
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setViewMonth(new Date(año, mes - 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#F8F6F3]"><ChevronLeft className="h-4 w-4 text-[#6B6560]" /></button>
        <span className="text-sm font-semibold text-[#1A1A1A]">{MESES[mes]} {año}</span>
        <button onClick={() => setViewMonth(new Date(año, mes + 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#F8F6F3]"><ChevronRight className="h-4 w-4 text-[#6B6560]" /></button>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((dia) => (<span key={dia} className="text-[10px] font-medium text-[#6B6560]">{dia}</span>))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {diasCompletos.map((dia, idx) => (
          <button
            key={idx}
            disabled={dia === null || isDisabled(dia)}
            onClick={() => dia && handleDayClick(dia)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${dia === null ? 'invisible' : ''} ${isDisabled(dia) ? 'text-[#D0CBC4] cursor-not-allowed' : 'hover:bg-[#F8F6F3] cursor-pointer'} ${isToday(dia) ? 'border border-[#1B4332]' : ''} ${isSelected(dia) ? 'bg-[#1B4332] text-white hover:bg-[#1B4332]' : ''} ${isInRange(dia) ? 'bg-[#1B4332]/10 text-[#1B4332]' : ''}`}
          >
            {dia}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#E8E4DF] pt-3">
        <div className="flex flex-col"><span className="text-[10px] font-medium text-[#6B6560]">Entrada</span><span className="text-xs text-[#1A1A1A]">{dateRange.from ? `${dateRange.from.getDate()} ${MESES[dateRange.from.getMonth()]}` : 'Selecciona'}</span></div>
        <div className="flex flex-col text-right"><span className="text-[10px] font-medium text-[#6B6560]">Salida</span><span className="text-xs text-[#1A1A1A]">{dateRange.to ? `${dateRange.to.getDate()} ${MESES[dateRange.to.getMonth()]}` : 'Selecciona'}</span></div>
      </div>
    </motion.div>
  )
}

function MobileGuestPicker({ guests, onGuestsChange, onClose }: { guests: string; onGuestsChange: (value: string) => void; onClose: () => void }) {
  const count = parseInt(guests) || 1
  const updateCount = (newCount: number) => {
    if (newCount < MIN_GUESTS) newCount = MIN_GUESTS
    if (newCount > MAX_GUESTS) newCount = MAX_GUESTS
    onGuestsChange(String(newCount))
  }
  return (
    <div>
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-medium text-[#1A1A1A]">Huéspedes</p><p className="text-xs text-[#6B6560]">Máximo 20</p></div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => updateCount(count - 1)} disabled={count <= 1} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E4DF] text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3] disabled:opacity-50 disabled:cursor-not-allowed"><span className="text-lg font-medium">-</span></button>
          <span className="w-8 text-center text-lg font-semibold text-[#1A1A1A]">{count}</span>
          <button type="button" onClick={() => updateCount(count + 1)} disabled={count >= 20} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E4DF] text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3] disabled:opacity-50 disabled:cursor-not-allowed"><span className="text-lg font-medium">+</span></button>
        </div>
      </div>
      <button type="button" onClick={onClose} className="mt-4 w-full rounded-lg bg-[#1B4332] py-2 text-sm font-medium text-white transition-colors hover:bg-[#2D6A4F]">Listo</button>
    </div>
  )
}

function MobileDatePicker({ dateRange, onDateChange, onClose }: { dateRange: DateRange; onDateChange: (range: DateRange) => void; onClose: () => void }) {
  const [viewMonth, setViewMonth] = useState(new Date())
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')

  const año = viewMonth.getFullYear()
  const mes = viewMonth.getMonth()
  const primerDia = new Date(año, mes, 1).getDay()
  const ajustePrimerDia = primerDia === 0 ? 6 : primerDia - 1
  const diasEnMes = new Date(año, mes + 1, 0).getDate()
  const diasCompletos: (number | null)[] = []
  for (let i = 0; i < ajustePrimerDia; i++) diasCompletos.push(null)
  for (let i = 1; i <= diasEnMes; i++) diasCompletos.push(i)

  const handleDayClick = (dia: number) => {
    const clickedDate = new Date(año, mes, dia)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (clickedDate < today) return
    if (selecting === 'from') { onDateChange({ from: clickedDate, to: undefined }); setSelecting('to') }
    else { if (dateRange.from && clickedDate > dateRange.from) { onDateChange({ from: dateRange.from, to: clickedDate }); setSelecting('from'); onClose() } else { onDateChange({ from: clickedDate, to: undefined }); setSelecting('from') } }
  }

  const isSelected = (dia: number | null) => { if (!dia) return false; const d = new Date(año, mes, dia); return (dateRange.from && d.getTime() === dateRange.from.getTime()) || (dateRange.to && d.getTime() === dateRange.to.getTime()) }
  const isInRange = (dia: number | null) => { if (!dia || !dateRange.from || !dateRange.to) return false; const d = new Date(año, mes, dia); return d > dateRange.from && d < dateRange.to }
  const isDisabled = (dia: number | null) => { if (!dia) return true; const d = new Date(año, mes, dia); const t = new Date(); t.setHours(0, 0, 0, 0); return d < t }
  const isToday = (dia: number | null) => { if (!dia) return false; const d = new Date(año, mes, dia); const t = new Date(); return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear() }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setViewMonth(new Date(año, mes - 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#F8F6F3]"><ChevronLeft className="h-4 w-4 text-[#6B6560]" /></button>
        <span className="text-sm font-semibold text-[#1A1A1A]">{MESES[mes]} {año}</span>
        <button onClick={() => setViewMonth(new Date(año, mes + 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#F8F6F3]"><ChevronRight className="h-4 w-4 text-[#6B6560]" /></button>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">{DIAS_SEMANA.map((d) => <span key={d} className="text-[10px] font-medium text-[#6B6560]">{d}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {diasCompletos.map((dia, idx) => (
          <button key={idx} disabled={dia === null || isDisabled(dia)} onClick={() => dia && handleDayClick(dia)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${dia === null ? 'invisible' : ''} ${isDisabled(dia) ? 'text-[#D0CBC4] cursor-not-allowed' : 'hover:bg-[#F8F6F3] cursor-pointer'} ${isToday(dia) ? 'border border-[#1B4332]' : ''} ${isSelected(dia) ? 'bg-[#1B4332] text-white hover:bg-[#1B4332]' : ''} ${isInRange(dia) ? 'bg-[#1B4332]/10 text-[#1B4332]' : ''}`}
          >{dia}</button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#E8E4DF] pt-3">
        <div className="flex flex-col"><span className="text-[10px] font-medium text-[#6B6560]">Entrada</span><span className="text-xs text-[#1A1A1A]">{dateRange.from ? `${dateRange.from.getDate()} ${MESES[dateRange.from.getMonth()]}` : 'Selecciona'}</span></div>
        <div className="flex flex-col text-right"><span className="text-[10px] font-medium text-[#6B6560]">Salida</span><span className="text-xs text-[#1A1A1A]">{dateRange.to ? `${dateRange.to.getDate()} ${MESES[dateRange.to.getMonth()]}` : 'Selecciona'}</span></div>
      </div>
    </div>
  )
}

function SportsCalendarPopup({ buttonRef, selectedDate, onDateSelect }: { buttonRef: React.RefObject<HTMLButtonElement | null>; selectedDate: string; onDateSelect: (date: string) => void }) {
  const pos = usePopupPosition(buttonRef)
  const [viewMonth, setViewMonth] = useState(new Date())
  const año = viewMonth.getFullYear()
  const mes = viewMonth.getMonth()
  const primerDia = new Date(año, mes, 1).getDay()
  const ajustePrimerDia = primerDia === 0 ? 6 : primerDia - 1
  const diasEnMes = new Date(año, mes + 1, 0).getDate()
  const diasCompletos: (number | null)[] = []
  for (let i = 0; i < ajustePrimerDia; i++) diasCompletos.push(null)
  for (let i = 1; i <= diasEnMes; i++) diasCompletos.push(i)
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const handleDayClick = (dia: number) => { const c = new Date(año, mes, dia); if (c < today) return; onDateSelect(c.toISOString().split('T')[0]) }
  const isSelected = (dia: number | null) => { if (!dia || !selectedDate) return false; return `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}` === selectedDate }
  const isDisabled = (dia: number | null) => { if (!dia) return true; return new Date(año, mes, dia) < today }
  const isToday = (dia: number | null) => { if (!dia) return false; const d = new Date(año, mes, dia); return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-[200] w-auto rounded-2xl border border-[#E8E4DF] bg-white p-4 shadow-2xl"
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setViewMonth(new Date(año, mes - 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#F8F6F3]"><ChevronLeft className="h-4 w-4 text-[#6B6560]" /></button>
        <span className="text-sm font-semibold text-[#1A1A1A]">{MESES[mes]} {año}</span>
        <button onClick={() => setViewMonth(new Date(año, mes + 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#F8F6F3]"><ChevronRight className="h-4 w-4 text-[#6B6560]" /></button>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">{DIAS_SEMANA.map((d) => <span key={d} className="text-[10px] font-medium text-[#6B6560]">{d}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {diasCompletos.map((dia, idx) => (
          <button key={idx} disabled={dia === null || isDisabled(dia)} onClick={() => dia && handleDayClick(dia)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${dia === null ? 'invisible' : ''} ${isDisabled(dia) ? 'text-[#D0CBC4] cursor-not-allowed' : 'hover:bg-[#F8F6F3] cursor-pointer'} ${isToday(dia) ? 'border border-[#1B4332]' : ''} ${isSelected(dia) ? 'bg-[#1B4332] text-white hover:bg-[#1B4332]' : ''}`}
          >{dia}</button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#E8E4DF] pt-3">
        <span className="text-xs text-[#6B6560]">{selectedDate || 'Sin fecha'}</span>
        <button onClick={() => onDateSelect('')} className="text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F]">Limpiar</button>
      </div>
    </motion.div>
  )
}

function TimePickerPopup({ buttonRef, horaInicio, horaFin, onHoraInicioChange, onHoraFinChange, onClose }: {
  buttonRef: React.RefObject<HTMLButtonElement | null>
  horaInicio: string
  horaFin: string
  onHoraInicioChange: (h: string) => void
  onHoraFinChange: (h: string) => void
  onClose: () => void
}) {
  const pos = usePopupPosition(buttonRef)
  const inicioIdx = HOURS.findIndex(h => h === horaInicio) ?? 8
  const finIdx = HOURS.findIndex(h => h === horaFin) ?? 9
  const scrollRefInicio = useRef<HTMLDivElement>(null)
  const scrollRefFin = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRefInicio.current) {
      const target = scrollRefInicio.current.querySelector(`[data-hour="${horaInicio}"]`)
      if (target) target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
    }
    if (scrollRefFin.current) {
      const target = scrollRefFin.current.querySelector(`[data-hour="${horaFin}"]`)
      if (target) target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-[200] w-72 rounded-2xl border border-[#E8E4DF] bg-white shadow-2xl"
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-[#E8E4DF] px-4 py-2.5">
        <span className="text-xs font-semibold text-[#1A1A1A]">Seleccionar horario</span>
      </div>
      <div className="flex">
        <div className="flex-1 border-r border-[#E8E4DF]">
          <div className="px-3 pt-2 pb-1"><span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">Entrada</span></div>
          <div ref={scrollRefInicio} className="max-h-48 overflow-y-auto px-1 pb-2 scrollbar-thin">
            <button
              onClick={() => { onHoraInicioChange(ANY_HOUR); onHoraFinChange(ANY_HOUR) }}
              className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-all ${
                horaInicio === ANY_HOUR
                  ? 'bg-[#1B4332] text-white font-semibold'
                  : 'text-[#1B4332] hover:bg-[#D8F3DC] font-medium'
              }`}
            >
              Cualquier hora
            </button>
            {HOURS.map((h) => (
              <button
                key={h}
                data-hour={h}
                onClick={() => onHoraInicioChange(h)}
                className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-all ${
                  h === horaInicio
                    ? 'bg-[#1B4332] text-white font-semibold'
                    : 'text-[#1A1A1A] hover:bg-[#F8F6F3]'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="px-3 pt-2 pb-1"><span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">Salida</span></div>
          <div ref={scrollRefFin} className="max-h-48 overflow-y-auto px-1 pb-2 scrollbar-thin">
            <button
              onClick={() => { onHoraFinChange(ANY_HOUR) }}
              className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-all ${
                horaFin === ANY_HOUR
                  ? 'bg-[#1B4332] text-white font-semibold'
                  : 'text-[#1B4332] hover:bg-[#D8F3DC] font-medium'
              }`}
            >
              Cualquier hora
            </button>
            {HOURS.map((h) => {
              const hNum = parseInt(h)
              const inicioNum = parseInt(horaInicio)
              const disabled = hNum <= inicioNum
              return (
                <button
                  key={h}
                  data-hour={h}
                  onClick={() => !disabled && onHoraFinChange(h)}
                  className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-all ${
                    h === horaFin
                      ? 'bg-[#1B4332] text-white font-semibold'
                      : disabled
                        ? 'text-[#D0CBC4] cursor-not-allowed'
                        : 'text-[#1A1A1A] hover:bg-[#F8F6F3]'
                  }`}
                >
                  {h}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="border-t border-[#E8E4DF] px-4 py-2.5">
        <button onClick={onClose} className="w-full rounded-lg bg-[#1B4332] py-2 text-sm font-medium text-white transition-colors hover:bg-[#2D6A4F]">Listo</button>
      </div>
    </motion.div>
  )
}

function DeporteDropdown({ buttonRef, deporte, onSelect }: { buttonRef: React.RefObject<HTMLButtonElement | null>; deporte: string; onSelect: (v: string) => void }) {
  const pos = usePopupPosition(buttonRef)
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-[200] w-56 rounded-2xl border border-[#E8E4DF] bg-white py-1 shadow-2xl"
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-[#E8E4DF] px-4 py-2"><span className="text-xs font-semibold text-[#1A1A1A]">Tipo de cancha</span></div>
      <button onClick={() => onSelect('')} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#F8F6F3] ${!deporte ? 'text-[#1B4332] font-medium' : 'text-[#1A1A1A]'}`}>Todos los deportes</button>
      {Object.entries(TIPOS_CANCHA).map(([key, label]) => (
        <button key={key} onClick={() => onSelect(key)} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#F8F6F3] ${deporte === key ? 'text-[#1B4332] font-medium bg-[#D8F3DC]/30' : 'text-[#1A1A1A]'}`}>{label}</button>
      ))}
    </motion.div>
  )
}

const barVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}
const barTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }

export function SearchBar({ mode = 'estandar', inlineModeToggle, onModeChange }: { mode?: SearchMode; inlineModeToggle?: boolean; onModeChange?: (mode: SearchMode) => void }) {
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
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const datesButtonRef = useRef<HTMLButtonElement>(null)
  const guestsButtonRef = useRef<HTMLButtonElement>(null)
  const deporteButtonRef = useRef<HTMLButtonElement>(null)
  const fechaButtonRef = useRef<HTMLButtonElement>(null)
  const horaButtonRef = useRef<HTMLButtonElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [deporte, setDeporte] = useState(searchParams.get('tipoCancha') || '')
  const [fecha, setFecha] = useState(searchParams.get('fecha') || '')
  const [horaInicio, setHoraInicio] = useState(searchParams.get('horaInicio') || '08:00')
  const [horaFin, setHoraFin] = useState(searchParams.get('horaFin') || '09:00')
  const [deporteDropdownOpen, setDeporteDropdownOpen] = useState(false)
  const [sportsDateOpen, setSportsDateOpen] = useState(false)
  const [timePickerOpen, setTimePickerOpen] = useState(false)

  const closeAll = useCallback(() => {
    setOpen(false)
    setDatePickerOpen(false)
    setGuestPickerOpen(false)
    setDeporteDropdownOpen(false)
    setSportsDateOpen(false)
    setTimePickerOpen(false)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAll()
        setMobileExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null }
    }
  }, [closeAll])

  const fetchResults = useCallback(async (query: string) => {
    if (query.length < 2) { setResultados([]); setOpen(false); return }
    const localResults = searchLocal(query)
    if (localResults.length > 0) { setResultados(localResults); setSelected(-1); setOpen(true) }
    setLoading(true)
    try {
      const res = await fetch(`/api/ubicaciones?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const apiResults: LocationResult[] = (data.resultados ?? []).map((r: { id?: string; nombre: string; detalle: string; tipo: string; lat: number; lng: number }) => ({ id: r.id, tipo: r.tipo, nombre: r.nombre, detalle: r.detalle, lat: r.lat, lng: r.lng }))
      if (apiResults.length > 0) setResultados(apiResults)
      else if (localResults.length === 0) setResultados([])
      setSelected(-1); setOpen(true)
    } catch {
      if (localResults.length === 0) setResultados([])
      setSelected(-1); setOpen(true)
    } finally { setLoading(false) }
  }, [])

  const handleChange = (value: string) => {
    setUbicacion(value); setSelectedLocation(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchResults(value), 250)
  }

  const handleSelect = (item: LocationResult) => { setUbicacion(item.nombre); setSelectedLocation(item); setOpen(false) }
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  const doSearch = () => {
    const params = new URLSearchParams()
    if (ubicacion) params.set('ubicacion', ubicacion)
    if (selectedLocation?.lat != null) params.set('lat', String(selectedLocation.lat))
    if (selectedLocation?.lng != null) params.set('lng', String(selectedLocation.lng))
    if (selectedLocation?.lat != null && selectedLocation?.lng != null) params.set('radio', '25')

    if (mode === 'sports') {
      if (deporte) params.set('tipoCancha', deporte)
      if (fecha) params.set('fecha', fecha)
      if (horaInicio && horaInicio !== ANY_HOUR) params.set('horaInicio', horaInicio)
      if (horaFin && horaFin !== ANY_HOUR) params.set('horaFin', horaFin)
      params.set('categoria', 'DEPORTE')
      router.push(`/canchas?${params.toString()}`)
      return
    }

    if (mode === 'express') {
      params.set('esExpress', 'true')
      const today = new Date().toISOString().split('T')[0]
      params.set('entrada', today)
      if (dateRange.from) params.set('entrada', formatDate(dateRange.from))
      if (huespedes && huespedes !== '1') params.set('huespedes', huespedes)
      router.push(`/propiedades?${params.toString()}`)
      return
    }

    if (dateRange.from) params.set('entrada', formatDate(dateRange.from))
    if (dateRange.to) params.set('salida', formatDate(dateRange.to))
    if (huespedes && huespedes !== '1') params.set('huespedes', huespedes)
    router.push(`/propiedades?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((prev) => Math.min(prev + 1, resultados.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((prev) => Math.max(prev - 1, -1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (selected >= 0 && resultados[selected]) handleSelect(resultados[selected]); else { setOpen(false); doSearch() } }
    else if (e.key === 'Escape') setOpen(false)
  }

  const showDropdown = open && (resultados.length > 0 || (loading && ubicacion.length >= 2) || (!loading && resultados.length === 0 && ubicacion.length >= 2))

  return (
    <div ref={containerRef} className="search-bar-container relative mx-auto w-full max-w-6xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          variants={barVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={barTransition}
          className="hidden items-center gap-0.5 rounded-full border border-[#E8E4DF] bg-white px-2 py-1 shadow-md transition-shadow focus-within:shadow-lg sm:flex sm:gap-1 sm:px-2 sm:py-1.5"
        >
          {inlineModeToggle && onModeChange && (
            <>
              <SearchModeToggle mode={mode} onChange={onModeChange} inline />
              <div className="h-6 w-px bg-[#E8E4DF]" />
            </>
          )}
          <div className="flex flex-1 items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-[#F8F6F3] focus-within:bg-[#F8F6F3]">
            <MapPin className="h-4 w-4 shrink-0 text-[#1B4332]" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">¿A dónde vas?</span>
              <input type="text" value={ubicacion} onChange={(e) => handleChange(e.target.value)} onKeyDown={handleKeyDown}
                onFocus={() => { if (ubicacion.length >= 2) { if (resultados.length > 0) setOpen(true); else fetchResults(ubicacion) } }}
                placeholder="Busca un destino en Venezuela" className="w-full min-w-0 border-none bg-transparent text-sm text-[#1A1A1A] outline-none placeholder:text-[#6B6560]"
                autoComplete="off" role="combobox" aria-expanded={showDropdown} aria-haspopup="listbox"
              />
            </div>
          </div>

          <div className="h-6 w-px bg-[#E8E4DF]" />

          {mode === 'sports' ? (
            <>
              <button ref={deporteButtonRef} type="button" onClick={() => { setDeporteDropdownOpen(!deporteDropdownOpen); setSportsDateOpen(false); setTimePickerOpen(false); setOpen(false); setDatePickerOpen(false); setGuestPickerOpen(false) }}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-[#F8F6F3]">
                <Trophy className="h-3.5 w-3.5 shrink-0 text-[#1B4332]" />
                <div className="flex flex-col"><span className="text-[9px] font-semibold uppercase tracking-wide text-[#6B6560]">Deporte</span><span className="text-xs text-[#1A1A1A] leading-tight">{deporte ? TIPOS_CANCHA[deporte as keyof typeof TIPOS_CANCHA] : 'Todos'}</span></div>
              </button>
              <div className="h-6 w-px bg-[#E8E4DF]" />
              <button ref={fechaButtonRef} type="button" onClick={() => { setSportsDateOpen(!sportsDateOpen); setDeporteDropdownOpen(false); setTimePickerOpen(false); setOpen(false); setDatePickerOpen(false); setGuestPickerOpen(false) }}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-[#F8F6F3]">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#1B4332]" />
                <div className="flex flex-col"><span className="text-[9px] font-semibold uppercase tracking-wide text-[#6B6560]">Fecha</span><span className="text-xs text-[#1A1A1A] leading-tight">{fecha || 'Selecciona'}</span></div>
              </button>
              <div className="h-6 w-px bg-[#E8E4DF]" />
              <button ref={horaButtonRef} type="button" onClick={() => { setTimePickerOpen(!timePickerOpen); setDeporteDropdownOpen(false); setSportsDateOpen(false); setOpen(false); setDatePickerOpen(false); setGuestPickerOpen(false) }}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-[#F8F6F3]">
                <Clock className="h-3.5 w-3.5 shrink-0 text-[#1B4332]" />
                <div className="flex flex-col"><span className="text-[9px] font-semibold uppercase tracking-wide text-[#6B6560]">Hora</span><span className="text-xs text-[#1A1A1A] leading-tight">{horaInicio === ANY_HOUR && horaFin === ANY_HOUR ? 'Cualquier hora' : `${horaInicio} → ${horaFin}`}</span></div>
              </button>
            </>
          ) : mode === 'express' ? (
            <>
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5">
                <Zap className="h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />
                <span className="text-xs font-medium text-[#F59E0B]">Disponible hoy</span>
              </div>
              <div className="h-6 w-px bg-[#E8E4DF]" />
              <button ref={guestsButtonRef} type="button" onClick={() => { setGuestPickerOpen(!guestPickerOpen); setOpen(false) }}
                className="flex flex-1 items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-[#F8F6F3]">
                <Users className="h-3.5 w-3.5 shrink-0 text-[#1B4332]" />
                <div className="flex flex-col"><span className="text-[9px] font-semibold uppercase tracking-wide text-[#6B6560]">Huéspedes</span><span className="text-xs text-[#1A1A1A] leading-tight">{huespedes === '1' ? '1 huésped' : `${huespedes} huéspedes`}</span></div>
              </button>
            </>
          ) : (
            <>
              <button ref={datesButtonRef} type="button" onClick={() => { setDatePickerOpen(!datePickerOpen); setOpen(false); setGuestPickerOpen(false) }}
                className="flex-1 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-[#F8F6F3] flex">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#1B4332]" />
                <div className="flex flex-col"><span className="text-[9px] font-semibold uppercase tracking-wide text-[#6B6560]">Fechas</span><span className="text-xs text-[#1A1A1A] leading-tight">{dateRange.from && dateRange.to ? `${dateRange.from.getDate()}/${dateRange.from.getMonth() + 1} - ${dateRange.to.getDate()}/${dateRange.to.getMonth() + 1}` : dateRange.from ? `${dateRange.from.getDate()}/${dateRange.from.getMonth() + 1} - ...` : '¿Cuándo viajas?'}</span></div>
              </button>
              <div className="h-6 w-px bg-[#E8E4DF]" />
              <button ref={guestsButtonRef} type="button" onClick={() => { setGuestPickerOpen(!guestPickerOpen); setOpen(false); setDatePickerOpen(false) }}
                className="flex flex-1 items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-[#F8F6F3]">
                <Users className="h-3.5 w-3.5 shrink-0 text-[#1B4332]" />
                <div className="flex flex-col"><span className="text-[9px] font-semibold uppercase tracking-wide text-[#6B6560]">Huéspedes</span><span className="text-xs text-[#1A1A1A] leading-tight">{huespedes === '1' ? '1 huésped' : `${huespedes} huéspedes`}</span></div>
              </button>
            </>
          )}

          <button type="button" onClick={() => { setUbicacion(''); setSelectedLocation(null); setDateRange({ from: undefined, to: undefined }); setHuespedes('1'); router.push('/propiedades') }}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${ubicacion || dateRange.from || dateRange.to || huespedes !== '1' ? 'border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332]/10' : 'border-[#E8E4DF] text-[#D0CBC4]'}`}
            aria-label="Limpiar filtros"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M5 6l1 14h12l1-14" /><path d="M10 11v5" /><path d="M14 11v5" /></svg>
          </button>

          <Button size="icon" className="h-9 w-9 shrink-0 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]" aria-label="Buscar Boogies"
            onClick={() => { closeAll(); doSearch() }}
          >
            <Search className="h-4 w-4 text-white" />
          </Button>
        </motion.div>
      </AnimatePresence>

      {/* Mobile */}
      <div className="sm:hidden">
        <AnimatePresence mode="wait">
          {!mobileExpanded ? (
            <motion.button key="pill" type="button" onClick={() => setMobileExpanded(true)}
              className="flex w-full items-center gap-3 rounded-full border border-[#E8E4DF] bg-white px-4 py-3 shadow-md"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }} whileTap={{ scale: 0.97 }}
            >
              <Search className="h-4 w-4 shrink-0 text-[#1B4332]" />
              <span className="text-sm text-[#6B6560]">Busca un destino en Venezuela</span>
            </motion.button>
          ) : (
            <motion.div key="card" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white shadow-lg"
            >
              <div className="space-y-0">
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.05, ease: [0.22, 1, 0.36, 1] }} className="flex items-center gap-3 px-4 py-3">
                  <MapPin className="h-5 w-5 shrink-0 text-[#1B4332]" />
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">¿A dónde vas?</span>
                    <input type="text" value={ubicacion} onChange={(e) => handleChange(e.target.value)} onKeyDown={handleKeyDown} autoFocus placeholder="Busca un destino en Venezuela"
                      className="w-full min-w-0 border-none bg-transparent text-sm text-[#1A1A1A] outline-none placeholder:text-[#6B6560] placeholder:text-xs"
                      autoComplete="off" role="combobox" aria-expanded={showDropdown} aria-haspopup="listbox"
                    />
                  </div>
                </motion.div>
                <div className="mx-4 h-px bg-[#E8E4DF]" />
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
                  <button type="button" onClick={() => { setDatePickerOpen(!datePickerOpen); setGuestPickerOpen(false) }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F8F6F3]">
                    <Calendar className="h-5 w-5 shrink-0 text-[#1B4332]" />
                    <div className="flex flex-1 flex-col">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">Fechas</span>
                      <span className="text-sm text-[#1A1A1A]">{dateRange.from && dateRange.to ? `${dateRange.from.getDate()}/${dateRange.from.getMonth() + 1} - ${dateRange.to.getDate()}/${dateRange.to.getMonth() + 1}` : dateRange.from ? `${dateRange.from.getDate()}/${dateRange.from.getMonth() + 1} - ...` : '¿Cuándo viajas?'}</span>
                    </div>
                    {datePickerOpen ? <ChevronUp className="h-4 w-4 text-[#6B6560]" /> : <ChevronDown className="h-4 w-4 text-[#6B6560]" />}
                  </button>
                  <AnimatePresence>
                    {datePickerOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }} className="overflow-hidden">
                        <div className="border-t border-[#E8E4DF] bg-[#FDFCFA] px-4 py-4"><MobileDatePicker dateRange={dateRange} onDateChange={setDateRange} onClose={() => setDatePickerOpen(false)} /></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <div className="mx-4 h-px bg-[#E8E4DF]" />
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                  <button type="button" onClick={() => { setGuestPickerOpen(!guestPickerOpen); setDatePickerOpen(false) }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F8F6F3]">
                    <Users className="h-5 w-5 shrink-0 text-[#1B4332]" />
                    <div className="flex flex-1 flex-col">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">Huéspedes</span>
                      <span className="text-sm text-[#1A1A1A]">{huespedes === '1' ? '1 huésped' : `${huespedes} huéspedes`}</span>
                    </div>
                    {guestPickerOpen ? <ChevronUp className="h-4 w-4 text-[#6B6560]" /> : <ChevronDown className="h-4 w-4 text-[#6B6560]" />}
                  </button>
                  <AnimatePresence>
                    {guestPickerOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }} className="overflow-hidden">
                        <div className="border-t border-[#E8E4DF] bg-[#FDFCFA] px-4 py-4"><MobileGuestPicker guests={huespedes} onGuestsChange={setHuespedes} onClose={() => setGuestPickerOpen(false)} /></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="border-t border-[#E8E4DF] px-4 py-3">
                  <Button className="w-full bg-[#1B4332] py-6 text-base font-semibold text-white hover:bg-[#2D6A4F]"
                    onClick={() => { closeAll(); setMobileExpanded(false); doSearch() }}
                  >
                    <Search className="mr-2 h-4 w-4" />Buscar
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {mobileExpanded && showDropdown && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            className="mt-2 overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white shadow-2xl"
          >
            <div className="border-b border-[#E8E4DF] px-4 py-2.5"><span className="text-xs font-semibold text-[#1A1A1A]">Destinos en Venezuela</span></div>
            <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
              {loading && resultados.length === 0 && (<li className="flex items-center gap-2 px-4 py-3 text-sm text-[#6B6560]"><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Buscando destinos...</li>)}
              {resultados.map((item, idx) => { const Icon = getIconForTipo(item.tipo); const isHighlighted = idx === selected; return (
                <li key={item.id ?? `${item.tipo}-${item.nombre}-${idx}`} role="option" aria-selected={isHighlighted}>
                  <button onClick={() => handleSelect(item)} onMouseEnter={() => setSelected(idx)} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isHighlighted ? 'bg-[#F8F6F3]' : 'hover:bg-[#F8F6F3]'}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isHighlighted ? 'bg-[#1B4332]/10' : 'bg-[#F0EDE8]'}`}><Icon className={`h-4 w-4 ${isHighlighted ? 'text-[#1B4332]' : 'text-[#6B6560]'}`} /></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#1A1A1A]">{item.nombre}</p><p className="truncate text-[11px] text-[#6B6560]">{item.tipo}{item.detalle ? ` · ${item.detalle}` : ''}</p></div>
                  </button>
                </li>
              ) })}
              {!loading && resultados.length === 0 && ubicacion.length >= 2 && (<li className="px-4 py-3 text-sm text-[#6B6560]">No encontramos destinos para &quot;{ubicacion}&quot;</li>)}
            </ul>
          </motion.div>
        )}
      </div>

      {/* Desktop location dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-3 hidden overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white shadow-2xl sm:block">
          <div className="border-b border-[#E8E4DF] px-4 py-2.5"><span className="text-xs font-semibold text-[#1A1A1A]">Destinos en Venezuela</span></div>
          <ul role="listbox" className="max-h-80 overflow-y-auto py-1">
            {loading && resultados.length === 0 && (<li className="flex items-center gap-2 px-4 py-3 text-sm text-[#6B6560]"><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Buscando destinos...</li>)}
            {resultados.map((item, idx) => { const Icon = getIconForTipo(item.tipo); const isHighlighted = idx === selected; return (
              <li key={item.id ?? `${item.tipo}-${item.nombre}-${idx}`} role="option" aria-selected={isHighlighted}>
                <button onClick={() => handleSelect(item)} onMouseEnter={() => setSelected(idx)} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isHighlighted ? 'bg-[#F8F6F3]' : 'hover:bg-[#F8F6F3]'}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isHighlighted ? 'bg-[#1B4332]/10' : 'bg-[#F0EDE8]'}`}><Icon className={`h-4 w-4 ${isHighlighted ? 'text-[#1B4332]' : 'text-[#6B6560]'}`} /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#1A1A1A]">{item.nombre}</p><p className="truncate text-[11px] text-[#6B6560]">{item.tipo}{item.detalle ? ` · ${item.detalle}` : ''}</p></div>
                </button>
              </li>
            ) })}
            {!loading && resultados.length === 0 && ubicacion.length >= 2 && (<li className="px-4 py-3 text-sm text-[#6B6560]">No encontramos destinos para &quot;{ubicacion}&quot;</li>)}
          </ul>
        </div>
      )}

      {/* Desktop popups */}
      <div className="hidden sm:block">
        <AnimatePresence>{datePickerOpen && <DatePickerPopup buttonRef={datesButtonRef} dateRange={dateRange} onDateChange={setDateRange} onClose={() => setDatePickerOpen(false)} />}</AnimatePresence>
        <AnimatePresence>{guestPickerOpen && <GuestPickerPopup buttonRef={guestsButtonRef} guests={huespedes} onGuestsChange={setHuespedes} onClose={() => setGuestPickerOpen(false)} />}</AnimatePresence>
        <AnimatePresence>{deporteDropdownOpen && <DeporteDropdown buttonRef={deporteButtonRef} deporte={deporte} onSelect={(v) => { setDeporte(v); setDeporteDropdownOpen(false) }} />}</AnimatePresence>
        <AnimatePresence>{sportsDateOpen && <SportsCalendarPopup buttonRef={fechaButtonRef} selectedDate={fecha} onDateSelect={(d) => { setFecha(d); setSportsDateOpen(false) }} />}</AnimatePresence>
        <AnimatePresence>{timePickerOpen && <TimePickerPopup buttonRef={horaButtonRef} horaInicio={horaInicio} horaFin={horaFin} onHoraInicioChange={setHoraInicio} onHoraFinChange={setHoraFin} onClose={() => setTimePickerOpen(false)} />}</AnimatePresence>
      </div>
    </div>
  )
}
