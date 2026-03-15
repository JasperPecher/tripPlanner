"use client";

import { ReactNode } from "react";
import { LocaleProvider } from "@/lib/LocaleContext";
import { ThemeProvider } from "@/lib/ThemeContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  );
}
