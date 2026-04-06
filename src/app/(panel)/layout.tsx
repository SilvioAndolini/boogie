// Layout para el panel de usuario (dashboard)
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden lg:block">
          <Sidebar />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </>
  )
}
