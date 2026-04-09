import dynamic from 'next/dynamic'

const HeroSection = dynamic(() => import('@/components/landing/hero-section').then(m => ({ default: m.HeroSection })), {
  ssr: true,
  loading: () => <div className="h-[500px]" />,
})

const BoogiePreviewsSection = dynamic(() => import('@/components/landing/boogie-previews-section').then(m => ({ default: m.BoogiePreviewsSection })), {
  ssr: true,
  loading: () => <div className="h-96" />,
})

const StepsSection = dynamic(() => import('@/components/landing/steps-section').then(m => ({ default: m.StepsSection })), {
  ssr: true,
  loading: () => <div className="h-96" />,
})

const PaymentsSection = dynamic(() => import('@/components/landing/payments-section').then(m => ({ default: m.PaymentsSection })), {
  ssr: true,
  loading: () => <div className="h-96" />,
})

export default function HomePage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="glow-float-a absolute top-0 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#D8F3DC]/40 blur-3xl" />
        <div className="glow-float-b absolute top-48 right-0 h-[500px] w-[500px] translate-x-1/4 rounded-full bg-[#1B4332]/10 blur-3xl" />
        <div className="glow-float-a absolute top-64 left-0 h-[400px] w-[400px] -translate-x-1/4 rounded-full bg-[#52B788]/15 blur-3xl" style={{ animationDelay: '-7s' }} />

        <div className="glow-float-b absolute top-[800px] right-0 h-[500px] w-[500px] translate-x-1/3 rounded-full bg-[#1B4332]/8 blur-3xl" />
        <div className="glow-float-a absolute top-[900px] left-0 h-[400px] w-[400px] -translate-x-1/3 rounded-full bg-[#52B788]/10 blur-3xl" style={{ animationDelay: '-4s' } } />

        <div className="glow-float-a absolute top-[1400px] left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#D8F3DC]/30 blur-3xl" style={{ animationDelay: '-3s' }} />
        <div className="glow-float-b absolute top-[1600px] right-0 h-[350px] w-[350px] translate-x-1/3 rounded-full bg-[#1B4332]/8 blur-3xl" />

        <div className="glow-float-b absolute top-[2200px] left-0 h-[450px] w-[450px] -translate-x-1/3 rounded-full bg-[#52B788]/12 blur-3xl" style={{ animationDelay: '-5s' }} />
        <div className="glow-float-a absolute top-[2400px] right-0 h-[350px] w-[350px] translate-x-1/3 rounded-full bg-[#1B4332]/6 blur-3xl" style={{ animationDelay: '-8s' }} />
      </div>

      <div className="relative z-10">
        <HeroSection />
        <BoogiePreviewsSection />
        <StepsSection />
        <PaymentsSection />
      </div>
    </div>
  )
}
