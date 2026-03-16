"use client";

import { useState } from "react";
import { User, CreditCard, Save, Loader2, ExternalLink } from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";

type Member = { id: string; name: string; isAdmin: boolean; joinedAt: string; paypalLink?: string | null };

interface UserSettingsProps {
  tripId: string;
  currentMember: Member;
  onMemberUpdated: (member: Member) => void;
}

export function UserSettings({ tripId, currentMember, onMemberUpdated }: UserSettingsProps) {
  const { t } = useLocale();
  const [name, setName] = useState(currentMember.name);
  const [paypalLink, setPaypalLink] = useState(currentMember.paypalLink || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const inputClasses =
    "w-full px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition";
  const labelClasses = "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1";

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    let normalizedPaypal = paypalLink.trim();
    if (normalizedPaypal && !normalizedPaypal.startsWith("http://") && !normalizedPaypal.startsWith("https://")) {
      normalizedPaypal = "https://" + normalizedPaypal;
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: currentMember.id,
          name: name.trim(),
          paypalLink: normalizedPaypal,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const updated = data.member;
        onMemberUpdated(updated);
        localStorage.setItem(
          `trip_${tripId}_member`,
          JSON.stringify({ id: updated.id, name: updated.name, isAdmin: updated.isAdmin })
        );
        setMessage(t.userSettings.saved);
      } else {
        setMessage(data.error || t.common.error);
      }
    } catch {
      setMessage(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <User className="w-6 h-6 text-orange-500" />
        {t.userSettings.title}
      </h2>

      <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-800 space-y-4">
        <div>
          <label className={labelClasses}>{t.userSettings.yourName}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              {t.userSettings.paypalLink}
            </span>
          </label>
          <input
            type="url"
            value={paypalLink}
            onChange={(e) => setPaypalLink(e.target.value)}
            className={inputClasses}
            placeholder="https://paypal.me/yourname"
          />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {t.userSettings.paypalLinkDesc}
          </p>
        </div>

        {paypalLink && (
          <a
            href={paypalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t.userSettings.testPaypal}
          </a>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t.userSettings.save}
          </button>
          {message && (
            <span className="text-sm text-stone-600 dark:text-stone-400">{message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
