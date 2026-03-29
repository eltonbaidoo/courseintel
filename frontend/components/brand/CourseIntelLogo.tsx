import Image from "next/image";

import { cn } from "@/lib/utils";

type CourseIntelLogoProps = {
  /** Full wordmark vs Ci mark only (sidebar, favicon source, compact nav). */
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
};

const ASSET = {
  full: {
    src: "/courseintel-logo.jpg",
    width: 1024,
    height: 682,
    alt: "CourseIntel",
  },
  mark: {
    src: "/courseintel-icon.jpg",
    width: 1024,
    height: 682,
    alt: "CourseIntel",
  },
} as const;

export function CourseIntelLogo({
  variant = "full",
  className,
  priority = false,
  loading,
}: CourseIntelLogoProps) {
  const a = ASSET[variant];
  return (
    <Image
      src={a.src}
      alt={a.alt}
      width={a.width}
      height={a.height}
      priority={priority}
      loading={loading ?? (priority ? "eager" : "lazy")}
      className={cn(
        variant === "full"
          ? "h-8 w-auto object-contain object-left md:h-9"
          : "h-9 w-9 shrink-0 object-contain object-center",
        className,
      )}
    />
  );
}
