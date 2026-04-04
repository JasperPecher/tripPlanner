"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Vote } from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";

type Member = { id: string; name: string };
type VoteEntry = {
  id: string;
  date: string;
  memberId: string;
  member: Member;
};

interface DateVoteCalendarProps {
  tripId: string;
  members: Member[];
  currentMember: Member | null;
}

const WEEKDAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAYS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS_DE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function DateVoteCalendar({
  tripId,
  members,
  currentMember,
}: DateVoteCalendarProps) {
  const { t, locale } = useLocale();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [votes, setVotes] = useState<VoteEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const weekdays = locale === "de" ? WEEKDAYS_DE : WEEKDAYS_EN;
  const months = locale === "de" ? MONTHS_DE : MONTHS_EN;

  const fetchVotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/date-votes`);
      if (res.ok) {
        const data = await res.json();
        setVotes(data);
      }
    } catch {
      /* ignore */
    }
  }, [tripId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const toggleVote = async (day: number) => {
    if (!currentMember) return;
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const existing = votes.find(
      (v) => v.date.startsWith(key) && v.memberId === currentMember.id,
    );
    setLoading(true);
    try {
      if (existing) {
        const res = await fetch(`/api/trips/${tripId}/date-votes`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: key, memberId: currentMember.id }),
        });
        if (res.ok) {
          setVotes((prev) => prev.filter((v) => v.id !== existing.id));
        }
      } else {
        const res = await fetch(`/api/trips/${tripId}/date-votes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: key, memberId: currentMember.id }),
        });
        if (res.ok) {
          const newVote = await res.json();
          setVotes((prev) => [...prev, newVote]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const votesByDate = new Map<string, VoteEntry[]>();
  for (const vote of votes) {
    const key = vote.date.slice(0, 10);
    if (!votesByDate.has(key)) votesByDate.set(key, []);
    votesByDate.get(key)!.push(vote);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const totalMembers = members.length;

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const getIntensity = (count: number): string => {
    if (count === 0) return "";
    const ratio = count / Math.max(totalMembers, 1);
    if (ratio >= 1) return "bg-green-500 text-white";
    if (ratio >= 0.75) return "bg-green-400 text-white";
    if (ratio >= 0.5) return "bg-green-300 text-stone-900";
    if (ratio >= 0.25) return "bg-green-100 text-stone-900";
    return "bg-green-100 text-stone-900";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Vote className="w-5 h-5 text-orange-500" />
            {t.dateVoting.title}
          </h2>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
          {t.dateVoting.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
            aria-label={t.dateVoting.previousMonth}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-stone-900 dark:text-white">
            {months[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
            aria-label={t.dateVoting.nextMonth}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-stone-500 dark:text-stone-400 py-1"
            >
              {day}
            </div>
          ))}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayVotes = votesByDate.get(key) || [];
            const hasMyVote = currentMember
              ? dayVotes.some((v) => v.memberId === currentMember.id)
              : false;
            const count = dayVotes.length;
            const names = dayVotes.map((n) => n.member.name).sort();

            const intensity = getIntensity(count);

            return (
              <button
                key={day}
                onClick={() => toggleVote(day)}
                disabled={loading || !currentMember}
                className={`relative aspect-square rounded-lg text-sm font-medium transition flex flex-col items-center justify-center ${
                  hasMyVote
                    ? `ring-2 ring-orange-500 ring-offset-1 dark:ring-offset-stone-900 ${intensity || "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"}`
                    : intensity ||
                      "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                }`}
                title={
                  count > 0
                    ? dayVotes.map((v) => v.member.name).join(", ")
                    : undefined
                }
              >
                <span>{day}</span>
                {count > 0 && (
                  <span className="text-[10px] leading-none opacity-80 truncate w-full px-1">
                    {count}
                    <ul className="mt-2">
                      {names.map((n) => (
                        <li className="truncate w-full" key={n}>
                          {n}
                        </li>
                      ))}
                    </ul>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <div className="w-3 h-3 rounded bg-green-100" /> &#x2192;
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <div className="w-3 h-3 rounded bg-green-300" />
            &#x2192;
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <div className="w-3 h-3 rounded bg-green-500" />
            {t.dateVoting.allAvailable} ({totalMembers})
          </div>
          {currentMember && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 ml-auto">
              <div className="w-3 h-3 rounded ring-2 ring-orange-500" />
              {currentMember.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
