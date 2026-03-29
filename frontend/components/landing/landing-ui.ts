/** Shared Tailwind patterns for the marketing page; keeps panels consistent. */

export const sectionAnchor = "scroll-mt-24 md:scroll-mt-28";

/** Subtle glass without hover motion (badges, static mockups). */
export const glassPanelStatic =
  "rounded-2xl border border-almond-cream-50/10 bg-espresso-950/80 shadow-md shadow-shadow-grey-950/25 backdrop-blur-sm backdrop-saturate-150";

/** Glass panel + soft hover lift (cards). */
export const glassPanel = `${glassPanelStatic} transition-[box-shadow,transform,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-almond-cream-50/18 motion-safe:hover:shadow-lg motion-safe:hover:shadow-shadow-grey-950/35`;

export const glassPanelInteractive = glassPanel;

export const glassNav =
  "border-b border-almond-cream-50/10 bg-shadow-grey-950/80 backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-shadow-grey-950/70";
