"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Lights } from "./Lights";
import { Book } from "./Book";

type Scene3DProps = {
  scrollProgressRef: React.RefObject<number>;
};

export default function Scene3D({ scrollProgressRef }: Scene3DProps) {
  const [mounted, setMounted]             = useState(false);
  const [isMobile, setIsMobile]           = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);

    const mobileMq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    setIsMobile(mobileMq.matches);
    const syncMobile = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mobileMq.addEventListener("change", syncMobile);

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionMq.matches);
    const syncMotion = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionMq.addEventListener("change", syncMotion);

    return () => {
      mobileMq.removeEventListener("change", syncMobile);
      motionMq.removeEventListener("change", syncMotion);
    };
  }, []);

  if (!mounted || reducedMotion) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 50, near: 0.1, far: 60, position: [0, 0, 5.5] }}
        gl={{
          alpha: true,           // transparent — CSS bg-shadow-grey-950 shows through
          antialias: !isMobile,
          powerPreference: "default",
        }}
        shadows={!isMobile}     // cast/receive shadows on desktop only
        frameloop="always"
      >
        {/* Fog matches page background (#131111) for depth fade */}
        <fog attach="fog" args={["#131111", 10, 22]} />

        <Lights scrollProgressRef={scrollProgressRef} />
        <Book scrollProgressRef={scrollProgressRef} />
      </Canvas>
    </div>
  );
}
