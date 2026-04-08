'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Loader2, Search, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getVerificacionesPendientes, revisarVerificacion } from '@/actions/verificacion.actions'

interface UsuarioVerificacion {
  id: string
  nombre: string
  apellido: string
  email: string
  cedula: string | null
  telefono: string | null
}

interface Verificacion {
  id: string
  usuario_id: string
  metodo: 'METAMAP' | 'MANUAL'
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'APROBADA' | 'RECHAZADA'
  foto_frontal_url: string | null
  foto_trasera_url: string | null
  foto_selfie_url: string | null
  motivo_rechazo: string | null
  fecha_creacion: string
  usuario: UsuarioVerificacion
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-[#FEF9E7] text-[#B8860B]', icon: Clock },
  EN_PROCESO: { label: 'En proceso', color: 'bg-[#E0F2FE] text-[#0369A1]', icon: Loader2 },
  APROBADA: { label: 'Aprobada', color: 'bg-[#D8F3DC] text-[#1B4332]', icon: CheckCircle2 },
  RECHAZADA: { label: 'Rechazada', color: 'bg-[#FEE2E2] text-[#C1121F]', icon: XCircle },
}

export default function AdminVerificacionesPage() {
  const [verificaciones, setVerificaciones] = useState<Verificacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState<string>('TODAS')
  const [busqueda, setBusqueda] = useState('')
  const [expandida, setExpandida] = useState<string | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState<Record<string, string>>({})
  const [procesando, setProcesando] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getVerificacionesPendientes().then((res) => {
      if (cancelled) return
      if (res.error) {
        toast.error(res.error)
      } else if (res.verificaciones) {
        setVerificaciones(res.verificaciones as Verificacion[])
      }
      setCargando(false)
    })
    return () => { cancelled = true }
  }, [])

  const handleRevisar = async (id: string, accion: 'APROBADA' | 'RECHAZADA') => {
    setProcesando(id)
    const formData = new FormData()
    formData.append('verificacionId', id)
    formData.append('accion', accion)
    if (accion === 'RECHAZADA') {
      formData.append('motivoRechazo', motivoRechazo[id] || 'No cumple con los requisitos')
    }

    const res = await revisarVerificacion(formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(accion === 'APROBADA' ? 'Verificación aprobada' : 'Verificación rechazada')
      const res2 = await getVerificacionesPendientes()
      if (res2.verificaciones) setVerificaciones(res2.verificaciones as Verificacion[])
    }
    setProcesando(null)
  }

  const filtradas = verificaciones.filter((v) => {
    if (filtro !== 'TODAS' && v.estado !== filtro) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return (
        v.usuario.nombre.toLowerCase().includes(q) ||
        v.usuario.apellido.toLowerCase().includes(q) ||
        v.usuario.email.toLowerCase().includes(q) ||
        (v.usuario.cedula || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  const pendientes = verificaciones.filter((v) => v.estado === 'PENDIENTE').length

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8F3DC]">
          <Shield className="h-5 w-5 text-[#1B4332]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Verificaciones de identidad</h1>
          <p className="text-sm text-[#6B6560]">
            {pendientes > 0 ? `${pendientes} pendiente${pendientes > 1 ? 's' : ''} de revisión` : 'Sin verificaciones pendientes'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9892]" />
          <Input
            placeholder="Buscar por nombre, email o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border-[#E8E4DF] pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['TODAS', 'PENDIENTE', 'APROBADA', 'RECHAZADA'].map((f) => (
            <Button
              key={f}
              variant={filtro === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro(f)}
              className={filtro === f ? 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]' : 'border-[#E8E4DF] text-[#6B6560]'}
            >
              {f === 'TODAS' ? 'Todas' : ESTADO_CONFIG[f]?.label || f}
            </Button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Filter className="mb-3 h-10 w-10 text-[#9E9892]" />
          <p className="text-sm text-[#6B6560]">No hay verificaciones para mostrar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((v) => {
            const config = ESTADO_CONFIG[v.estado] || ESTADO_CONFIG.PENDIENTE
            const EstadoIcon = config.icon
            const expandidaCurrent = expandida === v.id
            const esManual = v.metodo === 'MANUAL'
            const tieneFotos = v.foto_frontal_url && v.foto_trasera_url && v.foto_selfie_url
            const esRevisable = v.estado === 'PENDIENTE' || v.estado === 'EN_PROCESO'

            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-[#E8E4DF]">
                  <CardContent className="p-4">
                    <div
                      className="flex cursor-pointer items-center justify-between"
                      onClick={() => setExpandida(expandidaCurrent ? null : v.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F6F3] text-sm font-semibold text-[#1A1A1A]">
                          {v.usuario.nombre.charAt(0)}{v.usuario.apellido.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">
                            {v.usuario.nombre} {v.usuario.apellido}
                          </p>
                          <p className="text-xs text-[#6B6560]">
                            {v.usuario.email}
                            {v.usuario.cedula && ` · ${v.usuario.cedula}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {esManual ? 'Manual' : 'MetaMap'}
                        </Badge>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
                          <EstadoIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                        {expandidaCurrent ? (
                          <ChevronUp className="h-4 w-4 text-[#9E9892]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[#9E9892]" />
                        )}
                      </div>
                    </div>

                    {expandidaCurrent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 space-y-4 border-t border-[#E8E4DF] pt-4"
                      >
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-[#9E9892]">Teléfono:</span>{' '}
                            <span className="text-[#1A1A1A]">{v.usuario.telefono || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[#9E9892]">Cédula:</span>{' '}
                            <span className="text-[#1A1A1A]">{v.usuario.cedula || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[#9E9892]">Método:</span>{' '}
                            <span className="text-[#1A1A1A]">{esManual ? 'Manual' : 'MetaMap'}</span>
                          </div>
                          <div>
                            <span className="text-[#9E9892]">Fecha:</span>{' '}
                            <span className="text-[#1A1A1A]">{new Date(v.fecha_creacion).toLocaleDateString('es-VE')}</span>
                          </div>
                        </div>

                        {esManual && tieneFotos && (
                          <div>
                            <p className="mb-2 text-sm font-medium text-[#1A1A1A]">Documentos subidos:</p>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { url: v.foto_frontal_url!, label: 'Frente' },
                                { url: v.foto_trasera_url!, label: 'Reverso' },
                                { url: v.foto_selfie_url!, label: 'Selfie' },
                              ].map((doc) => (
                                <a
                                  key={doc.label}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative overflow-hidden rounded-lg border border-[#E8E4DF]"
                                >
                                  <img
                                    src={doc.url}
                                    alt={doc.label}
                                    className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-center text-xs text-white">
                                    {doc.label}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {v.motivo_rechazo && (
                          <div className="rounded-lg bg-[#FEE2E2] p-3">
                            <p className="text-xs font-medium text-[#C1121F]">Motivo de rechazo:</p>
                            <p className="text-sm text-[#C1121F]">{v.motivo_rechazo}</p>
                          </div>
                        )}

                        {esRevisable && esManual && (
                          <div className="space-y-3 border-t border-[#E8E4DF] pt-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-[#1A1A1A]">Motivo de rechazo (si aplica):</p>
                              <Textarea
                                placeholder="Ej: La foto del documento es ilegible..."
                                value={motivoRechazo[v.id] || ''}
                                onChange={(e) =>
                                  setMotivoRechazo((prev) => ({ ...prev, [v.id]: e.target.value }))
                                }
                                className="border-[#E8E4DF]"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                className="flex-1 bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                                disabled={procesando === v.id}
                                onClick={() => handleRevisar(v.id, 'APROBADA')}
                              >
                                {procesando === v.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                Aprobar
                              </Button>
                              <Button
                                variant="outline"
                                className="border-[#C1121F] text-[#C1121F] hover:bg-[#FEE2E2]"
                                disabled={procesando === v.id}
                                onClick={() => handleRevisar(v.id, 'RECHAZADA')}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        )}

                        {esRevisable && !esManual && (
                          <div className="rounded-lg bg-[#E0F2FE] p-3">
                            <p className="text-sm text-[#0369A1]">Verificación MetaMap en proceso — se actualizará automáticamente vía webhook.</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
