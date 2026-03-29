"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

import { LandingHero } from "./sections/LandingHero";
import { LandingNav } from "./sections/LandingNav";

const LandingBelowFold = dynamic(() => import("./LandingBelowFold"), {
  loading: () => (
    <div className="min-h-[36rem] w-full bg-shadow-grey-950" aria-hidden />
  ),
});

const Scene3D = dynamic(() => import("./3d/Scene3D"), {
  ssr: false,
  loading: () => null,
});

export function LandingPage() {
  const scrollProgressRef = useRef<number>(0);

  useEffect(() => {
    const handle = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current = max > 0 ? window.scrollY / max : 0;
    };
    window.addEventListener("scroll", handle, { passive: true });
    handle();
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-shadow-grey-950 font-sans text-almond-cream-50 selection:bg-burnt-peach-500/30">
      <Scene3D scrollProgressRef={scrollProgressRef} />
      <LandingNav />
      <LandingHero />
      <LandingBelowFold />
    </main>
  );
}
