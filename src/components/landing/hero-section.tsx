'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SearchBar } from '@/components/busqueda/search-bar'
import { SearchModeToggle } from '@/components/busqueda/search-mode-toggle'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ZONAS } from '@/lib/zonas'
import type { SearchMode } from '@/lib/constants'

export function HeroSection() {
  const [searchMode, setSearchMode] = useState<SearchMode>('estandar')

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
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

        <motion.div
          className="mt-12 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <SearchModeToggle mode={searchMode} onChange={setSearchMode} />
          <SearchBar mode={searchMode} />
        </motion.div>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {ZONAS.map((zona) => {
            const ZIcon = zona.Icon
            return (
              <Link
                key={zona.slug}
                href={`/zonas/${zona.slug}`}
                className="group flex items-center gap-2 rounded-full border border-[#E8E4DF] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-all hover:border-[#52B788] hover:shadow-sm"
              >
                <ZIcon className="h-4 w-4 text-[#1B4332] transition-transform group-hover:scale-110" />
                {zona.nombre}
              </Link>
            )
          })}
        </motion.div>

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
