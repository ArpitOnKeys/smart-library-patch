import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-glass-primary placeholder:text-glass-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:border-primary/50 focus-visible:bg-card/98 focus-visible:shadow-lg hover:border-primary/30 hover:bg-card/98 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-glass-primary font-semibold shadow-lg",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
