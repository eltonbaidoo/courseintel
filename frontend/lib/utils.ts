import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "No date";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Urgency chips — palette only (espresso / burnt-peach / almond-cream). */
export function urgencyColor(urgency: string): string {
  if (urgency === "high")
    return "text-espresso-900 bg-espresso-100";
  if (urgency === "medium")
    return "text-espresso-800 bg-almond-cream-100";
  return "text-almond-cream-800 bg-almond-cream-50";
}

/** Risk pills — palette only. */
export function riskColor(risk: string): string {
  if (risk === "critical")
    return "bg-espresso-900 text-almond-cream-50";
  if (risk === "high")
    return "bg-burnt-peach-700 text-almond-cream-50";
  if (risk === "medium")
    return "bg-almond-cream-400 text-shadow-grey-900";
  return "bg-almond-cream-600 text-almond-cream-50";
}
