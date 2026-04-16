'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Tag, Loader2, Plus, Pencil, Trash2, Eye, ToggleLeft, ToggleRight, X, Users, TrendingDown, Calendar,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  getCupones, getCuponPorId, crearCupon, editarCupon,
  toggleCuponActivo, eliminarCupon, getCuponesUsos,
} from '@/actions/admin-cupones.actions'
import {
  TIPOS_DESCUENTO_LABELS, TIPOS_APLICACION_LABELS,
} from '@/lib/cupon-validations'

interface CuponRow {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipo_descuento: string
  valor_descuento: number
  moneda: string
  max_descuento: number | null
  tipo_aplicacion: string
  valor_aplicacion: string | null
  min_compra: number | null
  min_noches: number | null
  max_usos: number | null
  max_usos_por_usuario: number
  usos_actuales: number
  fecha_inicio: string
  fecha_fin: string
  activo: boolean
  creado_por: string | null
  fecha_creacion: string
}

interface UsoRow {
  id: string
  cupon_id: string
  usuario_id: string
  reserva_id: string
  descuento_aplicado: number
  fecha_uso: string
  usuario: { id: string; nombre: string; apellido: string; email: string } | null
  cupon: { codigo: string; nombre: string } | null
  reserva: { codigo: string } | null
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function AdminCuponesPage() {
  const [cupones, setCupones] = useState<CuponRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailCupon, setDetailCupon] = useState<CuponRow | null>(null)
  const [detailUsos, setDetailUsos] = useState<UsoRow[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [accionando, setAccionando] = useState<string | null>(null)

  const [formCodigo, setFormCodigo] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formTipoDescuento, setFormTipoDescuento] = useState('PORCENTAJE')
  const [formValorDescuento, setFormValorDescuento] = useState('')
  const [formMoneda, setFormMoneda] = useState('USD')
  const [formMaxDescuento, setFormMaxDescuento] = useState('')
  const [formTipoAplicacion, setFormTipoAplicacion] = useState('CUALQUIER_RESERVA')
  const [formValorAplicacion, setFormValorAplicacion] = useState('')
  const [formMinCompra, setFormMinCompra] = useState('')
  const [formMinNoches, setFormMinNoches] = useState('')
  const [formMaxUsos, setFormMaxUsos] = useState('')
  const [formMaxUsosPorUsuario, setFormMaxUsosPorUsuario] = useState('1')
  const [formFechaInicio, setFormFechaInicio] = useState('')
  const [formFechaFin, setFormFechaFin] = useState('')

  const resetForm = () => {
    setFormCodigo(''); setFormNombre(''); setFormDescripcion('')
    setFormTipoDescuento('PORCENTAJE'); setFormValorDescuento('')
    setFormMoneda('USD'); setFormMaxDescuento('')
    setFormTipoAplicacion('CUALQUIER_RESERVA'); setFormValorAplicacion('')
    setFormMinCompra(''); setFormMinNoches(''); setFormMaxUsos('')
    setFormMaxUsosPorUsuario('1'); setFormFechaInicio(''); setFormFechaFin('')
    setEditingId(null); setShowForm(false)
  }

  const loadCupones = useCallback(async () => {
    const data = await getCupones()
    setCupones(data as unknown as CuponRow[])
    setCargando(false)
  }, [])

  useEffect(() => { loadCupones() }, [loadCupones])

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (c: CuponRow) => {
    setEditingId(c.id)
    setFormCodigo(c.codigo); setFormNombre(c.nombre)
    setFormDescripcion(c.descripcion || '')
    setFormTipoDescuento(c.tipo_descuento)
    setFormValorDescuento(String(c.valor_descuento))
    setFormMoneda(c.moneda); setFormMaxDescuento(c.max_descuento ? String(c.max_descuento) : '')
    setFormTipoAplicacion(c.tipo_aplicacion)
    setFormValorAplicacion(c.valor_aplicacion || '')
    setFormMinCompra(c.min_compra ? String(c.min_compra) : '')
    setFormMinNoches(c.min_noches ? String(c.min_noches) : '')
    setFormMaxUsos(c.max_usos ? String(c.max_usos) : '')
    setFormMaxUsosPorUsuario(String(c.max_usos_por_usuario))
    setFormFechaInicio(c.fecha_inicio?.split('T')[0] || '')
    setFormFechaFin(c.fecha_fin?.split('T')[0] || '')
    setShowForm(true)
  }

