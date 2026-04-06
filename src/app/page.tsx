import { HeroSection } from '@/components/landing/hero-section'
import { ZonasSection } from '@/components/landing/zonas-section'
import { StepsSection } from '@/components/landing/steps-section'
import { PaymentsSection } from '@/components/landing/payments-section'
import { CtaSection } from '@/components/landing/cta-section'

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
