import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, FileCheck, Users, LayoutDashboard } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { Navbar } from '@/components/layout/navbar'

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/verificaciones', label: 'Verificaciones', icon: FileCheck },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUsuarioAutenticado()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: usuario } = await admin
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden lg:block">
          <div className="w-56 space-y-1">
            <div className="mb-4 flex items-center gap-2 px-3">
              <Shield className="h-5 w-5 text-[#1B4332]" />
              <span className="text-sm font-semibold text-[#1B4332]">Admin</span>
            </div>
            {ADMIN_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#F8F6F3] hover:text-[#1A1A1A]"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </>
  )
}
