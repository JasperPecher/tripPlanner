"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Save, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";

interface NotesSectionProps {
  tripId: string;
  initialNotes: string;
}

export function NotesSection({ tripId, initialNotes }: NotesSectionProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [notes, setNotes] = useState(initialNotes);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(initialNotes);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: draft }),
      });
      if (response.ok) {
        setNotes(draft);
        router.refresh();
        setEditing(false);
      }
    } catch (error) {
      alert(t.common.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-orange-500" />
          {t.notes.title}
        </h2>
        {!editing && (
          <button
            onClick={() => {
              setDraft(notes);
              setEditing(true);
            }}
            className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            {t.notes.edit}
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
            rows={8}
            placeholder={t.notes.placeholder}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t.common.save}
            </button>
          </div>
        </div>
      ) : notes ? (
        //prose prose-sm dark:prose-invert
        <p className=" text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-all">
          {notes.split(/((?:https?:\/\/|www\.)[^\s]+)/gi).map((part, i) => {
            if (part.match(/^(?:https?:\/\/|www\.)/i)) {
              const href = part.toLowerCase().startsWith('www.') ? `https://${part}` : part;
              return (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                  {part}
                </a>
              );
            }
            return part;
          })}
        </p>
      ) : (
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          {t.notes.noNotes}
        </p>
      )}
    </div>
  );
}
