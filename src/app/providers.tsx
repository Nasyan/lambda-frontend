"use client";

import type { ReactNode } from "react";

import "@/entities/user/model/user-store";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}
