import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "button-liquid text-primary-foreground",
        destructive: "bg-destructive/90 text-destructive-foreground hover:bg-destructive backdrop-blur-3xl border-2 border-destructive/30 text-glass-primary rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105",
        outline: "backdrop-blur-3xl border-2 border-primary/25 bg-card/70 text-glass-primary hover:bg-primary/10 hover:border-primary/50 hover:text-primary hover:shadow-lg hover:scale-105 rounded-2xl font-bold",
        secondary: "bg-secondary/80 text-secondary-foreground hover:bg-secondary backdrop-blur-3xl border-2 border-secondary/25 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105",
        ghost: "text-glass-primary hover:bg-primary/10 hover:text-primary rounded-2xl font-bold backdrop-blur-sm hover:backdrop-blur-3xl hover:shadow-lg hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline text-glass-glow font-bold",
        glass: "liquid-glass text-glass-primary hover:text-primary font-bold hover:shadow-2xl hover:scale-105",
      },
      size: {
        default: "h-12 px-6 py-3 rounded-2xl",
        sm: "h-10 px-4 py-2 rounded-xl text-sm",
        lg: "h-14 px-8 py-4 rounded-2xl text-lg",
        icon: "h-12 w-12 rounded-2xl",
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
