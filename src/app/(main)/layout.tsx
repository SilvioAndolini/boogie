// Layout para rutas principales públicas (landing, propiedades, zonas)
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
