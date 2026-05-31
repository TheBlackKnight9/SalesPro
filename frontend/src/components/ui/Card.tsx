"use client";
 
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
 
type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};
 
export function Card({ className = "", padded = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn("card text-slate-900 dark:text-slate-100", className)}
      {...props}
    >
      <div className={padded ? "p-0" : ""}>
        {children}
      </div>
    </div>
  );
}
