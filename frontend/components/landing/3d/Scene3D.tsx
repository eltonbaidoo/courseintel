"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Scene3DProps = {
  scrollProgressRef: React.RefObject<number>;
};

const SHAPE_DEFS = [
  { geo: () => new THREE.IcosahedronGeometry(1, 1),    pos: [-3.2, 1.4,  -2.0], rot: [0.3, 0.5, 0.1], color: "#be6441", roughness: 0.08, ior: 1.55, rotSpeed: [ 0.001,  0.002,  0.0005], floatOffset: 0   },
  { geo: () => new THREE.OctahedronGeometry(1, 0),     pos: [ 3.5,-1.2,  -3.5], rot: [0.7, 0.2, 0.4], color: "#462720", roughness: 0.05, ior: 1.45, rotSpeed: [-0.0015, 0.001,  0.002 ], floatOffset: 1.5 },
  { geo: () => new THREE.TorusGeometry(1, 0.35, 16,48),pos: [ 1.8, 2.6,  -1.5], rot: [1.2, 0.3, 0.8], color: "#dab48b", roughness: 0.12, ior: 1.48, rotSpeed: [ 0.002, -0.001,  0.0015], floatOffset: 3.0 },
  { geo: () => new THREE.DodecahedronGeometry(1, 0),   pos: [-2.0,-2.3,  -4.0], rot: [0.1, 0.9, 0.2], color: "#be6441", roughness: 0.07, ior: 1.60, rotSpeed: [ 0.0008, 0.0018,-0.001 ], floatOffset: 4.5 },
  { geo: () => new THREE.IcosahedronGeometry(1, 1),    pos: [ 4.0, 1.0,  -5.0], rot: [0.5, 1.1, 0.3], color: "#462720", roughness: 0.10, ior: 1.50, rotSpeed: [ 0.0012,-0.0008, 0.002 ], floatOffset: 2.2 },
  { geo: () => new THREE.OctahedronGeometry(1, 0),     pos: [-4.5, 0.3,  -1.2], rot: [0.9, 0.4, 1.0], color: "#dab48b", roughness: 0.06, ior: 1.52, rotSpeed: [-0.001,  0.0015,-0.0012], floatOffset: 5.5 },
] as const;

export default function Scene3D({ scrollProgressRef }: Scene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
    const container = containerRef.current;
    if (!container) return;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
    container.appendChild(renderer.domElement);

    // ── Scene / Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#131111", 10, 22);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 60);
    camera.position.set(0, 0, 8);

    // ── Lights ───────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1b1918, 0.15));

    const keyLight  = new THREE.PointLight(0xdab48b, 3.5, 25, 2);
    const fillLight = new THREE.PointLight(0x462720, 2.0, 18, 2);
    const rimLight  = new THREE.PointLight(0xbe6441, 1.2, 20, 2);
    keyLight.position.set(-4, 3, 3);
    fillLight.position.set(4, -2, 2);
    rimLight.position.set(0, 0, -8);
    scene.add(keyLight, fillLight, rimLight);

    const keyA = new THREE.Color(0xdab48b), keyB = new THREE.Color(0xbe6441);
    const filA = new THREE.Color(0x462720), filB = new THREE.Color(0xcb8367);
    const tmp  = new THREE.Color();

    // ── Meshes ───────────────────────────────────────────────────────────────
    const group = new THREE.Group();
    scene.add(group);

    const active = isMobile ? SHAPE_DEFS.slice(0, 4) : SHAPE_DEFS;
    const meshes = active.map((cfg) => {
      const geo = cfg.geo();
      const mat = new THREE.MeshPhysicalMaterial({
        color:        cfg.color,
        roughness:    isMobile ? cfg.roughness + 0.15 : cfg.roughness,
        metalness:    0.05,
        transmission: isMobile ? 0 : 0.92,
        ior:          cfg.ior,
        thickness:    1.2,
        transparent:  true,
        opacity:      isMobile ? 0.18 : 0.88,
        side:         THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      group.add(mesh);
      return { mesh, cfg };
    });

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Loop ─────────────────────────────────────────────────────────────────
    let elapsed = 0, lastTime = performance.now(), rafId = 0;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const now   = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += delta;

      const p = scrollProgressRef.current ?? 0;

      // Camera dolly
      camera.position.z += (8 - p * 3   - camera.position.z) * 0.04;
      camera.position.y += (p * -0.4    - camera.position.y) * 0.04;

      // Group scroll rotation
      group.rotation.y += (p * Math.PI * 0.15 - group.rotation.y) * 0.035;
      group.rotation.x += (p * Math.PI * 0.06 - group.rotation.x) * 0.035;

      // Scroll-reactive lights
      keyLight.position.x  += (-4 + p * 4  - keyLight.position.x) * 0.03;
      keyLight.position.y  += (3  - p * 6  - keyLight.position.y) * 0.03;
      keyLight.intensity    = 3.5 + Math.sin(p * Math.PI) * 1.5;
      keyLight.color.copy(tmp.copy(keyA).lerp(keyB, p));

      fillLight.position.x += (4  - p * 6  - fillLight.position.x) * 0.03;
      fillLight.position.y += (-2 + p * 6  - fillLight.position.y) * 0.03;
      fillLight.intensity   = 2.0 + p * 1.8;
      fillLight.color.copy(tmp.copy(filA).lerp(filB, p));

      // Per-mesh idle float + self-rotation
      meshes.forEach(({ mesh, cfg }) => {
        mesh.rotation.x += cfg.rotSpeed[0];
        mesh.rotation.y += cfg.rotSpeed[1];
        mesh.rotation.z += cfg.rotSpeed[2];
        mesh.position.y  = cfg.pos[1] + Math.sin(elapsed * 0.8 + cfg.floatOffset) * 0.08;
      });

      renderer.render(scene, camera);
    };

    tick();

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      meshes.forEach(({ mesh, cfg }) => {
        cfg.geo().dispose();                              // dispose a fresh instance (shapes are tiny)
        (mesh.material as THREE.Material).dispose();
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
