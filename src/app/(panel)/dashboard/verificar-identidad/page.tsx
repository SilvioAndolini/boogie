'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Scan, Camera, Upload, X, Loader2, CheckCircle2, Clock, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  iniciarVerificacionMetaMap,
  subirDocumentoManual,
  getVerificacionUsuario,
} from '@/actions/verificacion.actions'

type Metodo = 'metamap' | 'manual' | null

const METAMAP_CLIENT_ID = process.env.NEXT_PUBLIC_METAMAP_CLIENT_ID || ''
const METAMAP_FLOW_ID = process.env.NEXT_PUBLIC_METAMAP_FLOW_ID || ''

declare global {
  interface Window {
    MetaMap: {
      start: (config: {
        clientId: string
        flowId: string
        metadata: { key: string; value: string }[]
        buttonId?: string
      }) => { show: () => void }
    }
  }
}

function loadMetaMapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.MetaMap) { resolve(); return }
    const existing = document.querySelector('script[src*="metamap"]') || document.querySelector('script[src*="mati"]')
    if (existing) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://cdn.getmati.com/mati.min.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load MetaMap SDK'))
    document.head.appendChild(script)
  })
}

export default function VerificarIdentidadPage() {
  const router = useRouter()
  const [metodo, setMetodo] = useState<Metodo>(null)
  const [verificacion, setVerificacion] = useState<Record<string, unknown> | null>(null)
  const [cargando, setCargando] = useState(true)
  const [enviandoManual, setEnviandoManual] = useState(false)
  const [optimizando, setOptimizando] = useState(false)

  const [fotos, setFotos] = useState<{ frontal: File | null; trasera: File | null; selfie: File | null }>({
    frontal: null,
    trasera: null,
    selfie: null,
  })
  const [previews, setPreviews] = useState<{ frontal: string | null; trasera: string | null; selfie: string | null }>({
    frontal: null,
    trasera: null,
    selfie: null,
  })

  const fileInputRefs = {
    frontal: useRef<HTMLInputElement>(null),
    trasera: useRef<HTMLInputElement>(null),
    selfie: useRef<HTMLInputElement>(null),
  }

  useEffect(() => {
    getVerificacionUsuario().then((res) => {
      if ('verificacion' in res && res.verificacion) {
        setVerificacion(res.verificacion as Record<string, unknown>)
      }
      setCargando(false)
    })
  }, [])

  useEffect(() => {
    const urls = previews
    return () => {
      Object.values(urls).forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [])

  const handleMetaMap = async () => {
    setCargando(true)
    try {
      const res = await iniciarVerificacionMetaMap()
      if (res.error) {
        toast.error(res.error)
        setCargando(false)
        return
      }

      if ('verificacion' in res && res.verificacion) {
        const verif = res.verificacion as Record<string, unknown>
        setVerificacion(verif)

        if (!METAMAP_CLIENT_ID) {
          toast.error('MetaMap no está configurado. Usa verificación manual.')
          setCargando(false)
          return
        }

        try {
          await loadMetaMapScript()

          const config: Record<string, unknown> = {
            clientId: METAMAP_CLIENT_ID,
            metadata: [
              { key: 'userId', value: verif.usuario_id as string },
              { key: 'verificationId', value: verif.id as string },
            ],
          }
          if (METAMAP_FLOW_ID) config.flowId = METAMAP_FLOW_ID

          const mm = window.MetaMap.start(config as Parameters<typeof window.MetaMap.start>[0])
          mm.show()
          toast.success('Completa la verificación en la ventana de MetaMap')
        } catch {
          toast.error('No se pudo iniciar MetaMap. Usa verificación manual.')
        }
      }
    } finally {
      setCargando(false)
    }
  }

  const optimizeAndPreview = useCallback(async (file: File, key: 'frontal' | 'trasera' | 'selfie') => {
    setOptimizando(true)

    const canvas = document.createElement('canvas')
    const img = new Image()
    const url = URL.createObjectURL(file)

    await new Promise<void>((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(url)
        let { width, height } = img
        const maxDim = 1600
        if (width > maxDim) { height = (height * maxDim) / width; width = maxDim }
        if (height > maxDim) { width = (width * maxDim) / height; height = maxDim }

        canvas.width = Math.round(width)
        canvas.height = Math.round(height)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimized = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now(),
              })
              setFotos((prev) => ({ ...prev, [key]: optimized }))
              const previewUrl = URL.createObjectURL(blob)
              setPreviews((prev) => {
                if (prev[key]) URL.revokeObjectURL(prev[key]!)
                return { ...prev, [key]: previewUrl }
              })
            }
            resolve()
          },
          'image/webp',
          0.85
        )
      }
      img.src = url
    })

    setOptimizando(false)
  }, [])

  const handleManualSubmit = async () => {
    if (!fotos.frontal || !fotos.trasera || !fotos.selfie) {
      toast.error('Debes subir las 3 fotos')
      return
    }

    setEnviandoManual(true)
    try {
      const formData = new FormData()
      formData.append('fotoFrontal', fotos.frontal)
      formData.append('fotoTrasera', fotos.trasera)
      formData.append('fotoSelfie', fotos.selfie)

      const res = await subirDocumentoManual(formData)
      if (res.error) {
        toast.error(res.error)
        return
      }

      toast.success('Documentos enviados. Un administrador los revisará.')
      if ('verificacion' in res && res.verificacion) {
        setVerificacion(res.verificacion as Record<string, unknown>)
      }
    } finally {
      setEnviandoManual(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  const estadoVerif = verificacion?.estado as string | undefined

  if (estadoVerif === 'APROBADA') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D8F3DC]">
            <CheckCircle2 className="h-10 w-10 text-[#1B4332]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Identidad verificada</h1>
          <p className="text-sm text-[#6B6560]">Tu identidad ha sido verificada correctamente.</p>
          <Button onClick={() => router.push('/dashboard')} className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
            Volver al dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (estadoVerif === 'PENDIENTE' || estadoVerif === 'EN_PROCESO') {
    const esManual = verificacion?.metodo === 'MANUAL'
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEF9E7]">
            <Clock className="h-10 w-10 text-[#B8860B]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Verificación en proceso</h1>
          <p className="max-w-md text-sm text-[#6B6560]">
            {esManual
              ? 'Tus documentos están siendo revisados por un administrador. Te notificaremos el resultado.'
              : 'MetaMap está procesando tu verificación. Te notificaremos cuando esté lista.'}
          </p>
          <Button variant="outline" className="border-[#E8E4DF]" onClick={() => router.push('/dashboard')}>
            Volver al dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (estadoVerif === 'RECHAZADA') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]">
            <AlertCircle className="h-10 w-10 text-[#C1121F]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Verificación rechazada</h1>
          <p className="max-w-md text-sm text-[#6B6560]">
            {(verificacion?.motivo_rechazo as string) || 'Tu verificación fue rechazada. Puedes intentarlo de nuevo.'}
          </p>
          <Button className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]" onClick={() => { setVerificacion(null); setMetodo(null) }}>
            Intentar de nuevo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-[#6B6560]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Verificar identidad</h1>
          <p className="text-sm text-[#6B6560]">Verifica tu identidad para reservar y publicar</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!metodo && (
          <motion.div
            key="seleccion"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            <p className="mb-6 text-sm text-[#6B6560]">
              Elige un método para verificar tu identidad. Recomendamos la verificación automatizada con MetaMap.
            </p>

            <Card
              className="cursor-pointer border-[#E8E4DF] transition-all hover:border-[#52B788] hover:shadow-md"
              onClick={handleMetaMap}
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D8F3DC]">
                  <Scan className="h-6 w-6 text-[#1B4332]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1A1A1A]">Verificación con MetaMap</h3>
                  <p className="mt-1 text-sm text-[#6B6560]">
                    Verificación automatizada con IA. Toma fotos de tu documento y un selfie. Resultado en minutos.
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-[#D8F3DC] px-2.5 py-0.5 text-xs font-medium text-[#1B4332]">
                    Recomendado
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-[#E8E4DF] transition-all hover:border-[#52B788] hover:shadow-md"
              onClick={() => setMetodo('manual')}
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F8F6F3]">
                  <Camera className="h-6 w-6 text-[#6B6560]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1A1A1A]">Verificación manual</h3>
                  <p className="mt-1 text-sm text-[#6B6560]">
                    Sube fotos de tu documento de identidad. Un administrador las revisará manualmente.
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-[#F8F6F3] px-2.5 py-0.5 text-xs font-medium text-[#6B6560]">
                    Revisión manual
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {metodo === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <Card className="border-[#E8E4DF]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-[#52B788]" />
                  Sube tu documento de identidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(
                  [
                    { key: 'frontal' as const, label: 'Frente del documento', desc: 'Foto frontal de tu cédula o pasaporte' },
                    { key: 'trasera' as const, label: 'Reverso del documento', desc: 'Foto del reverso (si aplica)' },
                    { key: 'selfie' as const, label: 'Selfie con documento', desc: 'Foto tuya sosteniendo el documento' },
                  ] as const
                ).map(({ key, label, desc }) => (
                  <div key={key} className="space-y-2">
                    <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
                    <p className="text-xs text-[#6B6560]">{desc}</p>
                    <div
                      onClick={() => !optimizando && fileInputRefs[key].current?.click()}
                      className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#E8E4DF] bg-[#FDFCFA] transition-colors hover:border-[#52B788] hover:bg-[#F8F6F3]"
                      style={{ minHeight: previews[key] ? 'auto' : '160px' }}
                    >
                      {previews[key] ? (
                        <div className="relative w-full">
                          <img src={previews[key]!} alt={label} className="h-48 w-full object-contain" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFotos((prev) => ({ ...prev, [key]: null }))
                              if (previews[key]) URL.revokeObjectURL(previews[key]!)
                              setPreviews((prev) => ({ ...prev, [key]: null }))
                            }}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-6">
                          {optimizando ? (
                            <Loader2 className="h-6 w-6 animate-spin text-[#52B788]" />
                          ) : (
                            <Upload className="h-6 w-6 text-[#9E9892]" />
                          )}
                          <span className="text-xs text-[#6B6560]">
                            {optimizando ? 'Optimizando...' : 'Clic para subir'}
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRefs[key]}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) optimizeAndPreview(file, key)
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="border-[#E8E4DF]" onClick={() => setMetodo(null)}>
                Volver
              </Button>
              <Button
                className="flex-1 bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                onClick={handleManualSubmit}
                disabled={enviandoManual || !fotos.frontal || !fotos.trasera || !fotos.selfie}
              >
                {enviandoManual ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  'Enviar documentos'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
