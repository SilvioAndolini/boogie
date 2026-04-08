'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import BoogieCard from './boogie-card'
import BoogieListItem from './boogie-list-item'

function ShimmerCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E4DF] bg-white">
      <div className="mx-3 mt-3 overflow-hidden rounded-xl">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-[#F0EDE8] to-[#E8E4DF] shimmer" />
      </div>
      <div className="space-y-2.5 px-5 pb-5 pt-3">
        <div className="h-4 w-3/4 rounded-md bg-[#F0EDE8] shimmer" />
        <div className="h-3 w-1/2 rounded-md bg-[#F0EDE8] shimmer" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 w-16 rounded-md bg-[#F0EDE8] shimmer" />
          <div className="h-3 w-12 rounded-md bg-[#F0EDE8] shimmer" />
        </div>
      </div>
    </div>
  )
}

function ShimmerListItem() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#E8E4DF] bg-white px-4 py-3">
      <div className="h-14 w-14 shrink-0 rounded-lg bg-[#F0EDE8] shimmer" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-3/5 rounded-md bg-[#F0EDE8] shimmer" />
        <div className="h-3 w-2/5 rounded-md bg-[#F0EDE8] shimmer" />
      </div>
      <div className="hidden items-center gap-4 sm:flex">
        <div className="h-3 w-6 rounded-md bg-[#F0EDE8] shimmer" />
        <div className="h-3 w-6 rounded-md bg-[#F0EDE8] shimmer" />
        <div className="h-3 w-6 rounded-md bg-[#F0EDE8] shimmer" />
      </div>
      <div className="shrink-0 space-y-1.5 text-right">
        <div className="ml-auto h-4 w-14 rounded-md bg-[#F0EDE8] shimmer" />
        <div className="ml-auto h-3 w-10 rounded-md bg-[#F0EDE8] shimmer" />
      </div>
      <div className="h-8 w-8 shrink-0 rounded-lg bg-[#F0EDE8] shimmer" />
    </div>
  )
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease },
  },
}

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: 0.35, ease },
  },
}

export function BoogieListClient({ propiedades }: { propiedades: Record<string, unknown>[] }) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #F0EDE8 25%, #FDFCFA 37%, #F0EDE8 63%);
          background-size: 800px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
      `}</style>

      <div className="flex items-center justify-between">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-[#6B6560]"
        >
          {propiedades.length} boogie{propiedades.length !== 1 ? 's' : ''}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center gap-1 rounded-lg border border-[#E8E4DF] bg-white p-1"
        >
          <button
            onClick={() => setView('grid')}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              view === 'grid' ? 'bg-[#1B4332] text-white' : 'text-[#6B6560] hover:bg-[#F8F6F3]'
            }`}
            aria-label="Vista cuadrícula"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              view === 'list' ? 'bg-[#1B4332] text-white' : 'text-[#6B6560] hover:bg-[#F8F6F3]'
            }`}
            aria-label="Vista lista"
          >
            <List className="h-4 w-4" />
          </button>
        </motion.div>
      </div>

      {!loaded && view === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ShimmerCard /><ShimmerCard /><ShimmerCard />
        </div>
      )}

      {!loaded && view === 'list' && (
        <div className="space-y-2">
          <ShimmerListItem /><ShimmerListItem /><ShimmerListItem />
        </div>
      )}

      {loaded && (
        <AnimatePresence mode="wait">
          {view === 'grid' ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.2 } }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {propiedades.map((propiedad) => (
                <motion.div
                  key={propiedad.id as string}
                  variants={cardVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <BoogieCard boogie={propiedad} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.2 } }}
              className="space-y-2"
            >
              {propiedades.map((propiedad) => (
                <motion.div
                  key={propiedad.id as string}
                  variants={listItemVariants}
                >
                  <BoogieListItem boogie={propiedad} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  )
}
