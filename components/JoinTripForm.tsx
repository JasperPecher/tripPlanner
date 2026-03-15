"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";

interface JoinTripFormProps {
  tripId: string;
  existingMembers: { id: string; name: string }[];
}

export function JoinTripForm({ tripId, existingMembers }: JoinTripFormProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t.common.error);
      setLoading(false);
      return;
    }

    if (existingMembers.some((m) => m.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError(t.join.nameTaken);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(`trip_${tripId}_member`,
          JSON.stringify({ id: data.member.id, name: trimmedName, isAdmin: false }));
        router.push(`/trip/${tripId}`);
      } else {
        setError(data.error || t.common.error);
      }
    } catch (err) {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
          {t.join.yourName}
        </label>
        <input id="name" type="text" value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          className="w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition text-lg"
          placeholder={t.join.namePlaceholder} autoFocus />
        {error && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>}
      </div>

      {existingMembers.length > 0 && (
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1">
            <Users className="w-4 h-4" />{t.join.alreadyInGroup}
          </p>
          <div className="flex flex-wrap gap-2">
            {existingMembers.map((member) => (
              <span key={member.id} className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-full text-sm">
                <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-medium">
                  {member.name.charAt(0).toUpperCase()}
                </span>{member.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg">
        {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />{t.join.joining}</>) : (t.join.joinButton)}
      </button>
    </form>
  );
}
