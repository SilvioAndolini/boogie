import Link from 'next/link'
import { Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative mt-40 bg-[#1B4332]">
      <div className="relative">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <span className="text-lg font-bold text-white">B</span>
                </div>
                <span className="text-xl font-bold text-white">Boogie</span>
              </Link>
              <p className="text-sm text-white/60">
                Tu hogar lejos de casa en Venezuela. Encuentra alojamientos increíbles en todo el país.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Explorar</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/propiedades" className="text-sm text-white/60 transition-colors hover:text-white">
                    Buscar alojamientos
                  </Link>
                </li>
                <li>
                  <Link href="/zonas" className="text-sm text-white/60 transition-colors hover:text-white">
                    Zonas populares
                  </Link>
                </li>
                <li>
                  <Link href="/como-funciona" className="text-sm text-white/60 transition-colors hover:text-white">
                    Cómo funciona
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Anfitriones</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard/mis-propiedades/nueva" className="text-sm text-white/60 transition-colors hover:text-white">
                    Publicar tu espacio
                  </Link>
                </li>
                <li>
                  <Link href="/como-funciona#anfitrion" className="text-sm text-white/60 transition-colors hover:text-white">
                    Guía para anfitriones
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Soporte</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/ayuda" className="text-sm text-white/60 transition-colors hover:text-white">
                    Centro de ayuda
                  </Link>
                </li>
                <li>
                  <Link href="/terminos" className="text-sm text-white/60 transition-colors hover:text-white">
                    Términos de servicio
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="text-sm text-white/60 transition-colors hover:text-white">
                    Política de privacidad
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-sm text-white/40">
              &copy; {new Date().getFullYear()} Boogie. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a href="mailto:soporte@boogie.app" className="text-white/40 transition-colors hover:text-white">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
