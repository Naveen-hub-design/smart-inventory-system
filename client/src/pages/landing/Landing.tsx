import LandingNavbar from './LandingNavbar'
import LandingHero from './LandingHero'
import {
  CapabilityLine,
  Features,
  HowItWorks,
  DashboardShowcase,
  AISection,
  FinalCTA,
  LandingFooter,
} from './LandingSections'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased overflow-x-clip">
      <LandingNavbar />
      <main>
        <LandingHero />
        <CapabilityLine />
        <Features />
        <HowItWorks />
        <DashboardShowcase />
        <AISection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
