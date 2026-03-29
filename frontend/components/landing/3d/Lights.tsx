"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type LightsProps = {
  scrollProgressRef: React.RefObject<number>;
};

export function Lights({ scrollProgressRef }: LightsProps) {
  const keyRef  = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const p = scrollProgressRef.current ?? 0;

    // Key light sweeps gently left as user scrolls — simulates turning pages
    if (keyRef.current) {
      keyRef.current.position.x = 4 - p * 2.5;
      keyRef.current.position.y = 5 - p * 0.8;
      keyRef.current.intensity  = 1.6 + Math.sin(p * Math.PI) * 0.4;
    }

    // Warm fill brightens slightly at mid-scroll (most pages in motion)
    if (fillRef.current) {
      fillRef.current.intensity = 0.5 + p * 0.4;
    }
  });

  return (
    <>
      {/* Soft warm ambient — reveals page silhouettes in the dark */}
      <ambientLight intensity={0.45} color="#f3e6d8" />

      {/* Key: directional from top-right, casts crisp page shadows */}
      <directionalLight
        ref={keyRef}
        position={[4, 5, 3]}
        intensity={1.6}
        color="#ffe8d5"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Fill: warm burnt-peach from the left — brand-consistent rim glow */}
      <pointLight
        ref={fillRef}
        position={[-4, 2, 2]}
        color="#be6441"
        intensity={0.5}
        distance={14}
        decay={2}
      />

      {/* Subtle back light — separates book from background */}
      <pointLight
        position={[1, -3, -3]}
        color="#dab48b"
        intensity={0.3}
        distance={10}
        decay={2}
      />
    </>
  );
}
