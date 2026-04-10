'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Edit3, Check, X, Package, ConciergeBell,
  ShoppingBag, Loader2, ImageIcon, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminHeader } from '@/components/admin/admin-header'
import {
  getProductosStoreAdmin,
  getServiciosStoreAdmin,
  crearProductoStore,
  actualizarProductoStore,
  eliminarProductoStore,
  crearServicioStore,
  actualizarServicioStore,
  eliminarServicioStore,
  subirImagenStore,
} from '@/actions/admin-boogie-store.actions'
import { optimizeImage } from '@/lib/image-optimize'
import { CATEGORIAS_STORE_PRODUCTO, CATEGORIAS_STORE_SERVICIO, TIPOS_PRECIO_LABELS } from '@/lib/store-constants'
import type { CategoriaStoreProducto, CategoriaStoreServicio, TipoPrecio } from '@/lib/store-constants'

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

type Tab = 'productos' | 'servicios'

interface ProductoRow {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  moneda: string
  imagen_url: string | null
  categoria: string
  activo: boolean
  orden: number
}

interface ServicioRow {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  moneda: string
  tipo_precio: string
  imagen_url: string | null
  categoria: string
  activo: boolean
  orden: number
}

export default function BoogieStoreAdminPage() {
  const [tab, setTab] = useState<Tab>('productos')
  const [productos, setProductos] = useState<ProductoRow[]>([])
  const [servicios, setServicios] = useState<ServicioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formPrecio, setFormPrecio] = useState('')
  const [formMoneda, setFormMoneda] = useState<'USD' | 'VES'>('USD')
  const [formCategoria, setFormCategoria] = useState('')
  const [formTipoPrecio, setFormTipoPrecio] = useState<'FIJO' | 'POR_NOCHE'>('FIJO')
  const [formOrden, setFormOrden] = useState('0')
  const [formImagenUrl, setFormImagenUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [prods, servs] = await Promise.all([getProductosStoreAdmin(), getServiciosStoreAdmin()])
    setProductos(prods as ProductoRow[])
    setServicios(servs as ServicioRow[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => {
    setFormNombre('')
    setFormDescripcion('')
    setFormPrecio('')
    setFormMoneda('USD')
    setFormCategoria('')
    setFormTipoPrecio('FIJO')
    setFormOrden('0')
    setFormImagenUrl(null)
    setEditingId(null)
    setShowForm(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const optimized = await optimizeImage(file)
      const fd = new FormData()
      fd.append('imagen', optimized)
      const res = await subirImagenStore(fd)
      if (res.error) {
        toast.error(res.error)
      } else if (res.url) {
        setFormImagenUrl(res.url)
      }
    } catch {
      toast.error('Error al procesar la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProducto = async () => {
    if (!formNombre.trim() || !formPrecio || !formCategoria) {
      toast.error('Completa todos los campos requeridos')
      return
    }
    setSaving(true)
    const datos = {
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim() || undefined,
      precio: parseFloat(formPrecio),
      moneda: formMoneda,
      imagenUrl: formImagenUrl || undefined,
      categoria: formCategoria,
      orden: parseInt(formOrden) || 0,
    }
    if (editingId) {
      const res = await actualizarProductoStore(editingId, datos)
      if (res.error) { toast.error(res.error); setSaving(false); return }
      toast.success('Producto actualizado')
    } else {
      const res = await crearProductoStore(datos)
      if (res.error) { toast.error(res.error); setSaving(false); return }
      toast.success('Producto creado')
    }
    setSaving(false)
    resetForm()
    load()
  }

  const handleSaveServicio = async () => {
    if (!formNombre.trim() || !formPrecio || !formCategoria) {
      toast.error('Completa todos los campos requeridos')
      return
    }
    setSaving(true)
    const datos = {
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim() || undefined,
      precio: parseFloat(formPrecio),
      moneda: formMoneda,
      tipoPrecio: formTipoPrecio,
      imagenUrl: formImagenUrl || undefined,
      categoria: formCategoria,
      orden: parseInt(formOrden) || 0,
    }
    if (editingId) {
      const res = await actualizarServicioStore(editingId, datos)
      if (res.error) { toast.error(res.error); setSaving(false); return }
      toast.success('Servicio actualizado')
    } else {
      const res = await crearServicioStore(datos)
      if (res.error) { toast.error(res.error); setSaving(false); return }
      toast.success('Servicio creado')
    }
    setSaving(false)
    resetForm()
    load()
  }

  const handleEditProducto = (p: ProductoRow) => {
    setEditingId(p.id)
    setFormNombre(p.nombre)
    setFormDescripcion(p.descripcion || '')
    setFormPrecio(String(p.precio))
    setFormMoneda(p.moneda as 'USD' | 'VES')
    setFormCategoria(p.categoria)
    setFormOrden(String(p.orden))
    setFormImagenUrl(p.imagen_url)
    setShowForm(true)
  }

  const handleEditServicio = (s: ServicioRow) => {
    setEditingId(s.id)
    setFormNombre(s.nombre)
    setFormDescripcion(s.descripcion || '')
    setFormPrecio(String(s.precio))
    setFormMoneda(s.moneda as 'USD' | 'VES')
    setFormCategoria(s.categoria)
    setFormTipoPrecio(s.tipo_precio as 'FIJO' | 'POR_NOCHE')
    setFormOrden(String(s.orden))
    setFormImagenUrl(s.imagen_url)
    setShowForm(true)
  }

  const handleToggleActivo = async (id: string, tipo: Tab, activo: boolean) => {
    if (tipo === 'productos') {
      const res = await actualizarProductoStore(id, { activo: !activo })
      if (res.error) { toast.error(res.error); return }
    } else {
      const res = await actualizarServicioStore(id, { activo: !activo })
      if (res.error) { toast.error(res.error); return }
    }
    toast.success(activo ? 'Desactivado' : 'Activado')
    load()
  }

  const handleDelete = async (id: string, tipo: Tab) => {
    if (!confirm('Eliminar este item?')) return
    if (tipo === 'productos') {
      const res = await eliminarProductoStore(id)
      if (res.error) { toast.error(res.error); return }
    } else {
      const res = await eliminarServicioStore(id)
      if (res.error) { toast.error(res.error); return }
    }
    toast.success('Eliminado')
    load()
  }

  const categorias = tab === 'productos' ? CATEGORIAS_STORE_PRODUCTO : CATEGORIAS_STORE_SERVICIO

  return (
    <div className="space-y-6">
      <AdminHeader
        icon={ShoppingBag}
        titulo="Boogie Store"
        subtitulo="Administra productos y servicios del catalogo"
      />

      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">

        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div className="flex gap-1 rounded-xl bg-[#F8F6F3] p-1">
            <button
              onClick={() => { setTab('productos'); resetForm() }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                tab === 'productos' ? 'bg-white text-[#1B4332] shadow-sm' : 'text-[#9E9892]'
              }`}
            >
              <Package className="h-4 w-4" />
              Productos ({productos.length})
            </button>
            <button
              onClick={() => { setTab('servicios'); resetForm() }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                tab === 'servicios' ? 'bg-white text-[#1B4332] shadow-sm' : 'text-[#9E9892]'
              }`}
            >
              <ConciergeBell className="h-4 w-4" />
              Servicios ({servicios.length})
            </button>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F]"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {showForm && (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-[#E8E4DF] bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1A1A1A]">
                    {editingId ? 'Editar' : 'Nuevo'} {tab === 'productos' ? 'producto' : 'servicio'}
                  </h3>
                  <button onClick={resetForm} className="text-[#9E9892] hover:text-[#1A1A1A]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[#6B6560]">Imagen</label>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#E8E4DF] bg-[#F8F6F3] transition-all hover:border-[#1B4332]/40"
                      >
                        {formImagenUrl ? (
                          <>
                            <Image fill src={formImagenUrl} alt="" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                              <Upload className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            {uploading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-[#9E9892]" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-[#9E9892]" />
                            )}
                            <span className="text-[9px] text-[#9E9892]">Subir</span>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-[#6B6560]">
                          {formImagenUrl ? 'Imagen cargada. Click para cambiar.' : 'Click para subir una imagen.'}
                        </p>
                        {formImagenUrl && (
                          <button
                            onClick={() => { setFormImagenUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                            className="mt-1 text-xs text-[#C1121F] hover:underline"
                          >
                            Eliminar imagen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[#6B6560]">Nombre *</label>
                    <input
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      className="w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm outline-none focus:border-[#1B4332]"
                      placeholder="Nombre del item"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[#6B6560]">Descripcion</label>
                    <textarea
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                      className="w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm outline-none focus:border-[#1B4332] resize-none"
                      rows={2}
                      placeholder="Descripcion opcional"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#6B6560]">Precio *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formPrecio}
                      onChange={(e) => setFormPrecio(e.target.value)}
                      className="w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm outline-none focus:border-[#1B4332]"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#6B6560]">Moneda</label>
                    <select
                      value={formMoneda}
                      onChange={(e) => setFormMoneda(e.target.value as 'USD' | 'VES')}
                      className="w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm outline-none focus:border-[#1B4332]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="VES">VES (Bs.)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#6B6560]">Categoria *</label>
                    <select
                      value={formCategoria}
                      onChange={(e) => setFormCategoria(e.target.value)}
                      className="w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm outline-none focus:border-[#1B4332]"
                    >
                      <option value="">Seleccionar...</option>
                      {Object.entries(categorias).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {tab === 'servicios' && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#6B6560]">Tipo de precio</label>
                      <select
                        value={formTipoPrecio}
                        onChange={(e) => setFormTipoPrecio(e.target.value as 'FIJO' | 'POR_NOCHE')}
                        className="w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm outline-none focus:border-[#1B4332]"
                      >
                        {Object.entries(TIPOS_PRECIO_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#6B6560]">Orden</label>
                    <input
                      type="number"
                      value={formOrden}
                      onChange={(e) => setFormOrden(e.target.value)}
                      className="w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={resetForm}
                    className="rounded-lg border border-[#E8E4DF] px-4 py-2 text-sm font-medium text-[#6B6560] hover:bg-[#F8F6F3]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={tab === 'productos' ? handleSaveProducto : handleSaveServicio}
                    disabled={saving || uploading}
                    className="flex items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2D6A4F] disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {editingId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={fadeUp}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#52B788]" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {tab === 'productos' ? (
                <motion.div key="prod-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  {productos.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-16 text-[#9E9892]">
                      <Package className="h-10 w-10" />
                      <p className="text-sm">No hay productos. Crea el primero!</p>
                    </div>
                  )}
                  {productos.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-4 rounded-xl border bg-white p-4 transition-all ${
                        p.activo ? 'border-[#E8E4DF]' : 'border-[#E8E4DF] opacity-50'
                      }`}
                    >
                      {p.imagen_url ? (
                        <Image src={p.imagen_url} alt={p.nombre} width={48} height={48} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#D8F3DC]/60">
                          <Package className="h-5 w-5 text-[#1B4332]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#1A1A1A]">{p.nombre}</p>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                            p.activo ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-[#FEE2E2] text-[#C1121F]'
                          }`}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-xs text-[#9E9892]">
                          {CATEGORIAS_STORE_PRODUCTO[p.categoria as CategoriaStoreProducto] || p.categoria}
                          {' \u2022 '}
                          {p.moneda === 'USD' ? '$' : 'Bs.'}{Number(p.precio).toFixed(2)}
                          {' \u2022 '}
                          Orden: {p.orden}
                        </p>
                        {p.descripcion && <p className="mt-0.5 text-[11px] text-[#9E9892] line-clamp-1">{p.descripcion}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleActivo(p.id, 'productos', p.activo)}
                          className={`rounded-lg p-2 text-xs font-medium transition-all ${
                            p.activo ? 'text-[#92400E] hover:bg-[#FEF3C7]' : 'text-[#1B4332] hover:bg-[#D8F3DC]'
                          }`}
                          title={p.activo ? 'Desactivar' : 'Activar'}
                        >
                          {p.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleEditProducto(p)}
                          className="rounded-lg p-2 text-[#6B6560] hover:bg-[#F8F6F3]"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, 'productos')}
                          className="rounded-lg p-2 text-[#9E9892] hover:bg-[#FEE2E2] hover:text-[#C1121F]"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="serv-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  {servicios.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-16 text-[#9E9892]">
                      <ConciergeBell className="h-10 w-10" />
                      <p className="text-sm">No hay servicios. Crea el primero!</p>
                    </div>
                  )}
                  {servicios.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-4 rounded-xl border bg-white p-4 transition-all ${
                        s.activo ? 'border-[#E8E4DF]' : 'border-[#E8E4DF] opacity-50'
                      }`}
                    >
                      {s.imagen_url ? (
                        <Image src={s.imagen_url} alt={s.nombre} width={48} height={48} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#FEF3C7]/60">
                          <ConciergeBell className="h-5 w-5 text-[#92400E]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#1A1A1A]">{s.nombre}</p>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                            s.activo ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-[#FEE2E2] text-[#C1121F]'
                          }`}>
                            {s.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="rounded bg-[#E8F4FD] px-1.5 py-0.5 text-[9px] font-semibold text-[#457B9D]">
                            {TIPOS_PRECIO_LABELS[s.tipo_precio as TipoPrecio]}
                          </span>
                        </div>
                        <p className="text-xs text-[#9E9892]">
                          {CATEGORIAS_STORE_SERVICIO[s.categoria as CategoriaStoreServicio] || s.categoria}
                          {' \u2022 '}
                          {s.moneda === 'USD' ? '$' : 'Bs.'}{Number(s.precio).toFixed(2)}
                          {' \u2022 '}
                          Orden: {s.orden}
                        </p>
                        {s.descripcion && <p className="mt-0.5 text-[11px] text-[#9E9892] line-clamp-1">{s.descripcion}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleActivo(s.id, 'servicios', s.activo)}
                          className={`rounded-lg p-2 text-xs font-medium transition-all ${
                            s.activo ? 'text-[#92400E] hover:bg-[#FEF3C7]' : 'text-[#1B4332] hover:bg-[#D8F3DC]'
                          }`}
                          title={s.activo ? 'Desactivar' : 'Activar'}
                        >
                          {s.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleEditServicio(s)}
                          className="rounded-lg p-2 text-[#6B6560] hover:bg-[#F8F6F3]"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, 'servicios')}
                          className="rounded-lg p-2 text-[#9E9892] hover:bg-[#FEE2E2] hover:text-[#C1121F]"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
