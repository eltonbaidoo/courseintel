"use client";

import dynamic from "next/dynamic";

import { LandingHero } from "./sections/LandingHero";
import { LandingNav } from "./sections/LandingNav";

const LandingBelowFold = dynamic(() => import("./LandingBelowFold"), {
  loading: () => (
    <div className="min-h-[36rem] w-full bg-shadow-grey-950" aria-hidden />
  ),
});

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-shadow-grey-950 font-sans text-almond-cream-50 selection:bg-burnt-peach-500/30">
      <LandingNav />
      <LandingHero />
      <LandingBelowFold />
    </main>
  );
}
