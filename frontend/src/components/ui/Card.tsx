import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

export function Card({ className = "", padded = true, ...props }: CardProps) {
  return (
    <div
      className={`rounded-base border border-sidebar-border bg-white shadow-card-shadow ${padded ? "p-6" : ""} ${className}`}
      {...props}
    />
  );
}
