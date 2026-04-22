import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "amber" | "purple";
  size?: "sm" | "md" | "lg" | "xl";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-background hover:opacity-90 shadow-[0_0_20px_rgba(0,229,200,0.3)]",
      secondary: "bg-secondary text-white hover:opacity-90 shadow-[0_0_20px_rgba(255,61,160,0.3)]",
      outline: "border-2 border-primary text-primary hover:bg-primary/10",
      ghost: "hover:bg-white/10 text-white",
      danger: "bg-red-500 text-white hover:bg-red-600",
      amber: "bg-amber text-white hover:opacity-90 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
      purple: "bg-purple text-white hover:opacity-90 shadow-[0_0_20px_rgba(139,92,246,0.3)]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-6 py-3 text-base font-semibold",
      lg: "px-8 py-4 text-lg font-bold",
      xl: "px-10 py-5 text-2xl font-black uppercase tracking-wider",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-heading",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
