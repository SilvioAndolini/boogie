import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Boogie — Tu hogar lejos de casa en Venezuela',
    template: '%s | Boogie',
  },
  description: 'Encuentra alojamientos increíbles en toda Venezuela. Reserva apartamentos, casas y villas con métodos de pago locales.',
  keywords: ['alquiler vacacional', 'Venezuela', 'alojamiento', 'apartamento', 'casa', 'vacaciones'],
  openGraph: {
    title: 'Boogie — Tu hogar lejos de casa en Venezuela',
    description: 'Encuentra alojamientos increíbles en toda Venezuela.',
    type: 'website',
    locale: 'es_VE',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${jakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FEFCF9]">
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
