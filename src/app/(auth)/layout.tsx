import { Footer } from '@/components/layout/footer'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8F6F3] via-white to-[#E8F4EC]" />
      <div className="glow-float-a absolute top-0 right-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/4 rounded-full bg-[#D8F3DC]/40 blur-3xl" />
      <div className="glow-float-b absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/4 rounded-full bg-[#1B4332]/10 blur-3xl" />
      <div className="glow-float-a absolute top-1/2 right-1/4 h-[300px] w-[300px] rounded-full bg-[#52B788]/15 blur-3xl" style={{ animationDelay: '-7s' }} />
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full flex justify-center">
          {children}
        </div>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}
