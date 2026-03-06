import React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-lg bg-background-surface border border-border px-4 py-2",
                "font-mono text-sm text-foreground-DEFAULT placeholder:text-foreground-subtle",
                "transition-all duration-200",
                "focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:shadow-glow-primary",
                "disabled:cursor-not-allowed disabled:opacity-40",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Input.displayName = "Input"

export { Input }
