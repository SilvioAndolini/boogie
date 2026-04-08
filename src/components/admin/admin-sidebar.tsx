'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  CreditCard,
  FileCheck,
  Users,
  Star,
  Wallet,
  ScrollText,
  Settings,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import { getAdminCounts } from '@/actions/verificacion.actions'
import { AdminBadgeCount } from './admin-badge-count'

interface AdminLink {
  href: string
  label: string
  icon: React.ElementType
  badgeKey?: 'verificacionesPendientes' | 'reservasPendientes' | 'pagosPendientes'
}

const ADMIN_LINKS: AdminLink[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/propiedades', label: 'Boogies', icon: Building2 },
  { href: '/admin/reservas', label: 'Reservas', icon: CalendarDays, badgeKey: 'reservasPendientes' },
  { href: '/admin/pagos', label: 'Pagos', icon: CreditCard, badgeKey: 'pagosPendientes' },
  { href: '/admin/verificaciones', label: 'Verificaciones', icon: FileCheck, badgeKey: 'verificacionesPendientes' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/resenas', label: 'Reseñas', icon: Star },
  { href: '/admin/wallets', label: 'Wallets', icon: Wallet },
  { href: '/admin/auditoria', label: 'Auditoría', icon: ScrollText },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const [counts, setCounts] = useState<{ verificacionesPendientes: number; reservasPendientes: number; pagosPendientes: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    getAdminCounts().then((res) => {
      if (cancelled) return
      if (res && 'verificacionesPendientes' in res) {
        setCounts({
          verificacionesPendientes: res.verificacionesPendientes as number,
          reservasPendientes: res.reservasPendientes as number,
          pagosPendientes: res.pagosPendientes as number,
        })
      }
    })
    const interval = setInterval(() => {
      getAdminCounts().then((res) => {
        if (cancelled) return
        if (res && 'verificacionesPendientes' in res) {
          setCounts({
            verificacionesPendientes: res.verificacionesPendientes as number,
            reservasPendientes: res.reservasPendientes as number,
            pagosPendientes: res.pagosPendientes as number,
          })
        }
      })
    }, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center gap-2.5 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D8F3DC]">
          <Shield className="h-4 w-4 text-[#1B4332]" />
        </div>
        <span className="text-sm font-bold text-[#1B4332]">Admin Panel</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto rounded-lg p-1 text-[#9E9892] hover:text-[#1A1A1A]">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {ADMIN_LINKS.map((link) => {
          const isActive = link.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(link.href)
          const Icon = link.icon
          const badgeCount = link.badgeKey && counts ? counts[link.badgeKey] : 0

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#D8F3DC] text-[#1B4332]'
                  : 'text-[#6B6560] hover:bg-[#F8F6F3] hover:text-[#1A1A1A]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#1B4332]' : ''}`} />
              <span className="flex-1">{link.label}</span>
              <AdminBadgeCount count={badgeCount} />
            </Link>
          )
        })}
      </nav>

      <div className="mt-4 border-t border-[#E8E4DF] px-3 pt-4">
        <p className="text-[10px] text-[#9E9892]">Boogie Admin v1.0</p>
      </div>
    </div>
  )
}

export function AdminSidebarDesktop() {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 w-56">
        <SidebarContent />
      </div>
    </aside>
  )
}

export function AdminSidebarMobile() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#F8F6F3] lg:hidden"
      >
        <Menu className="h-4 w-4" />
        Menú
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-[#E8E4DF] bg-[#FEFCF9] p-4 lg:hidden"
            >
              <SidebarContent onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
