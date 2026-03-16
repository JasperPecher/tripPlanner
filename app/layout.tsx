import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SWRegister } from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "Reiseplaner - Gemeinsam Reisen planen",
  description: "Plane gemeinsam mit Freunden Reisen, teile Ausgaben und Fotos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trip Planner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-50 transition-colors">
        <Providers>{children}</Providers>
        <SWRegister />
      </body>
    </html>
  );
}
