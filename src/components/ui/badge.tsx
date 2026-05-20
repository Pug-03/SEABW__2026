import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground",
        accent: "bg-accent/15 text-accent border border-accent/30",
        success:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
        warning:
          "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
        ai: "bg-gradient-to-r from-fuchsia-500/20 to-indigo-500/20 text-indigo-700 dark:text-indigo-200 border border-indigo-400/40",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
