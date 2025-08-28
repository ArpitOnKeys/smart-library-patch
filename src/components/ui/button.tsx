import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "button-liquid text-primary-foreground",
        destructive:
          "bg-destructive/90 text-destructive-foreground hover:bg-destructive backdrop-blur-sm border border-destructive/20 text-glass-primary",
        outline:
          "border border-border/35 bg-card/70 hover:bg-card/85 hover:text-accent-foreground backdrop-blur-xl text-glass-primary",
        secondary:
          "bg-secondary/85 text-secondary-foreground hover:bg-secondary/95 backdrop-blur-sm border border-border/25 text-glass-primary",
        ghost: "hover:bg-accent/70 hover:text-accent-foreground backdrop-blur-sm text-glass-secondary",
        link: "text-primary underline-offset-4 hover:underline text-glass-glow",
        glass: "liquid-glass text-glass-primary hover:text-glass-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
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
