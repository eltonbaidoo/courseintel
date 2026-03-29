import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-almond-cream-200/25 px-3 py-1 text-xs font-semibold font-display transition-colors focus:outline-none focus:ring-2 focus:ring-burnt-peach-400/40 focus:ring-offset-2 focus:ring-offset-almond-cream-50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-burnt-peach-500/20 text-almond-cream-100 hover:bg-burnt-peach-500/30",
        secondary:
          "border-transparent bg-espresso-900 text-almond-cream-100 hover:bg-espresso-800",
        outline: "text-foreground",
        neon: "border-transparent bg-burnt-peach-500/20 text-burnt-peach-300 hover:bg-burnt-peach-500/30",
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
