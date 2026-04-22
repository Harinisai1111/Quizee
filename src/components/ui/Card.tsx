import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl border-2 border-white/10 bg-card p-6 shadow-2xl",
          glass && "bg-white/5 backdrop-blur-xl border-white/20",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card };
