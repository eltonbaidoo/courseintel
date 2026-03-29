"use client";

import { LandingCommandCenter } from "./sections/LandingCommandCenter";
import { LandingComparison } from "./sections/LandingComparison";
import { LandingCta } from "./sections/LandingCta";
import { LandingFeatures } from "./sections/LandingFeatures";
import { LandingFooter } from "./sections/LandingFooter";
import { LandingHowItWorks } from "./sections/LandingHowItWorks";
import { LandingProblem } from "./sections/LandingProblem";
import { LandingTestimonials } from "./sections/LandingTestimonials";

/**
 * Below-the-fold bundle: code-split from the hero so the initial route loads faster.
 */
export default function LandingBelowFold() {
  return (
    <>
      <LandingProblem />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingCommandCenter />
      <LandingComparison />
      <LandingTestimonials />
      <LandingCta />
      <LandingFooter />
    </>
  );
}
