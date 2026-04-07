'use client'

import { motion } from 'framer-motion'
import { SearchBar } from '@/components/busqueda/search-bar'
import {
  Palmtree,
  Mountain,
  Waves,
  Building2,
  Tent,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

const ZONAS_DESTACADAS = [
  { nombre: 'Margarita', slug: 'nueva-esparta', Icon: Palmtree },
  { nombre: 'Mérida', slug: 'merida', Icon: Mountain },
  { nombre: 'Los Roques', slug: 'distrito-capital', Icon: Waves },
  { nombre: 'Caracas', slug: 'distrito-capital', Icon: Building2 },
  { nombre: 'Canaima', slug: 'bolivar', Icon: Tent },
  { nombre: 'Choroní', slug: 'aragua', Icon: Waves },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FEFCF9] to-white">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#D8F3DC]/40 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-[300px] w-[400px] rounded-full bg-[#1B4332]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
        {/* Hero text */}
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-5xl lg:text-6xl">
            Vayas donde vayas,{' '}
            <span className="text-[#1B4332]">boogie</span>{' '}
            nunca falla
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#6B6560]">
            Encuentra alojamientos increíbles en los destinos más hermosos del
            país. Reserva de forma segura con métodos de pago locales.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <SearchBar />
        </motion.div>

        {/* Quick destination chips */}
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {ZONAS_DESTACADAS.map((zona) => {
            const ZIcon = zona.Icon
            return (
              <Link
                key={zona.nombre}
                href={`/zonas/${zona.slug}`}
                className="group flex items-center gap-2 rounded-full border border-[#E8E4DF] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-all hover:border-[#52B788] hover:shadow-sm"
              >
                <ZIcon className="h-4 w-4 text-[#1B4332] transition-transform group-hover:scale-110" />
                {zona.nombre}
              </Link>
            )
          })}
        </motion.div>

        {/* Explore CTA */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Link
            href="/zonas"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4332] transition-colors hover:text-[#2D6A4F]"
          >
            Explorar todos los destinos
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
