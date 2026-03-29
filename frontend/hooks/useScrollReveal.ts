"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollRevealPhase = "below" | "visible" | "above";

/**
 * Tracks whether an element is below the viewport, in view, or scrolled past.
 * Uses IntersectionObserver only (no scroll listeners) for passive, cheap updates.
 * Respects prefers-reduced-motion: always "visible".
 */
export function useScrollReveal(enabled = true) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<ScrollRevealPhase>(enabled ? "below" : "visible");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPhase("visible");
      return;
    }
    if (reducedMotion) {
      setPhase("visible");
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const rect = entry.boundingClientRect;
        if (entry.isIntersecting) {
          setPhase("visible");
          return;
        }
        if (rect.bottom < 0) setPhase("above");
        else setPhase("below");
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px",
        threshold: [0, 0.05, 0.15, 0.35, 0.65, 1],
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, reducedMotion]);

  const effectivePhase = reducedMotion || !enabled ? "visible" : phase;

  return { ref, phase: effectivePhase, reducedMotion };
}
