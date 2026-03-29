"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ─── Book dimensions ──────────────────────────────────────────────────────────
const BOOK_W     = 2.2;   // page width (spine to edge)
const BOOK_H     = 3.0;   // page height
const COVER_D    = 0.07;  // cover thickness
const PAGE_D     = 0.003; // page thickness (very thin)
const SPINE_W    = 0.28;  // spine width

// Sections: cover + 6 pages (Problem, Features, HowItWorks, CommandCenter, Comparison, Testimonials)
const PAGE_COUNT   = 6;
const TOTAL_FLIPS  = PAGE_COUNT + 1; // front-cover flip + 6 page flips

// Brand-palette page colors (warm almond-cream variations)
const PAGE_COLORS = [
  "#f9f2ec", // almond-cream-50
  "#f3e6d8", // almond-cream-100
  "#f7efed", // espresso-50
  "#f9f2ec",
  "#f3e6d8",
  "#efe0dc", // espresso-100
] as const;

// ─── Utilities ────────────────────────────────────────────────────────────────

function easeInOut(t: number): number {
  // Quadratic ease-in-out — natural paper feel
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

// Page geometry pivots at the LEFT edge (spine).
// Translating +BOOK_W/2 on X means x=0 is the spine, x=BOOK_W is the free edge.
function makeFlipGeo(depth: number): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(BOOK_W, BOOK_H, depth);
  geo.translate(BOOK_W / 2, 0, 0);
  return geo;
}

// ─── FlipPiece ────────────────────────────────────────────────────────────────
// A single flippable piece (either the front cover or one page).
// flipIndex 0 = front cover, 1-PAGE_COUNT = pages.

interface FlipPieceProps {
  flipIndex: number;
  scrollProgressRef: React.RefObject<number>;
  color: string;
  depth: number;
  zBase: number;         // initial Z offset for stacking order
  isCover?: boolean;
}

function FlipPiece({
  flipIndex,
  scrollProgressRef,
  color,
  depth,
  zBase,
  isCover = false,
}: FlipPieceProps) {
  const groupRef = useRef<THREE.Group>(null);

  const geo = useMemo(() => makeFlipGeo(depth), [depth]);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(() => {
    if (!groupRef.current) return;
    const p = scrollProgressRef.current ?? 0;

    // Each flip occupies an equal segment of the scroll range
    const segStart = flipIndex / TOTAL_FLIPS;
    const segEnd   = (flipIndex + 1) / TOTAL_FLIPS;

    // Progress within this piece's flip window: 0 → 1
    const localT = clamp01((p - segStart) / (segEnd - segStart));
    // Full rotation from 0° (right/closed) to -180° (left/open)
    groupRef.current.rotation.y = -easeInOut(localT) * Math.PI;
  });

  return (
    <group ref={groupRef} position={[0, 0, zBase]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={isCover ? 0.4 : 0.82}
          metalness={isCover ? 0.06 : 0.0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── Book ─────────────────────────────────────────────────────────────────────

interface BookProps {
  scrollProgressRef: React.RefObject<number>;
}

export function Book({ scrollProgressRef }: BookProps) {
  const groupRef  = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const { camera } = useThree();

  // Fixed geometry pieces (never flip)
  const spineGeo = useMemo(
    () => new THREE.BoxGeometry(SPINE_W, BOOK_H + 0.04, COVER_D * 2.2),
    [],
  );
  const backCoverGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(BOOK_W, BOOK_H, COVER_D);
    g.translate(BOOK_W / 2, 0, 0); // same pivot alignment
    return g;
  }, []);

  useEffect(() => {
    return () => {
      spineGeo.dispose();
      backCoverGeo.dispose();
    };
  }, [spineGeo, backCoverGeo]);

  useFrame((_state, delta) => {
    elapsedRef.current += delta;
    const t = elapsedRef.current;
    const p = scrollProgressRef.current ?? 0;

    // Idle float + subtle sway
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.55) * 0.06;
      groupRef.current.rotation.z = Math.sin(t * 0.32) * 0.012;
    }

    // Camera: gentle forward dolly as user reads through the book
    camera.position.z += (5.5 - p * 1.2 - camera.position.z) * 0.025;
    camera.position.y += (p * -0.2 - camera.position.y) * 0.025;
  });

  return (
    <group
      ref={groupRef}
      position={[0.6, 0, -0.5]}
      rotation={[0.08, -0.3, 0]}  // angled to show depth
    >
      {/* ── Spine (fixed, always visible) ── */}
      <mesh geometry={spineGeo} position={[-SPINE_W / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#723c27" roughness={0.65} metalness={0.05} />
      </mesh>

      {/* ── Back cover (fixed behind all pages) ── */}
      <mesh
        geometry={backCoverGeo}
        position={[0, 0, -(COVER_D / 2)]}
        receiveShadow
      >
        <meshStandardMaterial color="#26140d" roughness={0.5} />
      </mesh>

      {/* ── Pages (flip indices 1 → PAGE_COUNT, stacked front-to-back) ── */}
      {PAGE_COLORS.map((color, i) => (
        <FlipPiece
          key={i}
          flipIndex={i + 1}
          scrollProgressRef={scrollProgressRef}
          color={color}
          depth={PAGE_D}
          // Page 0 is just under the cover; page 5 is deepest
          zBase={(PAGE_COUNT - i) * PAGE_D * 2}
          isCover={false}
        />
      ))}

      {/* ── Front cover (flip index 0, flips first) ── */}
      <FlipPiece
        flipIndex={0}
        scrollProgressRef={scrollProgressRef}
        color="#be6441"   // burnt-peach-500
        depth={COVER_D}
        zBase={PAGE_COUNT * PAGE_D * 2 + COVER_D}
        isCover
      />
    </group>
  );
}
