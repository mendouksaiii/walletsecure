import React from "react"
import { cn } from "../../lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
    return (
        <span
            ref={ref}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-mono font-medium uppercase tracking-wider transition-colors",
                {
                    "bg-background-elevated border border-border text-foreground-muted": variant === "default",
                    "bg-primary-muted border border-primary/20 text-primary": variant === "safe",
                    "bg-destructive-muted border border-destructive/20 text-destructive": variant === "risk",
                    "bg-warning/10 border border-warning/20 text-warning": variant === "warning",
                    "bg-accent/10 border border-accent/20 text-accent": variant === "accent",
                },
                className
            )}
            {...props}
        >
            {/* Status dot */}
            <span className={cn(
                "status-dot",
                {
                    "bg-foreground-muted": variant === "default",
                    "status-dot--safe": variant === "safe",
                    "status-dot--danger": variant === "risk",
                    "status-dot--warning": variant === "warning",
                    "bg-accent": variant === "accent",
                }
            )} />
            {props.children}
        </span>
    )
})
Badge.displayName = "Badge"

export { Badge }
