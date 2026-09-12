import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ExampleResultPreview } from "@/components/landing/ExampleResultPreview";
import { Disclaimer } from "@/components/landing/Disclaimer";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <ExampleResultPreview />
        <Disclaimer />
      </main>
      <Footer />
    </div>
  );
}
