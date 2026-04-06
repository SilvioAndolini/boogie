'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LayoutDashboard, Home, CalendarCheck, Wallet, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const ACCESOS_RAPIDOS = [
  {
    titulo: 'Mis Propiedades',
    descripcion: 'Gestiona tus espacios publicados',
    href: '/dashboard/mis-propiedades',
    icon: Home,
  },
  {
    titulo: 'Mis Reservas',
    descripcion: 'Revisa tus reservas activas',
    href: '/dashboard/mis-reservas',
    icon: CalendarCheck,
  },
  {
    titulo: 'Pagos',
    descripcion: 'Consulta tu historial de pagos',
    href: '/dashboard/pagos',
    icon: Wallet,
  },
]

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
}

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8F3DC]">
            <LayoutDashboard className="h-5 w-5 text-[#1B4332]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
            <p className="text-sm text-[#6B6560]">Bienvenido a tu panel de control</p>
          </div>
        </div>
      </motion.div>

      {/* Quick action */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Link href="/dashboard/mis-propiedades/nueva">
          <Button className="gap-2 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
            <Plus className="h-4 w-4" />
            Publicar nueva propiedad
          </Button>
        </Link>
      </motion.div>

      {/* Quick access cards */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {ACCESOS_RAPIDOS.map((acceso) => {
          const Icon = acceso.icon
          return (
            <motion.div key={acceso.href} variants={cardVariants}>
              <Link href={acceso.href}>
                <Card className="border-[#E8E4DF] transition-all hover:border-[#52B788] hover:shadow-md">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D8F3DC]">
                      <Icon className="h-5 w-5 text-[#1B4332]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A1A1A]">{acceso.titulo}</h3>
                      <p className="mt-0.5 text-sm text-[#6B6560]">{acceso.descripcion}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
