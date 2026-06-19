"use client";

import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";

type DialogProps = {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function Dialog({ children, description, onClose, open, title }: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section
        aria-describedby={description ? "dialog-description" : undefined}
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        role="dialog"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950" id="dialog-title">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-zinc-600" id="dialog-description">
                {description}
              </p>
            ) : null}
          </div>
          <Button aria-label="Закрыть" onClick={onClose} variant="ghost">
            X
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
