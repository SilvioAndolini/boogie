'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { PropertyGrid } from './property-grid'
import { PropertyMap } from './property-map'
import { FilterPanel } from './filter-bar'
import type { PropiedadCard } from './property-card'
import type { PropiedadMapa } from './property-map'

interface PropiedadesLayoutProps {
  propiedades: PropiedadCard[]
  propiedadesMapa: PropiedadMapa[]
  total: number
  centerLat?: number
  centerLng?: number
  locationName?: string
}

const ease = [0.25, 0.1, 0.25, 1] as const

function SeparatorButton({
  direction,
  onClick,
  label,
}: {
  direction: 'left' | 'right'
  onClick: () => void
  label: string
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight

  return (
    <div className="relative flex h-full w-10 shrink-0 flex-col items-center justify-center">
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#D0CBC4] to-transparent" />
      <motion.button
        onClick={onClick}
        className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#D0CBC4] bg-white text-[#6B6560] shadow-sm transition-colors duration-300 hover:border-[#1B4332] hover:bg-[#1B4332] hover:text-white hover:shadow-md"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={label}
      >
        <Icon className="h-4 w-4" />
      </motion.button>
      <span className="relative z-10 mt-1.5 whitespace-nowrap rounded-full border border-[#E8E4DF] bg-white px-2 py-0.5 text-[9px] font-medium text-[#6B6560] shadow-sm">
        {label}
      </span>
    </div>
  )
}

export function PropiedadesLayout({
  propiedades,
  propiedadesMapa,
  total,
  centerLat,
  centerLng,
  locationName,
}: PropiedadesLayoutProps) {
  const [mapFullscreen, setMapFullscreen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const toggleMap = useCallback(() => setMapFullscreen((v) => !v), [])
  const toggleFilters = useCallback(() => setFiltersOpen((v) => !v), [])

  return (
    <>
      <div className="hidden xl:flex xl:flex-row-reverse">
        <div className="sticky top-16 h-[calc(100vh-4rem)] flex-1">
          <PropertyMap propiedades={propiedadesMapa} centerLat={centerLat} centerLng={centerLng} />
        </div>

        <AnimatePresence>
          {!mapFullscreen && (
            <motion.div
              key="list-panel"
              className="flex h-[calc(100vh-4rem)] shrink-0 flex-col"
              style={{ width: 'calc(62% - 40px)' }}
              initial={false}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ duration: 0.5, ease }}
            >
              <div className="flex items-center border-b border-[#E8E4DF] bg-white px-4 py-2">
                <motion.button
                  onClick={toggleFilters}
                  className={`mr-3 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors duration-200 ${
                    filtersOpen
                      ? 'border-[#1B4332] bg-[#1B4332] text-white'
                      : 'border-[#E8E4DF] bg-white text-[#6B6560] hover:border-[#1B4332] hover:text-[#1B4332]'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filtros
                </motion.button>
                <h1 className="text-sm font-bold text-[#1A1A1A]">
                  Propiedades disponibles
                </h1>
                <span className="ml-2 text-xs text-[#6B6560]">
                  {total} resultado{total !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex min-h-0 flex-1">
                <AnimatePresence initial={false}>
                  {filtersOpen && (
                    <motion.div
                      key="filter-sidebar"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 240, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="h-full shrink-0 overflow-hidden border-r border-[#E8E4DF] bg-white"
                    >
                      <div style={{ width: 240 }} className="h-full">
                        <FilterPanel onClose={() => setFiltersOpen(false)} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="min-w-0 flex-1 overflow-y-auto bg-[#FEFCF9]">
                  <section className="px-6 py-6 lg:px-8">
                    <PropertyGrid propiedades={propiedades} />
                  </section>
                </div>

                <SeparatorButton
                  direction="left"
                  onClick={toggleMap}
                  label="Mapa"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {mapFullscreen && (
        <motion.div
          className="fixed top-16 bottom-0 left-0 z-50 hidden items-center bg-white/95 backdrop-blur-sm border-r border-[#E8E4DF] shadow-[4px_0_24px_-4px_rgba(0,0,0,0.08)] xl:flex"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease }}
        >
          <SeparatorButton
            direction="right"
            onClick={toggleMap}
            label="Lista"
          />
        </motion.div>
      )}

      <div className="block xl:hidden">
        <div className="flex items-center border-b border-[#E8E4DF] bg-white px-4 py-2 sm:px-6">
          <h1 className="text-sm font-bold text-[#1A1A1A]">
            Propiedades disponibles
          </h1>
          <span className="ml-2 text-xs text-[#6B6560]">
            {total} resultado{total !== 1 ? 's' : ''}
          </span>
          <div className="ml-auto">
            <motion.button
              onClick={toggleFilters}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors duration-200 ${
                filtersOpen
                  ? 'border-[#1B4332] bg-[#1B4332] text-white'
                  : 'border-[#E8E4DF] bg-white text-[#6B6560] hover:border-[#1B4332] hover:text-[#1B4332]'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              key="mobile-filters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="overflow-hidden border-b border-[#E8E4DF] bg-white"
            >
              <div className="max-h-[50vh] overflow-y-auto">
                <FilterPanel onClose={() => setFiltersOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <PropertyGrid propiedades={propiedades} />
        </section>
      </div>
    </>
  )
}
