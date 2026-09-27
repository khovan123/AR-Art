import { Box, ImageIcon, Smartphone } from "lucide-react";

import { FeatureCard } from "@/components/molecules/feature-card";
import { LandingHero } from "@/components/organisms/landing-hero";
import { SiteHeader } from "@/components/organisms/site-header";

const features = [
  {
    icon: ImageIcon,
    title: "Image-target tracking",
    description: "The artwork itself is the marker. No QR code needs to stay visible while the AR experience runs.",
  },
  {
    icon: Box,
    title: "3D-ready renderer",
    description: "The current MVP renders a live Three.js overlay and is structured so video or GLB artwork can be added next.",
  },
  {
    icon: Smartphone,
    title: "Browser-first",
    description: "Visitors open a secure HTTPS link, grant camera permission, and scan. No native app installation is required.",
  },
];

export function MarketingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <LandingHero />
      <section className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">MVP architecture</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Small surface area, real AR core.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>
    </main>
  );
}