  const openDetail = async (id: string) => {
    setDetailId(id); setDetailLoading(true)
    const [cuponData, usosData] = await Promise.all([
      getCuponPorId(id),
      getCuponesUsos(id),
    ])
    setDetailCupon(cuponData as unknown as CuponRow)
    setDetailUsos(usosData as unknown as UsoRow[])
    setDetailLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData()
    if (editingId) fd.append('id', editingId)
    fd.append('codigo', formCodigo)
    fd.append('nombre', formNombre)
    fd.append('descripcion', formDescripcion)
    fd.append('tipoDescuento', formTipoDescuento)
    fd.append('valorDescuento', formValorDescuento)
    fd.append('moneda', formMoneda)
    if (formMaxDescuento) fd.append('maxDescuento', formMaxDescuento)
    fd.append('tipoAplicacion', formTipoAplicacion)
    if (formValorAplicacion) fd.append('valorAplicacion', formValorAplicacion)
    if (formMinCompra) fd.append('minCompra', formMinCompra)
    if (formMinNoches) fd.append('minNoches', formMinNoches)
    if (formMaxUsos) fd.append('maxUsos', formMaxUsos)
    fd.append('maxUsosPorUsuario', formMaxUsosPorUsuario)
    fd.append('fechaInicio', formFechaInicio)
    fd.append('fechaFin', formFechaFin)

    const res = editingId ? await editarCupon(fd) : await crearCupon(fd)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(editingId ? 'Cupón actualizado' : 'Cupón creado')
      resetForm()
      loadCupones()
    }
    setSaving(false)
  }

  const handleToggle = async (id: string, activo: boolean) => {
    setAccionando(id)
    const res = await toggleCuponActivo(id, !activo)
    if (res.error) toast.error(res.error)
    else { toast.success(activo ? 'Cupón desactivado' : 'Cupón activado'); loadCupones() }
    setAccionando(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cupón? Esta acción no se puede deshacer.')) return
    setAccionando(id)
    const res = await eliminarCupon(id)
    if (res.error) toast.error(res.error)
    else { toast.success('Cupón eliminado'); loadCupones() }
    setAccionando(null)
  }

  const totalDescuento = detailUsos.reduce((sum, u) => sum + (u.descuento_aplicado || 0), 0)

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  if (detailId && detailCupon) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-5xl">
        <motion.div variants={fadeUp} className="mb-4">
          <button onClick={() => { setDetailId(null); setDetailCupon(null); setDetailUsos([]) }}
            className="flex items-center gap-2 text-sm text-[#9E9892] hover:text-[#1A1A1A] transition-colors">
            <X className="h-4 w-4" /> Volver a cupones
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-5 p-6 sm:p-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Tag className="h-8 w-8 text-[#52B788]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{detailCupon.codigo}</h1>
              <p className="text-sm text-white/60 mt-0.5">{detailCupon.nombre}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${detailCupon.activo ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-white/10 text-white/40'}`}>
              {detailCupon.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="border-t border-white/10 grid grid-cols-2 sm:grid-cols-4">
            <div className="flex items-center gap-3 px-5 py-3.5 border-r border-white/10">
              <Users className="h-3.5 w-3.5 text-white/60" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Usos</p>
                <p className="text-sm font-bold text-white tabular-nums">{detailCupon.usos_actuales}{detailCupon.max_usos ? `/${detailCupon.max_usos}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5 border-r border-white/10">
              <TrendingDown className="h-3.5 w-3.5 text-[#52B788]" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Descuento total</p>
                <p className="text-sm font-bold text-white tabular-nums">${totalDescuento.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5 border-r border-white/10">
              <Calendar className="h-3.5 w-3.5 text-white/60" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Inicio</p>
                <p className="text-sm font-bold text-white tabular-nums">{detailCupon.fecha_inicio?.split('T')[0]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Calendar className="h-3.5 w-3.5 text-white/60" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Expiración</p>
                <p className="text-sm font-bold text-white tabular-nums">{detailCupon.fecha_fin?.split('T')[0]}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5 mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-3">Detalles del cupón</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#9E9892]">Tipo descuento:</span> <span className="font-medium">{TIPOS_DESCUENTO_LABELS[detailCupon.tipo_descuento]?.label || detailCupon.tipo_descuento}</span></div>
            <div><span className="text-[#9E9892]">Valor:</span> <span className="font-medium">{detailCupon.tipo_descuento === 'PORCENTAJE' ? `${detailCupon.valor_descuento}%` : detailCupon.tipo_descuento === 'NOCHES_GRATIS' ? `${detailCupon.valor_descuento} noches` : `$${detailCupon.valor_descuento}`}</span></div>
            <div><span className="text-[#9E9892]">Aplicación:</span> <span className="font-medium">{TIPOS_APLICACION_LABELS[detailCupon.tipo_aplicacion]?.label || detailCupon.tipo_aplicacion}</span></div>
            <div><span className="text-[#9E9892]">Moneda:</span> <span className="font-medium">{detailCupon.moneda}</span></div>
            {detailCupon.max_descuento && <div><span className="text-[#9E9892]">Max descuento:</span> <span className="font-medium">${detailCupon.max_descuento}</span></div>}
            {detailCupon.min_compra && <div><span className="text-[#9E9892]">Min compra:</span> <span className="font-medium">${detailCupon.min_compra}</span></div>}
            {detailCupon.min_noches && <div><span className="text-[#9E9892]">Min noches:</span> <span className="font-medium">{detailCupon.min_noches}</span></div>}
            <div><span className="text-[#9E9892]">Max por usuario:</span> <span className="font-medium">{detailCupon.max_usos_por_usuario}</span></div>
            {detailCupon.descripcion && <div className="col-span-2"><span className="text-[#9E9892]">Descripción:</span> <span className="font-medium">{detailCupon.descripcion}</span></div>}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-3">Historial de usos ({detailUsos.length})</h3>
          {detailUsos.length === 0 ? (
            <p className="text-sm text-[#9E9892] text-center py-8">Este cupón aún no ha sido utilizado</p>
          ) : (
            <div className="space-y-2">
              {detailUsos.map((uso) => (
                <div key={uso.id} className="flex items-center justify-between rounded-xl border border-[#E8E4DF] p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8F3DC] text-xs font-bold text-[#1B4332]">
                      {uso.usuario?.nombre?.[0] || '?'}{uso.usuario?.apellido?.[0] || ''}
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{uso.usuario?.nombre} {uso.usuario?.apellido}</p>
                      <p className="text-[10px] text-[#9E9892]">{uso.usuario?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#52B788]">-${uso.descuento_aplicado?.toFixed(2)}</p>
                    <p className="text-[10px] text-[#9E9892]">Reserva {uso.reserva?.codigo} · {new Date(uso.fecha_uso).toLocaleDateString('es-VE')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    )
  }

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-5xl">

      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-5 p-6 sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Tag className="h-8 w-8 text-[#52B788]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Gestión de Cupones</h1>
            <p className="text-sm text-white/60 mt-0.5">Crea, edita y monitorea cupones de descuento</p>
          </div>
          <button onClick={openCreate}
            className="flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition-all hover:bg-white/20 ring-1 ring-white/20">
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        </div>
        <div className="border-t border-white/10 grid grid-cols-3">
          <div className="flex items-center gap-3 px-5 py-3.5 border-r border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Tag className="h-3.5 w-3.5 text-white/60" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Total</p>
              <p className="text-sm font-bold text-white tabular-nums">{cupones.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5 border-r border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D8F3DC]">
              <ToggleRight className="h-3.5 w-3.5 text-[#1B4332]" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Activos</p>
              <p className="text-sm font-bold text-white tabular-nums">{cupones.filter(c => c.activo).length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Users className="h-3.5 w-3.5 text-white/60" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Usos totales</p>
              <p className="text-sm font-bold text-white tabular-nums">{cupones.reduce((s, c) => s + c.usos_actuales, 0)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {showForm && (
        <motion.div variants={fadeUp} className="mb-6 rounded-2xl border border-[#E8E4DF] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#1A1A1A]">{editingId ? 'Editar cupón' : 'Nuevo cupón'}</h3>
            <button onClick={resetForm} className="rounded-lg p-1 text-[#9E9892] hover:text-[#1A1A1A]"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Código</Label>
              <Input value={formCodigo} onChange={(e) => setFormCodigo(e.target.value.toUpperCase())} placeholder="Ej: SUMMER2025" required maxLength={30}
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Nombre</Label>
              <Input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Ej: Descuento de verano" required maxLength={100}
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Descripción</Label>
              <Input value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} placeholder="Opcional" maxLength={500}
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Tipo descuento</Label>
              <select value={formTipoDescuento} onChange={(e) => setFormTipoDescuento(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-white px-3 text-sm focus:border-[#52B788] focus:outline-none">
                {Object.entries(TIPOS_DESCUENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Valor</Label>
              <Input type="number" step="0.01" min="0.01" value={formValorDescuento} onChange={(e) => setFormValorDescuento(e.target.value)} required
                placeholder={formTipoDescuento === 'PORCENTAJE' ? 'Ej: 15' : 'Ej: 50'}
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Moneda</Label>
              <select value={formMoneda} onChange={(e) => setFormMoneda(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-white px-3 text-sm focus:border-[#52B788] focus:outline-none">
                <option value="USD">USD</option>
                <option value="VES">VES</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Max descuento (opcional)</Label>
              <Input type="number" step="0.01" min="0" value={formMaxDescuento} onChange={(e) => setFormMaxDescuento(e.target.value)} placeholder="Sin límite"
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Aplicación</Label>
              <select value={formTipoAplicacion} onChange={(e) => setFormTipoAplicacion(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-white px-3 text-sm focus:border-[#52B788] focus:outline-none">
                {Object.entries(TIPOS_APLICACION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Valor aplicación {TIPOS_APLICACION_LABELS[formTipoAplicacion]?.requiereValor ? '(requerido)' : '(opcional)'}</Label>
              <Input value={formValorAplicacion} onChange={(e) => setFormValorAplicacion(e.target.value)} placeholder="ID o valor"
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Compra mínima</Label>
              <Input type="number" step="0.01" min="0" value={formMinCompra} onChange={(e) => setFormMinCompra(e.target.value)} placeholder="Sin mínimo"
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Noches mínimas</Label>
              <Input type="number" min="1" value={formMinNoches} onChange={(e) => setFormMinNoches(e.target.value)} placeholder="Sin mínimo"
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Max usos total</Label>
              <Input type="number" min="1" value={formMaxUsos} onChange={(e) => setFormMaxUsos(e.target.value)} placeholder="Sin límite"
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Max usos por usuario</Label>
              <Input type="number" min="1" value={formMaxUsosPorUsuario} onChange={(e) => setFormMaxUsosPorUsuario(e.target.value)} required
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Fecha inicio</Label>
              <Input type="date" value={formFechaInicio} onChange={(e) => setFormFechaInicio(e.target.value)} required
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Fecha fin</Label>
              <Input type="date" value={formFechaFin} onChange={(e) => setFormFechaFin(e.target.value)} required
                className="border-[#E8E4DF] bg-white h-10 rounded-xl" disabled={saving} />
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-6 text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F] disabled:opacity-40">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Guardar cambios' : 'Crear cupón'}
              </button>
              <button type="button" onClick={resetForm}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E8E4DF] px-6 text-sm font-medium text-[#6B6560] hover:bg-[#F8F6F3] transition-all">
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="space-y-2">
        {cupones.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Tag className="h-10 w-10 text-[#E8E4DF]" />
            <p className="text-sm text-[#9E9892]">No hay cupones creados</p>
            <button onClick={openCreate} className="text-sm font-semibold text-[#1B4332] hover:underline">Crear primer cupón</button>
          </div>
        ) : cupones.map((c) => (
          <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-[#E8E4DF] bg-white p-4 transition-all hover:border-[#D8F3DC]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8F3DC]/60">
              <Tag className={`h-5 w-5 ${c.activo ? 'text-[#1B4332]' : 'text-[#9E9892]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[#1A1A1A]">{c.codigo}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.activo ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-[#F8F6F3] text-[#9E9892]'}`}>
                  {c.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-xs text-[#6B6560] truncate">{c.nombre} · {TIPOS_DESCUENTO_LABELS[c.tipo_descuento]?.label} · {c.usos_actuales}{c.max_usos ? `/${c.max_usos}` : ''} usos</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openDetail(c.id)} title="Ver detalle"
                className="rounded-lg p-2 text-[#9E9892] hover:bg-[#F8F6F3] hover:text-[#1A1A1A] transition-colors">
                <Eye className="h-4 w-4" />
              </button>
              <button onClick={() => openEdit(c)} title="Editar"
                className="rounded-lg p-2 text-[#9E9892] hover:bg-[#F8F6F3] hover:text-[#1A1A1A] transition-colors">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleToggle(c.id, c.activo)} title={c.activo ? 'Desactivar' : 'Activar'} disabled={accionando === c.id}
                className="rounded-lg p-2 text-[#9E9892] hover:bg-[#F8F6F3] hover:text-[#1A1A1A] transition-colors disabled:opacity-40">
                {c.activo ? <ToggleRight className="h-4 w-4 text-[#1B4332]" /> : <ToggleLeft className="h-4 w-4" />}
              </button>
              <button onClick={() => handleDelete(c.id)} title="Eliminar" disabled={accionando === c.id}
                className="rounded-lg p-2 text-[#9E9892] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40">
                {accionando === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
