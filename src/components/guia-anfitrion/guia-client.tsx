'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ArrowLeft, CheckCircle2, BookOpen, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { GUIA_SECCIONES, type GuiaSeccion, type GuiaContenido } from './guia-data'

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number]

const sidebarVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const sidebarItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function ContenidoBlock({ item }: { item: GuiaContenido }) {
  switch (item.tipo) {
    case 'parrafo':
      return <p className="text-sm leading-relaxed text-[#6B6560]">{item.texto}</p>
    case 'subtitulo':
      return <h3 className="pt-4 text-sm font-bold text-[#1A1A1A]">{item.texto}</h3>
    case 'cita':
      return (
        <blockquote className="border-l-4 border-[#52B788] bg-[#D8F3DC]/30 py-3 pl-4 pr-3 italic text-[#1B4332]">
          {item.texto}
        </blockquote>
      )
    case 'destacado':
      return (
        <div className="rounded-xl border border-[#1B4332]/10 bg-[#1B4332]/[0.03] p-4">
          <p className="text-sm font-medium leading-relaxed text-[#1B4332]">{item.texto}</p>
        </div>
      )
    case 'ejemplo':
      return (
        <div className="rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] p-4 text-sm italic leading-relaxed text-[#6B6560]">
          {item.texto}
        </div>
      )
    case 'lista-si':
      return (
        <div>
          {item.texto && <p className="mb-2 text-sm font-medium text-[#1B4332]">{item.texto}</p>}
          <ul className="space-y-2">
            {item.items?.map((it, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-[#6B6560]">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D8F3DC] text-[10px] font-bold text-[#1B4332]">✓</span>
                <span className="leading-relaxed">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    case 'lista-no':
      return (
        <div>
          {item.texto && <p className="mb-2 text-sm font-medium text-[#991B1B]">{item.texto}</p>}
          <ul className="space-y-2">
            {item.items?.map((it, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-[#6B6560]">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[10px] font-bold text-[#991B1B]">✗</span>
                <span className="leading-relaxed">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    case 'lista':
      return (
        <div>
          {item.texto && <p className="mb-2 text-sm font-medium text-[#1A1A1A]">{item.texto}</p>}
          <ul className="space-y-2">
            {item.items?.map((it, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-[#6B6560]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B4332]" />
                <span className="leading-relaxed">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    default:
      return null
  }
}

function Seccion({ seccion, activa, onToggle }: { seccion: GuiaSeccion; activa: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#E8E4DF] last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#F8F6F3] lg:px-6"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D8F3DC] text-sm">
          {seccion.icono}
        </span>
        <span className={`flex-1 text-sm font-semibold ${activa ? 'text-[#1B4332]' : 'text-[#1A1A1A]'}`}>
          {seccion.titulo}
        </span>
        <motion.div animate={{ rotate: activa ? 180 : 0 }} transition={{ duration: 0.25, ease }}>
          <ChevronDown className="h-4 w-4 text-[#9E9892]" />
        </motion.div>
      </button>
      <AnimatePresence>
        {activa && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-[#F4F1EC] px-5 pb-6 pt-4 lg:px-6">
              {seccion.contenido.map((c, i) => (
                <ContenidoBlock key={i} item={c} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function GuiaAnfitrionClient() {
  const [seccionActiva, setSeccionActiva] = useState<string | null>(GUIA_SECCIONES[0].id)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [lecturas, setLecturas] = useState<string[]>([])

  useEffect(() => {
    const savedLecturas = localStorage.getItem('guia-lecturas')
    if (savedLecturas) setLecturas(JSON.parse(savedLecturas))
  }, [])

  const toggleSeccion = (id: string) => {
    setSeccionActiva(prev => (prev === id ? null : id))
    if (!lecturas.includes(id)) {
      setLecturas(prev => {
        const next = [...prev, id]
        localStorage.setItem('guia-lecturas', JSON.stringify(next))
        return next
      })
    }
  }

  const porcentaje = Math.round((lecturas.length / GUIA_SECCIONES.length) * 100)

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      <div className="sticky top-0 z-50 border-b border-[#E8E4DF] bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#F8F6F3] hover:text-[#1A1A1A]">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-[#D8F3DC] px-3 py-1">
              <BookOpen className="h-3.5 w-3.5 text-[#1B4332]" />
              <span className="text-xs font-bold text-[#1B4332]">{lecturas.length}/{GUIA_SECCIONES.length}</span>
            </div>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-[#E8E4DF]">
              <motion.div
                className="h-full rounded-full bg-[#1B4332]"
                initial={{ width: 0 }}
                animate={{ width: `${porcentaje}%` }}
                transition={{ duration: 0.5, ease }}
              />
            </div>
          </div>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="rounded-lg p-2 text-[#6B6560] hover:bg-[#F8F6F3] lg:hidden"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease }}
            className="fixed inset-x-0 top-16 z-40 overflow-hidden border-b border-[#E8E4DF] bg-[#FEFCF9] lg:hidden"
          >
            <nav className="space-y-1 p-4">
              {GUIA_SECCIONES.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSeccionActiva(s.id); setMobileNavOpen(false) }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    seccionActiva === s.id
                      ? 'bg-[#D8F3DC] text-[#1B4332]'
                      : 'text-[#6B6560] hover:bg-[#F8F6F3] hover:text-[#1A1A1A]'
                  }`}
                >
                  <span>{s.icono}</span>
                  <span className="flex-1 text-left">{s.titulo}</span>
                  {lecturas.includes(s.id) && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#52B788]" />
                  )}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden lg:block">
          <motion.nav
            className="sticky top-20 w-60 space-y-1"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
          >
            {GUIA_SECCIONES.map(s => (
              <motion.div key={s.id} variants={sidebarItemVariants}>
                <button
                  onClick={() => setSeccionActiva(s.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    seccionActiva === s.id
                      ? 'bg-[#D8F3DC] text-[#1B4332]'
                      : lecturas.includes(s.id)
                        ? 'text-[#1B4332] hover:bg-[#F8F6F3]'
                        : 'text-[#6B6560] hover:bg-[#F8F6F3] hover:text-[#1A1A1A]'
                  }`}
                >
                  <span className="text-base">{s.icono}</span>
                  <span className="flex-1 text-left">{s.titulo}</span>
                  {lecturas.includes(s.id) && seccionActiva !== s.id && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#52B788]" />
                  )}
                </button>
              </motion.div>
            ))}
          </motion.nav>
        </aside>

        <main className="flex-1 min-w-0">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
            <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
              <div className="absolute bottom-4 right-20 h-20 w-20 rounded-full bg-white/[0.03]" />
              <div className="relative flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Guía para tener un Boogie exitoso
                  </h1>
                  <p className="text-sm text-white/70">
                    Todo lo que necesitas saber para triunfar como anfitrión
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="overflow-hidden rounded-xl border border-[#E8E4DF] bg-white">
            {GUIA_SECCIONES.map(seccion => (
              <Seccion
                key={seccion.id}
                seccion={seccion}
                activa={seccionActiva === seccion.id}
                onToggle={() => toggleSeccion(seccion.id)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
