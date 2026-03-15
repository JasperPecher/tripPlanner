"use client";

import { JoinTripForm } from "@/components/JoinTripForm";
import { useLocale } from "@/lib/LocaleContext";
import { useTheme } from "@/lib/ThemeContext";
import { Globe, Sun, Moon } from "lucide-react";

interface JoinTripClientProps {
  tripId: string;
  tripName: string;
  tripDescription: string | null;
  existingMembers: { id: string; name: string; isAdmin: boolean }[];
}

export function JoinTripClient({ tripId, tripName, tripDescription, existingMembers }: JoinTripClientProps) {
  const { t, locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-amber-600 dark:from-orange-800 dark:to-stone-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => setLocale(locale === "de" ? "en" : "de")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white transition">
          <Globe className="w-4 h-4" />
          {locale === "de" ? "EN" : "DE"}
        </button>
        <button onClick={toggleTheme} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition">
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{tripName}</h1>
          {tripDescription && <p className="text-stone-600 dark:text-stone-400 mt-2">{tripDescription}</p>}
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-3">{existingMembers.length} {t.dashboard.members}</p>
        </div>
        <JoinTripForm tripId={tripId} existingMembers={existingMembers} />
        <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-700">
          <p className="text-xs text-stone-500 dark:text-stone-400 text-center">
            {t.join.alreadyJoined}{" "}
            <a href={`/trip/${tripId}`} className="text-orange-600 dark:text-orange-400 hover:underline">{t.join.goToTrip}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
