import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-honeydew-500 text-white shadow-glow-green hover:bg-honeydew-400 hover:shadow-[0_0_40px_-4px_rgb(124_175_80_/_0.5)]",
        destructive:
          "bg-coral-500 text-white shadow-glow-coral hover:bg-coral-400",
        outline:
          "border border-white/10 glass bg-white/5 hover:bg-white/10 text-honeydew-100",
        secondary:
          "bg-white/10 text-honeydew-100 backdrop-blur-md hover:bg-white/20",
        ghost: "hover:bg-white/10 text-honeydew-100",
        link: "text-honeydew-400 underline-offset-4 hover:underline",
        base44: "bg-blue-500 hover:bg-blue-600 text-white shadow shadow-blue-500/20",
        "base44-ghost": "hover:text-white text-slate-300 transition-colors",
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
