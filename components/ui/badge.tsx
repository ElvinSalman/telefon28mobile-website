// Adapted from the MIT-licensed shadcn/ui new-york-v4 Badge.
import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-current px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        outline: "text-[var(--accent)]",
        secondary: "bg-[var(--raised)] text-[var(--muted)]",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);
export function Badge({
  className,
  variant = "outline",
  ...props
}: ComponentProps<"span"> & { variant?: "outline" | "secondary" }) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
