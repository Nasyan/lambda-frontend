import type { LabelHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
};

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label className={cn("text-sm font-medium text-zinc-800", className)} {...props}>
      {children}
    </label>
  );
}
