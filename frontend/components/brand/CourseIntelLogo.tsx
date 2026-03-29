import Image from "next/image";

import { cn } from "@/lib/utils";

type CourseIntelLogoProps = {
  className?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
};

export function CourseIntelLogo({
  className,
  priority = false,
  loading,
}: CourseIntelLogoProps) {
  return (
    <Image
      src="/courseintel-logo.png"
      alt="CourseIntel"
      width={280}
      height={64}
      priority={priority}
      loading={loading ?? (priority ? "eager" : "lazy")}
      className={cn("h-8 w-auto object-contain object-left md:h-9", className)}
    />
  );
}
