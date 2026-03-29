"use client";

/**
 * CSSBook3D — scroll-driven page-flip book using CSS 3D transforms.
 * No WebGL, no Three.js. Uses requestAnimationFrame + direct DOM refs
 * so scroll never triggers React re-renders.
 */

import { useEffect, useRef } from "react";

// ─── Book constants ────────────────────────────────────────────────────────────
const W = 210;   // page width  (px)
const H = 290;   // page height (px)
const SPINE_W = 22;

// Cover + 5 pages = 6 flips total
const PAGE_COUNT  = 5;
const TOTAL_FLIPS = PAGE_COUNT + 1;

// Z offsets (px)
const COVER_Z_OFFSET = (PAGE_COUNT + 1) * 0.4 + 5;
const pageZ = (i: number) => (PAGE_COUNT - i) * 0.4;
const BACK_Z = -(PAGE_COUNT * 0.4 + 5);

// Palette
const FRONT_COVER = "#be6441";
const BACK_COVER  = "#1b0e09";
const SPINE_COL   = "#723c27";
const PAGE_FRONT  = ["#f9f2ec", "#f3e6d8", "#f7efed", "#f9f2ec", "#f3e6d8"] as const;
const PAGE_BACK   = ["#f3e6d8", "#f7efed", "#efe0dc", "#f3e6d8", "#f9f2ec"] as const;
const COVER_BACK  = "#dab48b";

// ─── Page content ─────────────────────────────────────────────────────────────

const PAGE_CONTENT = [
  {
    chapter: "01",
    title: "Current\nStanding",
    lines: ["CS 301 · Data Structures", "Grade: 87.3%  →  A-", "Pass probability: 94.2%", "", "You are above the class median.", "3 assignments remain."],
  },
  {
    chapter: "02",
    title: "This\nWeek",
    lines: ["Midterm exam", "Thursday — HIGH priority", "", "Lab 5 submission", "Wednesday — MED priority", "", "Office hours: Mon 2–4 pm"],
  },
  {
    chapter: "03",
    title: "Grade\nPrediction",
    lines: ["If you score 80% on midterm:", "Final grade → 88.1%  (A-)", "", "If you score 90% on midterm:", "Final grade → 91.4%  (A)", "", "Target: keep Labs above 85%."],
  },
  {
    chapter: "04",
    title: "Course\nBreakdown",
    lines: ["Exams         35%  ████████", "Labs          25%  ██████", "Homework      25%  ██████", "Project       15%  ████", "", "Weakest area: Homework (76%)"],
  },
  {
    chapter: "05",
    title: "Next\nSteps",
    lines: ["① Review lecture 9 notes", "② Complete Lab 5 draft", "③ Form study group", "④ Book office hours slot", "", "CourseIntel · eb-initial"],
  },
] as const;

// ─── Math ─────────────────────────────────────────────────────────────────────

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function flipAngle(flipIndex: number, progress: number): number {
  const start = flipIndex / TOTAL_FLIPS;
  const end   = (flipIndex + 1) / TOTAL_FLIPS;
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return -easeInOut(t) * 180;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CoverFront() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 0 }}>
      {/* Decorative top rule */}
      <div style={{ width: 40, height: 2, background: "rgba(255,255,255,0.5)", marginBottom: 16 }} />
      <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>
        CourseIntel
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2, textAlign: "center", marginBottom: 14 }}>
        Your Academic<br />Intelligence<br />System
      </div>
      {/* Decorative bottom rule */}
      <div style={{ width: 40, height: 2, background: "rgba(255,255,255,0.5)", marginTop: 6 }} />
      <div style={{ marginTop: 28, fontFamily: "system-ui, sans-serif", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
        Early Access · 2025
      </div>
    </div>
  );
}

