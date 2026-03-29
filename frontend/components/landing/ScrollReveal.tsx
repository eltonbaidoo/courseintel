"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { type ScrollRevealPhase, useScrollReveal } from "@/hooks/useScrollReveal";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** When false, content stays visible (use for above-the-fold / LCP). */
  animate?: boolean;
};

function phaseClass(phase: ScrollRevealPhase): string {
  switch (phase) {
    case "below":
      return "scroll-reveal-below";
    case "above":
      return "scroll-reveal-above";
    default:
      return "scroll-reveal-visible";
  }
}

export function ScrollReveal({ children, className, animate = true }: ScrollRevealProps) {
  const { ref, phase } = useScrollReveal(animate);

  return (
    <div
      ref={ref}
      className={cn(
        "scroll-reveal-base",
        animate && "scroll-reveal-motion",
        phaseClass(phase),
        className
      )}
    >
      {children}
    </div>
  );
}
