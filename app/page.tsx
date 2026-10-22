"use client";

import { CreateTripForm } from "@/components/CreateTripForm";
import { Compass, Sun, Moon, Globe } from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";
import { useTheme } from "@/lib/ThemeContext";

export default function Home() {
  const { t, locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Minimal Top Header */}
      <header className="w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-bold text-stone-900 dark:text-white tracking-tight">
              {t.home.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLocale(locale === "de" ? "en" : "de")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>{locale === "de" ? "EN" : "DE"}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-2">
              {t.home.createTitle}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t.home.subtitle}
            </p>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 p-5 sm:p-7">
            <CreateTripForm />
          </div>
        </div>
      </main>
    </div>
  );
}
