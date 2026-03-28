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

export function urgencyColor(urgency: string): string {
  if (urgency === "high") return "text-red-600 bg-red-50";
  if (urgency === "medium") return "text-yellow-700 bg-yellow-50";
  return "text-green-700 bg-green-50";
}

export function riskColor(risk: string): string {
  if (risk === "critical") return "bg-red-600 text-white";
  if (risk === "high") return "bg-orange-500 text-white";
  if (risk === "medium") return "bg-yellow-500 text-black";
  return "bg-green-500 text-white";
}
