"use client";

import { CreateTripForm } from "@/components/CreateTripForm";
import {
  Compass,
  Users,
  Receipt,
  Camera,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";
import { useTheme } from "@/lib/ThemeContext";

export default function Home() {
  const { t, locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <div className="bg-linear-to-br from-orange-500 to-amber-600 dark:from-orange-800 dark:to-stone-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setLocale(locale === "de" ? "en" : "de")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
            >
              <Globe className="w-4 h-4" />
              {locale === "de" ? "EN" : "DE"}
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="text-center">
            <Compass className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {t.home.title}
            </h1>
            <p className="text-xl text-orange-100 dark:text-orange-200 max-w-2xl mx-auto">
              {t.home.subtitle}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg p-8 max-w-xl mx-auto border border-stone-200 dark:border-stone-800 mt-5">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6 text-center">
          {t.home.createTitle}
        </h2>
        <CreateTripForm />
      </div>
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
            <Users className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t.home.feature1Title}
            </h3>
            <p className="text-stone-600 dark:text-stone-400">
              {t.home.feature1Desc}
            </p>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
            <Receipt className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t.home.feature2Title}
            </h3>
            <p className="text-stone-600 dark:text-stone-400">
              {t.home.feature2Desc}
            </p>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
            <Camera className="w-10 h-10 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t.home.feature3Title}
            </h3>
            <p className="text-stone-600 dark:text-stone-400">
              {t.home.feature3Desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
