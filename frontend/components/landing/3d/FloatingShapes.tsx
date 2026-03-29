"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

type GeometryType = "icosahedron" | "octahedron" | "torus" | "dodecahedron";

type ShapeConfig = {
  geometry: GeometryType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  roughness: number;
  ior: number;
  thickness: number;
  rotationSpeed: [number, number, number];
  floatOffset: number;
};

// 6 shapes for desktop — varied depths create parallax naturally
const SHAPES: ShapeConfig[] = [
  {
    geometry: "icosahedron",
    position: [-3.2, 1.4, -2.0],
    rotation: [0.3, 0.5, 0.1],
    scale: 0.9,
    color: "#be6441",         // burnt-peach-500
    roughness: 0.08,
    ior: 1.55,
    thickness: 1.2,
    rotationSpeed: [0.001, 0.002, 0.0005],
    floatOffset: 0,
  },
  {
    geometry: "octahedron",
    position: [3.5, -1.2, -3.5],
    rotation: [0.7, 0.2, 0.4],
    scale: 1.1,
    color: "#462720",         // espresso-800
    roughness: 0.05,
    ior: 1.45,
    thickness: 0.9,
    rotationSpeed: [-0.0015, 0.001, 0.002],
    floatOffset: 1.5,
  },
  {
    geometry: "torus",
    position: [1.8, 2.6, -1.5],
    rotation: [1.2, 0.3, 0.8],
    scale: 0.65,
    color: "#dab48b",         // almond-cream-300
    roughness: 0.12,
    ior: 1.48,
    thickness: 0.5,
    rotationSpeed: [0.002, -0.001, 0.0015],
    floatOffset: 3.0,
  },
  {
    geometry: "dodecahedron",
    position: [-2.0, -2.3, -4.0],
    rotation: [0.1, 0.9, 0.2],
    scale: 0.8,
    color: "#be6441",
    roughness: 0.07,
    ior: 1.6,
    thickness: 1.4,
    rotationSpeed: [0.0008, 0.0018, -0.001],
    floatOffset: 4.5,
  },
  {
    geometry: "icosahedron",
    position: [4.0, 1.0, -5.0],
    rotation: [0.5, 1.1, 0.3],
    scale: 1.3,
    color: "#462720",
    roughness: 0.1,
    ior: 1.5,
    thickness: 1.8,
    rotationSpeed: [0.0012, -0.0008, 0.002],
    floatOffset: 2.2,
  },
  {
    geometry: "octahedron",
    position: [-4.5, 0.3, -1.2],
    rotation: [0.9, 0.4, 1.0],
    scale: 0.75,
    color: "#dab48b",
    roughness: 0.06,
    ior: 1.52,
    thickness: 0.7,
    rotationSpeed: [-0.001, 0.0015, -0.0012],
    floatOffset: 5.5,
  },
];

function buildGeometry(type: GeometryType): THREE.BufferGeometry {
  switch (type) {
    case "icosahedron":  return new THREE.IcosahedronGeometry(1, 1);  // 80 triangles
    case "octahedron":   return new THREE.OctahedronGeometry(1, 0);   // 8 faces
    case "torus":        return new THREE.TorusGeometry(1, 0.35, 16, 48);
    case "dodecahedron": return new THREE.DodecahedronGeometry(1, 0); // 12 faces
  }
}

type FloatingShapesProps = {
  scrollProgressRef: React.RefObject<number>;
  isMobile: boolean;
};

export function FloatingShapes({ scrollProgressRef, isMobile }: FloatingShapesProps) {
  const groupRef  = useRef<THREE.Group>(null);
  const meshRefs  = useRef<(THREE.Mesh | null)[]>([]);
  const elapsedRef = useRef(0);
  const { camera } = useThree();

  const shapes = isMobile ? SHAPES.slice(0, 4) : SHAPES;

  // Build all geometries once; rebuild only when mobile status changes
  const geometries = useMemo(
    () => shapes.map((cfg) => buildGeometry(cfg.geometry)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMobile],
  );

  // Dispose geometries when they're replaced or component unmounts
  useEffect(() => {
    return () => {
      geometries.forEach((g) => g.dispose());
    };
  }, [geometries]);

  useFrame((_state, delta) => {
    elapsedRef.current += delta;
    const t = elapsedRef.current;
    const p = scrollProgressRef.current ?? 0; // 0–1

    // ── Camera dolly: z 8→5, slight Y drift ─────────────────────────────
    camera.position.z += (8 - p * 3    - camera.position.z) * 0.04;
    camera.position.y += (p * -0.4     - camera.position.y) * 0.04;

    // ── Group scroll rotation: reverses when scrolling back up ───────────
    if (groupRef.current) {
      groupRef.current.rotation.y +=
        (p * Math.PI * 0.15 - groupRef.current.rotation.y) * 0.035;
      groupRef.current.rotation.x +=
        (p * Math.PI * 0.06 - groupRef.current.rotation.x) * 0.035;
    }

    // ── Per-mesh: self-rotation + idle float ─────────────────────────────
    shapes.forEach((cfg, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      mesh.rotation.x += cfg.rotationSpeed[0];
      mesh.rotation.y += cfg.rotationSpeed[1];
      mesh.rotation.z += cfg.rotationSpeed[2];
      // Sin float — phase-offset per shape so they never move in sync
      mesh.position.y = cfg.position[1] + Math.sin(t * 0.8 + cfg.floatOffset) * 0.08;
    });
  });

  return (
    <group ref={groupRef}>
      {shapes.map((cfg, i) => (
        <mesh
          key={`${isMobile ? "m" : "d"}-${i}`}
          ref={(el) => { meshRefs.current[i] = el; }}
          geometry={geometries[i]}
          position={cfg.position}
          rotation={cfg.rotation}
          scale={cfg.scale}
        >
          {isMobile ? (
            // Mobile: standard PBR — no costly FBO transmission pass
            <meshPhysicalMaterial
              color={cfg.color}
              roughness={cfg.roughness + 0.15}
              metalness={0.1}
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
            />
          ) : (
            // Desktop: full glass transmission via Drei's MeshTransmissionMaterial
            <MeshTransmissionMaterial
              color={cfg.color}
              roughness={cfg.roughness}
              ior={cfg.ior}
              thickness={cfg.thickness}
              transmission={1}
              chromaticAberration={0.03}
              anisotropicBlur={0.1}
              backside
              backsideThickness={0.3}
              samples={4}
              resolution={256}
              distortionScale={0.2}
              temporalDistortion={0.05}
              transparent
              opacity={0.85}
            />
          )}
        </mesh>
      ))}
    </group>
  );
}
