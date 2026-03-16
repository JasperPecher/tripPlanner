"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, UserPlus, ChevronRight } from "lucide-react";
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
  const [showNewMember, setShowNewMember] = useState(existingMembers.length === 0);

  const selectExistingMember = (member: { id: string; name: string }) => {
    localStorage.setItem(
      `trip_${tripId}_member`,
      JSON.stringify({ id: member.id, name: member.name })
    );
    router.push(`/trip/${tripId}`);
  };

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
          JSON.stringify({ id: data.member.id, name: trimmedName }));
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
    <div className="space-y-4">
      {existingMembers.length > 0 && !showNewMember && (
        <div>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1">
            <Users className="w-4 h-4" />
            {t.join.selectMember}
          </p>
          <div className="space-y-2">
            {existingMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => selectExistingMember(member)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-700 transition text-left group"
              >
                <span className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-sm font-medium shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 text-stone-900 dark:text-white font-medium">
                  {member.name}
                </span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-orange-500 transition" />
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setShowNewMember(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              {t.join.joinAsNew}
            </button>
          </div>
        </div>
      )}

      {showNewMember && (
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
            <button
              type="button"
              onClick={() => { setShowNewMember(false); setError(""); }}
              className="text-sm text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition"
            >
              {t.join.backToMembers}
            </button>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg">
            {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />{t.join.joining}</>) : (t.join.joinButton)}
          </button>
        </form>
      )}
    </div>
  );
}
