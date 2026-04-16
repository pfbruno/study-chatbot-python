import { DashboardPreview } from "@/components/landing/dashboard-preview"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"
import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Pricing } from "@/components/landing/pricing"
import { SocialProof } from "@/components/landing/social-proof"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="relative">
        <Hero />
        <SocialProof />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <Pricing />
      </div>

      <Footer />
    </main>
  )
}