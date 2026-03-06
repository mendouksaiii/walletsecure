import React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-body font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-40",
                {
                    // Primary — confident mint glow
                    "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-glow-primary active:scale-[0.97]": variant === "primary",
                    // Secondary — ghost with border
                    "bg-transparent border border-border-hover text-foreground-DEFAULT hover:border-primary/40 hover:text-primary active:scale-[0.97]": variant === "secondary",
                    // Danger — threatening red
                    "bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:shadow-glow-danger active:scale-[0.97]": variant === "danger",
                    // Outline — subtle
                    "bg-background-surface border border-border hover:border-border-hover hover:bg-background-elevated text-foreground-DEFAULT active:scale-[0.97]": variant === "outline",
                    // Ghost — minimal
                    "text-foreground-muted hover:text-foreground-DEFAULT hover:bg-background-elevated": variant === "ghost",
                    // Accent — indigo
                    "bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-glow-accent active:scale-[0.97]": variant === "accent",
                },
                {
                    "h-9 px-4 py-2": size === "default",
                    "h-8 rounded-md px-3 text-xs": size === "sm",
                    "h-12 rounded-xl px-8 text-base": size === "lg",
                    "h-14 rounded-xl px-10 text-lg": size === "xl",
                    "h-9 w-9 p-0": size === "icon",
                },
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button }
