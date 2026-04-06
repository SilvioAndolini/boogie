// Footer principal de Boogie
import Link from 'next/link'
import { Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-[#E8E4DF] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332]">
                <span className="text-lg font-bold text-white">B</span>
              </div>
              <span className="text-xl font-bold text-[#1A1A1A]">Boogie</span>
            </Link>
            <p className="text-sm text-[#6B6560]">
              Tu hogar lejos de casa en Venezuela. Encuentra alojamientos increíbles en todo el país.
            </p>
          </div>

          {/* Explorar */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#1A1A1A]">Explorar</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/propiedades" className="text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]">
                  Buscar alojamientos
                </Link>
              </li>
              <li>
                <Link href="/zonas" className="text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]">
                  Zonas populares
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]">
                  Cómo funciona
                </Link>
              </li>
            </ul>
          </div>

          {/* Anfitriones */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#1A1A1A]">Anfitriones</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard/mis-propiedades/nueva" className="text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]">
                  Publicar tu espacio
                </Link>
              </li>
              <li>
                <Link href="/como-funciona#anfitrion" className="text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]">
                  Guía para anfitriones
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#1A1A1A]">Soporte</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/ayuda" className="text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]">
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]">
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#E8E4DF] pt-8 sm:flex-row">
          <p className="text-sm text-[#9E9892]">
            &copy; {new Date().getFullYear()} Boogie. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="mailto:soporte@boogie.app" className="text-[#9E9892] transition-colors hover:text-[#1B4332]">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
