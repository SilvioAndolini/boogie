'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LayoutDashboard, Home, CalendarCheck, Wallet, Plus, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const ACCESOS_RAPIDOS = [
  {
    titulo: 'Mis Boogies',
    descripcion: 'Gestiona tus espacios publicados',
    href: '/dashboard/mis-propiedades',
    icon: Home,
    color: { bg: 'bg-[#D8F3DC]', icon: 'text-[#1B4332]' },
  },
  {
    titulo: 'Mis Reservas',
    descripcion: 'Revisa tus reservas activas',
    href: '/dashboard/mis-reservas',
    icon: CalendarCheck,
    color: { bg: 'bg-[#E0F2FE]', icon: 'text-[#0369A1]' },
  },
  {
    titulo: 'Pagos',
    descripcion: 'Consulta tu historial de pagos',
    href: '/dashboard/pagos',
    icon: Wallet,
    color: { bg: 'bg-[#FEF3C7]', icon: 'text-[#92400E]' },
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const cardContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

export default function DashboardPage() {
  return (
    <div>
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute bottom-4 right-20 h-20 w-20 rounded-full bg-white/[0.03]" />

          <div className="relative flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Dashboard</h1>
              <p className="text-sm text-white/70">Bienvenido a tu panel de control</p>
            </div>
            <div className="hidden shrink-0 sm:block">
              <Link href="/dashboard/mis-propiedades/nueva">
                <Button className="gap-2 bg-white text-[#1B4332] hover:bg-[#D8F3DC]">
                  <Plus className="h-4 w-4" />
                  Publicar boogie
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Link href="/dashboard/mis-propiedades/nueva" className="block sm:hidden">
          <Button className="w-full gap-2 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
            <Plus className="h-4 w-4" />
            Publicar boogie
          </Button>
        </Link>
      </motion.div>

      <motion.div
        className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {ACCESOS_RAPIDOS.map((acceso) => {
          const Icon = acceso.icon
          return (
            <motion.div key={acceso.href} variants={cardVariants}>
              <Link href={acceso.href} className="group block">
                <Card className="border-[#E8E4DF] transition-all hover:border-[#52B788] hover:shadow-md">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${acceso.color.bg}`}>
                      <Icon className={`h-5 w-5 ${acceso.color.icon}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-[#1A1A1A]">{acceso.titulo}</h3>
                      <p className="mt-0.5 text-xs text-[#6B6560]">{acceso.descripcion}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#9E9892] transition-colors group-hover:text-[#1B4332]" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Link href="/dashboard/verificar-identidad" className="group block">
          <Card className="border-[#FEF3C7] bg-[#FEF3C7]/20 transition-all hover:border-[#92400E] hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7]">
                <Shield className="h-5 w-5 text-[#92400E]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">Verificar identidad</h3>
                  <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#92400E]">
                    Pendiente
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#6B6560]">Verifica tu identidad para reservar y publicar</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#9E9892] transition-colors group-hover:text-[#1B4332]" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </div>
  )
}
