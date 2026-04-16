'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  User,
  LayoutDashboard,
  TrendingUp,
  CalendarDays,
  Home,
  Settings,
  LogOut,
  ChevronRight,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimatePresence, motion } from 'framer-motion'
import { cerrarSesion } from '@/actions/auth.actions'
import { useUnreadCount } from '@/hooks/use-unread-count'

interface CotizacionData {
  tasa: number
  fuente: string
}

interface UsuarioData {
  id: string
  nombre: string
  apellido: string
  email: string
  avatar_url: string
}

export function NavbarInner({
  cotizacionEuro,
  usuario,
  children,
}: {
  cotizacionEuro: CotizacionData | null
  usuario: UsuarioData | null
  children?: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname = usePathname()
  const isPropiedades = pathname.startsWith('/propiedades') || pathname.startsWith('/canchas')
  const { count: unreadCount } = useUnreadCount()

  const tasaFormateada = cotizacionEuro
    ? cotizacionEuro.tasa.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8E4DF] bg-white/80 backdrop-blur-lg overflow-visible">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-4 sm:h-[105px] sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1B4332]">
            <span className="text-xl font-bold text-white">B</span>
          </div>
          <span className="text-2xl font-bold text-[#1A1A1A]">Boogie</span>
        </Link>

        {!isPropiedades && (
          <nav className="hidden items-center gap-8 sm:flex">
            <Link
              href="/propiedades"
              className="text-base font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
            >
              Buscar
            </Link>
            <Link
              href="/canchas"
              className="text-base font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
            >
              Sports
            </Link>
            <Link
              href="/zonas"
              className="text-base font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
            >
              Zonas
            </Link>
            <Link
              href="/nosotros"
              className="text-base font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
            >
              Nosotros
            </Link>
          </nav>
        )}

        {children}

        <div className="flex shrink-0 items-center gap-4">
          {cotizacionEuro && tasaFormateada && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#D8F3DC] bg-[#D8F3DC]/40 px-3 py-1.5 text-xs text-[#1B4332]">
              <TrendingUp className="h-4 w-4 text-[#2D6A4F]" />
              <span className="font-medium">1 EUR</span>
              <span className="text-[#6B6560]">=</span>
              <span className="font-semibold">Bs. {tasaFormateada}</span>
              <span className="text-[#6B6560]">({cotizacionEuro.fuente})</span>
            </div>
          )}
          {usuario && (
            <Link
              href="/dashboard/mensajes"
              className="relative hidden sm:flex items-center justify-center h-10 w-10 rounded-full transition-colors hover:bg-[#F4F1EC]"
              title="Mensajes"
            >
              <MessageCircle className="h-5 w-5 text-[#6B6560]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E76F51] px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}
          <div className="relative hidden sm:flex">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="rounded-full transition-all hover:ring-2 hover:ring-[#52B788]/40"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={usuario?.avatar_url || ''} />
                <AvatarFallback className="bg-[#D8F3DC] text-base text-[#1B4332]">
                  {usuario
                    ? `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()
                    : <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-2 z-50 w-64 overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white shadow-lg shadow-black/[0.06]"
                  >
                    {usuario ? (
                      <>
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#1B4332] to-[#40916C] px-4 py-4">
                          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/5" />
                          <div className="absolute -bottom-3 -left-3 h-12 w-12 rounded-full bg-white/5" />
                          <div className="relative flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-white/20">
                              <AvatarImage src={usuario.avatar_url || ''} />
                              <AvatarFallback className="bg-white/20 text-base text-white">
                                {`${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">
                                {usuario.nombre} {usuario.apellido}
                              </p>
                              <p className="truncate text-[11px] text-white/50">{usuario.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-1.5">
                          {[
                            { href: '/dashboard/mis-reservas', icon: CalendarDays, label: 'Mis reservas' },
                            { href: '/dashboard/mis-propiedades', icon: Home, label: 'Mis boogies' },
                            { href: '/dashboard/perfil', icon: User, label: 'Perfil' },
                            { href: '/dashboard/pagos/configuracion', icon: Settings, label: 'Configuración' },
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3] group"
                            >
                              <item.icon className="h-5 w-5 text-[#9E9892] group-hover:text-[#1B4332] transition-colors" />
                              <span className="flex-1">{item.label}</span>
                              <ChevronRight className="h-4 w-4 text-[#E8E4DF] group-hover:text-[#9E9892] transition-colors" />
                            </Link>
                          ))}
                        </div>

                        <div className="border-t border-dotted border-[#E8E4DF] px-1.5 py-1.5">
                          <form action={cerrarSesion}>
                            <button
                              type="submit"
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#C1121F] transition-colors hover:bg-[#FEF2F2]"
                            >
                              <LogOut className="h-5 w-5" />
                              Cerrar sesión
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="p-1.5">
                        <Link
                          href="/login"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
                        >
                          Iniciar sesión
                        </Link>
                        <Link
                          href="/registro"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
                        >
                          Registrarse
                        </Link>
                        <div className="border-t border-dotted border-[#E8E4DF] my-1" />
<Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
                        >
                          <LayoutDashboard className="h-5 w-5 text-[#9E9892]" />
                          Dashboard
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-[#6B6560] transition-colors hover:bg-[#F8F6F3] hover:text-[#1A1A1A] sm:hidden"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden border-t border-[#E8E4DF] bg-white sm:hidden"
          >
            <nav className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
              {usuario ? (
                <>
                  <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#40916C] p-4">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
                    <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
                    <div className="relative flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-white/20">
                        <AvatarImage src={usuario.avatar_url || ''} />
                        <AvatarFallback className="bg-white/20 text-base text-white">
                          {`${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-white">
                          {usuario.nombre} {usuario.apellido}
                        </p>
                        <p className="truncate text-xs text-white/60">{usuario.email}</p>
                      </div>
                    </div>
                    {cotizacionEuro && tasaFormateada && (
                      <div className="relative mt-3 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
                        <TrendingUp className="h-3.5 w-3.5 text-white/60" />
                        <span className="font-medium">1 EUR</span>
                        <span className="text-white/40">=</span>
                        <span className="font-semibold text-white">Bs. {tasaFormateada}</span>
                        <span className="text-white/50">({cotizacionEuro.fuente})</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {([
                      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                      { href: '/dashboard/mensajes', icon: MessageCircle, label: 'Mensajes', badge: unreadCount > 0 ? unreadCount : undefined },
                      { href: '/dashboard/mis-reservas', icon: CalendarDays, label: 'Mis reservas' },
                      { href: '/dashboard/mis-propiedades', icon: Home, label: 'Mis boogies' },
                      { href: '/dashboard/perfil', icon: User, label: 'Perfil' },
                      { href: '/dashboard/pagos/configuracion', icon: Settings, label: 'Configuración' },
                    ] as { href: string; icon: typeof LayoutDashboard; label: string; badge?: number }[]).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3] group"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0EDE8] group-hover:bg-[#1B4332]/10 transition-colors">
                          <item.icon className="h-[18px] w-[18px] text-[#9E9892] group-hover:text-[#1B4332] transition-colors" />
                        </div>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E76F51] px-1 text-[10px] font-bold text-white">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {!item.badge && (
                          <ChevronRight className="h-4 w-4 text-[#E8E4DF] group-hover:text-[#9E9892] transition-colors" />
                        )}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-3 border-t border-dotted border-[#E8E4DF] pt-3">
                    <form action={cerrarSesion}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-[#C1121F] transition-colors hover:bg-[#FEF2F2]"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FEF2F2]">
                          <LogOut className="h-[18px] w-[18px]" />
                        </div>
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#40916C] p-4">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
                    <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
                    <div className="relative flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                        <span className="text-xl font-bold text-white">B</span>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white">Boogie</p>
                        <p className="text-xs text-white/60">Tu hogar lejos de casa</p>
                      </div>
                    </div>
                    {cotizacionEuro && tasaFormateada && (
                      <div className="relative mt-3 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
                        <TrendingUp className="h-3.5 w-3.5 text-white/60" />
                        <span className="font-medium">1 EUR</span>
                        <span className="text-white/40">=</span>
                        <span className="font-semibold text-white">Bs. {tasaFormateada}</span>
                        <span className="text-white/50">({cotizacionEuro.fuente})</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center rounded-xl bg-[#1B4332] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#2D6A4F]"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/registro"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center rounded-xl border border-[#1B4332] px-4 py-3 text-base font-semibold text-[#1B4332] transition-colors hover:bg-[#D8F3DC]"
                    >
                      Registrarse
                    </Link>
                  </div>

                  <div className="mt-3 border-t border-dotted border-[#E8E4DF] pt-3">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3] group"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0EDE8] group-hover:bg-[#1B4332]/10 transition-colors">
                        <LayoutDashboard className="h-[18px] w-[18px] text-[#9E9892] group-hover:text-[#1B4332] transition-colors" />
                      </div>
                      <span className="flex-1">Dashboard</span>
                      <ChevronRight className="h-4 w-4 text-[#E8E4DF] group-hover:text-[#9E9892] transition-colors" />
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