function PageFront({ chapter, title, lines, bg }: { chapter: string; title: string; lines: readonly string[]; bg: string }) {
  const textColor = "#4a2e1e";
  const mutedColor = "#a07050";
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, backfaceVisibility: "hidden", boxShadow: "inset -8px 0 16px rgba(0,0,0,0.10)", padding: "18px 16px 14px", display: "flex", flexDirection: "column" }}>
      {/* Chapter label */}
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 8, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: mutedColor, marginBottom: 4 }}>
        Chapter {chapter}
      </div>
      {/* Chapter title */}
      <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: textColor, lineHeight: 1.15, whiteSpace: "pre-line", marginBottom: 10 }}>
        {title}
      </div>
      {/* Divider */}
      <div style={{ width: "100%", height: 1, background: "#c9a882", marginBottom: 10, opacity: 0.5 }} />
      {/* Body lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        {lines.map((line, j) =>
          line === "" ? (
            <div key={j} style={{ height: 4 }} />
          ) : (
            <div key={j} style={{ fontFamily: "ui-monospace, monospace", fontSize: 8.5, color: line.startsWith("①") || line.startsWith("②") || line.startsWith("③") || line.startsWith("④") ? textColor : mutedColor, lineHeight: 1.5, fontWeight: line.includes("→") || line.includes("HIGH") ? 600 : 400 }}>
              {line}
            </div>
          )
        )}
      </div>
      {/* Page number */}
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 7.5, color: mutedColor, textAlign: "center", opacity: 0.6, marginTop: 4 }}>
        — {parseInt(chapter) * 2} —
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CSSBook3D() {
  const flipRefs = useRef<(HTMLDivElement | null)[]>(Array(TOTAL_FLIPS).fill(null));
  const scrollP  = useRef(0);
  const smoothP  = useRef(0);
  const raf      = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onScroll = () => {
      // All pages flip within the first ~90vh of scrolling
      const range = window.innerHeight * 0.9;
      scrollP.current = Math.min(1, window.scrollY / range);
    };

    const tick = () => {
      smoothP.current += (scrollP.current - smoothP.current) * 0.07;
      const p = smoothP.current;

      const cover = flipRefs.current[0];
      if (cover) cover.style.transform = `rotateY(${flipAngle(0, p)}deg) translateZ(${COVER_Z_OFFSET}px)`;

      for (let i = 0; i < PAGE_COUNT; i++) {
        const el = flipRefs.current[i + 1];
        if (el) el.style.transform = `rotateY(${flipAngle(i + 1, p)}deg) translateZ(${pageZ(i)}px)`;
      }

      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    // Absolute inside the hero section — scrolls away naturally, never overlaps below-fold content.
    <div
      className="pointer-events-none absolute bottom-8 right-48 z-0 hidden md:flex"
      aria-hidden="true"
    >
      <div style={{ perspective: "1100px", perspectiveOrigin: "45% 50%" }}>
        <div className="book-float">
          <div
            style={{
              width: W,
              height: H,
              position: "relative",
              transform: "rotateY(-22deg) rotateX(6deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* ── Spine ── */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: -SPINE_W,
                width: SPINE_W,
                height: H,
                background: SPINE_COL,
                transformOrigin: "right center",
                transform: "rotateY(-90deg)",
                boxShadow: "inset -4px 0 8px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: "system-ui, sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                CourseIntel
              </div>
            </div>

            {/* ── Back cover ── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: BACK_COVER,
                transform: `translateZ(${BACK_Z}px)`,
                borderRadius: "0 3px 3px 0",
              }}
            />

            {/* ── Pages ── */}
            {PAGE_FRONT.map((frontColor, i) => (
              <div
                key={i}
                ref={(el) => { flipRefs.current[i + 1] = el; }}
                style={{
                  position: "absolute",
                  inset: 0,
                  transformStyle: "preserve-3d",
                  transformOrigin: "left center",
                  transform: `rotateY(0deg) translateZ(${pageZ(i)}px)`,
                }}
              >
                {/* Front face with content */}
                <PageFront
                  chapter={PAGE_CONTENT[i].chapter}
                  title={PAGE_CONTENT[i].title}
                  lines={PAGE_CONTENT[i].lines}
                  bg={frontColor}
                />
                {/* Back face */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: PAGE_BACK[i],
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    boxShadow: "inset 8px 0 16px rgba(0,0,0,0.07)",
                  }}
                />
              </div>
            ))}

            {/* ── Front cover ── */}
            <div
              ref={(el) => { flipRefs.current[0] = el; }}
              style={{
                position: "absolute",
                inset: 0,
                transformStyle: "preserve-3d",
                transformOrigin: "left center",
                transform: `rotateY(0deg) translateZ(${COVER_Z_OFFSET}px)`,
              }}
            >
              {/* Outside of cover */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: FRONT_COVER,
                  backfaceVisibility: "hidden",
                  borderRadius: "0 4px 4px 0",
                  boxShadow: "4px 0 12px rgba(0,0,0,0.25)",
                }}
              >
                <CoverFront />
              </div>
              {/* Inside of cover */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: COVER_BACK,
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
