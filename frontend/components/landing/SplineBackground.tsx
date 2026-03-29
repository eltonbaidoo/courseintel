"use client";

import Spline from "@splinetool/react-spline";

/**
 * Full-viewport Spline scene rendered behind all landing page content.
 * Uses the /next import which handles SSR gracefully (renders nothing on the
 * server, hydrates the scene client-side once the JS bundle is ready).
 */
export default function SplineBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    >
      <Spline
        scene="https://prod.spline.design/MyGJhNTVyTm4fFBT/scene.splinecode"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
