import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const resolved = variant === "default" ? "primary" : variant

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          resolved === "primary" && "jobaz-btn-primary",
          resolved === "secondary" && "jobaz-btn-secondary",
          resolved === "outline" && "jobaz-btn-secondary",
          resolved === "ghost" && "jobaz-btn-ghost shadow-none",
          resolved === "destructive" && "jobaz-btn-danger",
          size === "sm" && "px-3 py-1.5 text-xs",
          size === "default" && "px-4 py-2.5 text-sm",
          size === "lg" && "px-6 py-3 text-base",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
