'use client'

import { useState } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimatePresence, motion } from 'framer-motion'
import { cerrarSesion } from '@/actions/auth.actions'

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
}: {
  cotizacionEuro: CotizacionData | null
  usuario: UsuarioData | null
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const tasaFormateada = cotizacionEuro
    ? cotizacionEuro.tasa.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8E4DF] bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332]">
            <span className="text-lg font-bold text-white">B</span>
          </div>
          <span className="text-xl font-bold text-[#1A1A1A]">Boogie</span>
        </Link>

        {cotizacionEuro && tasaFormateada && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-[#D8F3DC] bg-[#D8F3DC]/40 px-2 py-0.5 text-[10px] text-[#1B4332] sm:hidden">
            <TrendingUp className="h-2.5 w-2.5 text-[#2D6A4F]" />
            <span className="font-medium">1 EUR</span>
            <span className="text-[#6B6560]">=</span>
            <span className="font-semibold">Bs. {tasaFormateada}</span>
          </div>
        )}

        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/propiedades"
            className="text-sm font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
          >
            Buscar
          </Link>
          <Link
            href="/zonas"
            className="text-sm font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
          >
            Zonas
          </Link>
          <Link
            href="/como-funciona"
            className="text-sm font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
          >
            Cómo funciona
          </Link>
          <Link
            href="/nosotros"
            className="text-sm font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
          >
            Nosotros
          </Link>
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {cotizacionEuro && tasaFormateada && (
            <div className="flex items-center gap-1 rounded-full border border-[#D8F3DC] bg-[#D8F3DC]/40 px-2.5 py-1 text-[11px] text-[#1B4332]">
              <TrendingUp className="h-3 w-3 text-[#2D6A4F]" />
              <span className="font-medium">1 EUR</span>
              <span className="text-[#6B6560]">=</span>
              <span className="font-semibold">Bs. {tasaFormateada}</span>
              <span className="text-[#6B6560]">({cotizacionEuro.fuente})</span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={usuario?.avatar_url || ''} />
                <AvatarFallback className="bg-[#D8F3DC] text-sm text-[#1B4332]">
                  {usuario
                    ? `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()
                    : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            {usuario ? (
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5 text-sm font-medium text-[#1A1A1A]">
                  {usuario.nombre} {usuario.apellido}
                </div>
                <div className="px-2 pb-2 text-xs text-[#6B6560] truncate">
                  {usuario.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/dashboard/mis-reservas" className="flex w-full items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Mis reservas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/dashboard/mis-propiedades" className="flex w-full items-center gap-2">
                    <Home className="h-4 w-4" />
                    Mis boogies
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/dashboard/perfil" className="flex w-full items-center gap-2">
                    <User className="h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/dashboard/pagos/configuracion" className="flex w-full items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <form action={cerrarSesion} className="flex w-full">
                    <button type="submit" className="flex w-full items-center gap-2 text-[#1B4332]">
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            ) : (
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Link href="/login" className="flex w-full items-center">
                    Iniciar sesión
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/registro" className="flex w-full items-center">
                    Registrarse
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/dashboard" className="flex w-full items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-[#6B6560] transition-colors hover:bg-[#F8F6F3] hover:text-[#1A1A1A] sm:hidden"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6 lg:px-8">
              {cotizacionEuro && tasaFormateada && (
                <div className="mb-2 flex items-center gap-1 rounded-full border border-[#D8F3DC] bg-[#D8F3DC]/40 px-3 py-1.5 text-[11px] text-[#1B4332]">
                  <TrendingUp className="h-3 w-3 text-[#2D6A4F]" />
                  <span className="font-medium">1 EUR</span>
                  <span className="text-[#6B6560]">=</span>
                  <span className="font-semibold">Bs. {tasaFormateada}</span>
                  <span className="text-[#6B6560]">({cotizacionEuro.fuente})</span>
                </div>
              )}
              <Link
                href="/propiedades"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
              >
                Buscar alojamientos
              </Link>
              <Link
                href="/zonas"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
              >
                Zonas populares
              </Link>
              <Link
                href="/como-funciona"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
              >
                Cómo funciona
              </Link>
              <Link
                href="/nosotros"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
              >
                Nosotros
              </Link>
              <Link
                href="/dashboard/mis-propiedades/nueva"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
              >
                Publicar tu espacio
              </Link>

              <div className="border-t border-[#E8E4DF] pt-3">
                {usuario ? (
                  <>
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#F8F6F3] px-3 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={usuario.avatar_url || ''} />
                        <AvatarFallback className="bg-[#D8F3DC] text-xs text-[#1B4332]">
                          {`${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1A1A1A]">
                          {usuario.nombre} {usuario.apellido}
                        </p>
                        <p className="truncate text-xs text-[#6B6560]">
                          {usuario.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/mis-reservas"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
                    >
                      <CalendarDays className="h-4 w-4 text-[#6B6560]" />
                      Mis reservas
                    </Link>
                    <Link
                      href="/dashboard/mis-propiedades"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
                    >
                      <Home className="h-4 w-4 text-[#6B6560]" />
                      Mis boogies
                    </Link>
                    <Link
                      href="/dashboard/perfil"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
                    >
                      <User className="h-4 w-4 text-[#6B6560]" />
                      Perfil
                    </Link>
                    <Link
                      href="/dashboard/pagos/configuracion"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
                    >
                      <Settings className="h-4 w-4 text-[#6B6560]" />
                      Configuración
                    </Link>
                    <form action={cerrarSesion}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1B4332] transition-colors hover:bg-[#D8F3DC]"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1B4332] transition-colors hover:bg-[#F8F6F3]"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/registro"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1B4332] transition-colors hover:bg-[#F8F6F3]"
                    >
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
