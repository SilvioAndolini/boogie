import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { Navbar } from '@/components/layout/navbar'
import { AdminSidebarDesktop, AdminSidebarMobile } from '@/components/admin/admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUsuarioAutenticado()
  if (!user) redirect('/admin-login')

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
        <AdminSidebarDesktop />
        <main className="flex-1 min-w-0">
          <div className="mb-4 lg:hidden">
            <AdminSidebarMobile />
          </div>
          {children}
        </main>
      </div>
    </>
  )
}
