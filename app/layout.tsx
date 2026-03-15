import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Reiseplaner - Gemeinsam Reisen planen",
  description: "Plane gemeinsam mit Freunden Reisen, teile Ausgaben und Fotos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 transition-colors">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
