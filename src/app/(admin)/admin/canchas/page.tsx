'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, MapPin, Star, Eye, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AdminHeader, AdminEmptyState } from '@/components/admin'
import { getPropiedadesAdmin } from '@/actions/admin-propiedades.actions'
import { TIPOS_CANCHA } from '@/lib/constants'

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-[#F8F6F3] text-[#6B6560]' },
  PENDIENTE_REVISION: { label: 'Pendiente', color: 'bg-[#FEF3C7] text-[#92400E]' },
  PUBLICADA: { label: 'Publicada', color: 'bg-[#D8F3DC] text-[#1B4332]' },
  PAUSADA: { label: 'Pausada', color: 'bg-[#FEF3C7] text-[#92400E]' },
  SUSPENDIDA: { label: 'Suspendida', color: 'bg-[#FEE2E2] text-[#C1121F]' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function formatMoney(n: number, moneda: string) {
  if (moneda === 'VES') return `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function AdminCanchasPage() {
  const [canchas, setCanchas] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')

  const cargar = useCallback(async (p: number) => {
    setLoading(true)
    const res = await getPropiedadesAdmin({
      categoria: 'DEPORTE',
      pagina: p,
      limite: 20,
      busqueda: busqueda || undefined,
      estado: estadoFiltro || undefined,
    })
    if (res && 'error' in res) {
      toast.error(res.error as string)
    } else if (res) {
      setCanchas(res.propiedades || [])
      setTotal(res.total || 0)
    }
    setLoading(false)
  }, [busqueda, estadoFiltro])

  useEffect(() => { cargar(pagina) }, [pagina, cargar])

  const totalPaginas = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <AdminHeader
        titulo="Canchas deportivas"
        subtitulo={`${total} canchas registradas`}
        icon={Trophy}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9892]" />
          <Input
            placeholder="Buscar canchas..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
            className="pl-9 border-[#E8E4DF] bg-white"
          />
        </div>
        <div className="flex gap-2">
          {['', 'PUBLICADA', 'PENDIENTE_REVISION', 'BORRADOR', 'PAUSADA', 'SUSPENDIDA'].map((e) => (
            <button
              key={e}
              onClick={() => { setEstadoFiltro(e); setPagina(1) }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                estadoFiltro === e
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-[#F8F6F3] text-[#6B6560] hover:bg-[#E8E4DF]'
              }`}
            >
              {e || 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B4332]" />
        </div>
      ) : canchas.length === 0 ? (
        <AdminEmptyState icon={Trophy} titulo="Sin canchas" descripcion="No hay canchas que coincidan con los filtros" />
      ) : (
        <div className="space-y-3">
          {canchas.map((cancha, i) => {
            const estado = (cancha.estado_publicacion as string) || 'BORRADOR'
            const tipoCancha = (cancha.tipo_cancha as string) || ''
            const precioHora = cancha.precio_por_hora as number | null
            const moneda = (cancha.moneda as string) || 'USD'
            const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.BORRADOR
            const imagen = cancha.imagen_principal as string | null

            return (
              <motion.div
                key={cancha.id as string}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 rounded-xl border border-[#E8E4DF] bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#D8F3DC]">
                  {imagen ? (
                    <img src={imagen} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Trophy className="h-6 w-6 text-[#1B4332]/40" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-[#1A1A1A]">{cancha.titulo as string}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#6B6560]">
                    <MapPin className="h-3 w-3" />
                    {cancha.ciudad as string}, {cancha.estado as string}
                    {tipoCancha && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-[#1B4332]">
                          {TIPOS_CANCHA[tipoCancha as keyof typeof TIPOS_CANCHA] || tipoCancha}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="hidden items-center gap-4 sm:flex">
                  {precioHora != null && (
                    <span className="text-sm font-bold text-[#1B4332]">
                      {formatMoney(precioHora, moneda)}/h
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-[#6B6560]">
                    <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                    {(cancha.rating_promedio as number || 0).toFixed(1)}
                  </div>
                </div>

                <Badge className={cfg.color}>{cfg.label}</Badge>

                <Link href={`/admin/propiedades/${cancha.id as string}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B6560]">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-[#6B6560]">Página {pagina} de {totalPaginas}</span>
          <Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
