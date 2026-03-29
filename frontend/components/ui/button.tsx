import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-almond-cream-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burnt-peach-400/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-burnt-peach-500 text-almond-cream-50 hover:bg-burnt-peach-600",
        destructive:
          "bg-espresso-900 text-almond-cream-50 hover:bg-shadow-grey-900",
        outline:
          "border border-espresso-200 bg-almond-cream-50/80 text-espresso-900 hover:bg-almond-cream-100",
        secondary:
          "bg-almond-cream-200 text-espresso-900 hover:bg-almond-cream-300",
        ghost:
          "text-espresso-800 hover:bg-almond-cream-100",
        link: "text-burnt-peach-600 underline-offset-4 hover:text-burnt-peach-700 hover:underline",
        base44:
          "bg-burnt-peach-500 text-almond-cream-50 hover:bg-burnt-peach-600",
        "base44-ghost":
          "text-almond-cream-400 transition-colors hover:text-almond-cream-50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-2xl px-8 font-display text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
