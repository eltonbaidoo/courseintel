import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs font-semibold font-display transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-honeydew-500/20 text-honeydew-100 hover:bg-honeydew-500/30",
        secondary:
          "border-transparent bg-white/10 text-honeydew-100 backdrop-blur-md hover:bg-white/20",
        outline: "text-foreground",
        neon: "border-transparent bg-neon-ice-500/20 text-neon-ice-300 hover:bg-neon-ice-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
