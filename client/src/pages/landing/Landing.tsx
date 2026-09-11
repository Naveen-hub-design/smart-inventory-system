import LandingNavbar from './LandingNavbar'
import LandingHero from './LandingHero'
import {
  StatsStrip,
  Features,
  HowItWorks,
  DashboardPreview,
  AISection,
  SecuritySection,
  FinalCTA,
  LandingFooter,
} from './LandingSections'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#070c1c] text-slate-200 antialiased overflow-x-clip">
      <LandingNavbar />
      <main>
        <LandingHero />
        <StatsStrip />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <AISection />
        <SecuritySection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
