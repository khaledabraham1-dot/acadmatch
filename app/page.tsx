import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ExampleResultPreview } from "@/components/landing/ExampleResultPreview";
import { Disclaimer } from "@/components/landing/Disclaimer";
import { Footer } from "@/components/landing/Footer";
import { CatalogueScopeNotice } from "@/components/ui/CatalogueScopeNotice";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <LandingNav />
      <main id="contenu-principal" className="flex-1">
        <Hero />
        <div className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
          <CatalogueScopeNotice />
        </div>
        <HowItWorks />
        <ExampleResultPreview />
        <Disclaimer />
      </main>
      <Footer />
    </div>
  );
}
