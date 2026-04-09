'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CreditCard, Shield, ChevronRight, Sparkles, Home, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const PASOS = [
  {
    icon: Search,
    titulo: 'Busca',
    subtitulo: 'Encuentra tu lugar',
    descripcion: 'Explora alojamientos en toda Venezuela. Filtra por ubicación, precio y amenidades para encontrar el espacio perfecto para ti.',
    detalle: 'Navega por nuestro catálogo con fotos reales, reseñas verificadas y filtros inteligentes que te ayudan a encontrar exactamente lo que necesitas.',
    color: 'from-[#D8F3DC] to-[#B7E4C7]',
    accent: '#52B788',
  },
  {
    icon: CreditCard,
    titulo: 'Reserva',
    subtitulo: 'Asegura tu espacio',
    descripcion: 'Elige tu lugar ideal y paga con el método que prefieras: Pago Móvil, Zelle, USDT y más.',
    detalle: 'Sin complicaciones. Pagos seguros, confirmación inmediata y comunicación directa con el anfitrión desde el momento de la reserva.',
    color: 'from-[#B7E4C7] to-[#95D5B2]',
    accent: '#40916C',
  },
  {
    icon: Shield,
    titulo: 'Disfruta',
    subtitulo: 'Vive la experiencia',
    descripcion: 'Llega a tu destino y vive una experiencia única. Tu hogar lejos de casa te espera.',
    detalle: 'Desde el check-in hasta el check-out, todo está pensado para que tu estancia sea perfecta. Soporte 24/7 si lo necesitas.',
    color: 'from-[#95D5B2] to-[#74C69D]',
    accent: '#2D6A4F',
  },
]

export function StepsSection() {
  const [pasoActivo, setPasoActivo] = useState(0)
  const paso = PASOS[pasoActivo]
  const ZIcon = paso.icon

  return (
    <section className="relative py-20 lg:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D8F3DC] bg-[#D8F3DC]/30 px-4 py-1.5 text-sm font-medium text-[#1B4332]">
            <Sparkles className="h-3.5 w-3.5" />
            Simple y rápido
          </div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] lg:text-4xl">Cómo funciona Boogie</h2>
          <p className="mx-auto mt-3 max-w-lg text-[#6B6560]">Tres pasos para convertir tu próximo viaje en una experiencia inolvidable</p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 items-start gap-8 lg:mt-20 lg:grid-cols-5 lg:gap-12">
          <div className="flex flex-row justify-center gap-3 lg:col-span-2 lg:flex-col lg:justify-start lg:gap-4 lg:pt-4">
            {PASOS.map((p, i) => {
              const Icon = p.icon
              const isActive = i === pasoActivo
              const isDone = i < pasoActivo
              return (
                <motion.button
                  key={p.titulo}
                  onClick={() => setPasoActivo(i)}
                  className={`group flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all lg:px-5 lg:py-5 ${
                    isActive
                      ? 'border-[#1B4332] bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/20'
                      : isDone
                        ? 'border-[#D8F3DC] bg-[#D8F3DC]/30 text-[#1B4332]'
                        : 'border-[#E8E4DF] bg-white text-[#1A1A1A] hover:border-[#D8F3DC]'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isActive ? 'bg-white/20' : isDone ? 'bg-[#1B4332]/10' : 'bg-[#D8F3DC]'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#1B4332]'}`} />
                  </div>
                  <div className="hidden min-w-0 lg:block">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white/60' : 'text-[#9E9892]'}`}>
                        Paso {i + 1}
                      </span>
                      {isDone && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs text-[#52B788]"
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>
                    <div className={`text-base font-semibold ${isActive ? 'text-white' : ''}`}>
                      {p.titulo}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-white/70' : 'text-[#6B6560]'}`}>
                      {p.subtitulo}
                    </div>
                  </div>
                  <div className="lg:hidden text-sm font-semibold">{p.titulo}</div>
                </motion.button>
              )
            })}
          </div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={pasoActivo}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden rounded-3xl border border-[#E8E4DF] bg-white shadow-xl shadow-black/5"
              >
                <div className={`bg-gradient-to-r ${paso.color} px-8 py-10 sm:px-12`}>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/30 backdrop-blur-sm">
                      <ZIcon className="h-7 w-7 text-[#1B4332]" />
                    </div>
                    <div>
                      <span className="text-sm font-bold uppercase tracking-wider text-[#1B4332]/60">
                        Paso {pasoActivo + 1}
                      </span>
                      <h3 className="text-2xl font-bold text-[#1A1A1A]">{paso.titulo}</h3>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-8 sm:px-12">
                  <p className="text-lg font-medium text-[#1A1A1A]">{paso.descripcion}</p>
                  <p className="mt-4 text-[#6B6560] leading-relaxed">{paso.detalle}</p>

                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex gap-2">
                      {PASOS.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === pasoActivo ? 'w-8 bg-[#1B4332]' : i < pasoActivo ? 'w-4 bg-[#52B788]' : 'w-4 bg-[#E8E4DF]'
                          }`}
                        />
                      ))}
                    </div>

                    {pasoActivo < PASOS.length - 1 ? (
                      <motion.button
                        onClick={() => setPasoActivo(pasoActivo + 1)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </motion.button>
                    ) : (
                      <Link
                        href="/propiedades"
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
                      >
                        Explorar Boogies
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          className="relative mt-20 rounded-3xl border border-[#E8E4DF] bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] p-8 sm:p-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 z-0" aria-hidden="true">
            <div className="glow-float-a h-64 w-64 rounded-full bg-[#52B788]/20 blur-3xl" />
          </div>
          <div className="pointer-events-none absolute -bottom-12 -left-12 z-0" aria-hidden="true">
            <div className="glow-float-b h-48 w-48 rounded-full bg-[#95D5B2]/15 blur-3xl" style={{ animationDelay: '-5s' }} />
          </div>

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                <Home className="h-3.5 w-3.5" />
                Para anfitriones
              </div>
              <h3 className="text-2xl font-bold text-white sm:text-3xl">
                ¿Tienes un espacio para compartir?
              </h3>
              <p className="mt-3 max-w-xl text-[#D8F3DC]/80 leading-relaxed">
                Convierte tu espacio en un Boogie exitoso. Aprende todo lo que necesitas saber para destacar como anfitrión, desde la calidad hasta el marketing.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-2 lg:items-end">
              <Link
                href="/guia-anfitrion"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#1B4332] shadow-lg transition-all hover:bg-[#D8F3DC] hover:shadow-xl"
              >
                <Sparkles className="h-4 w-4" />
                Aprende a tener un Boogie exitoso
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/mis-propiedades/nueva"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Publicar mi espacio
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
