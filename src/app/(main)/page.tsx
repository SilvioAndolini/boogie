import dynamic from 'next/dynamic'

const HeroSection = dynamic(() => import('@/components/landing/hero-section').then(m => ({ default: m.HeroSection })), {
  ssr: true,
  loading: () => <div className="h-[500px] bg-[#FEFCF9]" />,
})

const ZonasSection = dynamic(() => import('@/components/landing/zonas-section').then(m => ({ default: m.ZonasSection })), {
  ssr: true,
  loading: () => <div className="h-96 bg-[#FEFCF9]" />,
})

const StepsSection = dynamic(() => import('@/components/landing/steps-section').then(m => ({ default: m.StepsSection })), {
  ssr: true,
  loading: () => <div className="h-96 bg-white" />,
})

const PaymentsSection = dynamic(() => import('@/components/landing/payments-section').then(m => ({ default: m.PaymentsSection })), {
  ssr: true,
  loading: () => <div className="h-96 bg-[#FEFCF9]" />,
})

const CtaSection = dynamic(() => import('@/components/landing/cta-section').then(m => ({ default: m.CtaSection })), {
  ssr: true,
  loading: () => <div className="h-64 bg-[#1B4332]" />,
})

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ZonasSection />
      <StepsSection />
      <PaymentsSection />
      <CtaSection />
    </>
  )
}
