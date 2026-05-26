"use client";

import type { HTMLAttributes } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

export function Card({ className = "", padded = true, children, ...props }: CardProps) {
  return (
    <MagicCard
      mode="gradient"
      gradientColor="var(--color-card-glow)"
      className={cn("rounded-xl shadow-sm text-slate-900 dark:text-slate-100", className)}
    >
      <div className={padded ? "p-6" : ""} {...props}>
        {children}
      </div>
    </MagicCard>
  );
}
