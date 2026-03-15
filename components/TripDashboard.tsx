"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Receipt,
  Camera,
  Settings,
  Share2,
  Copy,
  Check,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/LocaleContext";
import { useTheme } from "@/lib/ThemeContext";
import { ExpenseTracker } from "./ExpenseTracker";
import { PhotoGallery } from "./PhotoGallery";
import { NotesSection } from "./NotesSection";
import { BookingsSection } from "./BookingsSection";
import { SettingsPage } from "./SettingsPage";

type Member = { id: string; name: string; isAdmin: boolean; joinedAt: string };
type Expense = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  createdAt: string;
  paidById: string;
  paidBy: Member;
  splits: { id: string; amount: number; memberId: string; member: Member }[];
};
type Booking = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  reference: string | null;
  checkIn: string | null;
  checkOut: string | null;
  location: string | null;
  price: number | null;
  currency: string;
};
type Photo = {
  id: string;
  filename: string;
  url: string;
  thumbnail: string | null;
  caption: string | null;
  uploadedBy: string | null;
  createdAt: string;
};
type StorageConfig = { id: string; type: string; config: string } | null;
type Trip = {
  id: string;
  name: string;
  description: string | null;
  shareCode: string;
  startDate: string | null;
  endDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  expenses: Expense[];
  bookings: Booking[];
  photos: Photo[];
  storageConfig: StorageConfig;
};

interface TripDashboardProps {
  trip: Trip;
  shareUrl: string;
}
type Tab = "overview" | "expenses" | "photos" | "settings";

export function TripDashboard({
  trip: initialTrip,
  shareUrl,
}: TripDashboardProps) {
  const [trip, setTrip] = useState(initialTrip);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const { t, locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const stored = localStorage.getItem(`trip_${trip.id}_member`);
    if (stored) {
      const member = JSON.parse(stored);
      const found = trip.members.find((m) => m.id === member.id);
      if (found) setCurrentMember(found);
    }
  }, [trip.id, trip.members]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    {
      id: "overview" as Tab,
      label: t.dashboard.tabs.overview,
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: "expenses" as Tab,
      label: t.dashboard.tabs.expenses,
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: "photos" as Tab,
      label: t.dashboard.tabs.photos,
      icon: <Camera className="w-4 h-4" />,
    },
    {
      id: "settings" as Tab,
      label: t.dashboard.tabs.settings,
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 pb-0 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              >
                &larr; {t.dashboard.backToTrips}
              </Link>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-white mt-1">
                {trip.name}
              </h1>
              {trip.description && (
                <p className="text-stone-600 dark:text-stone-400 mt-1">
                  {trip.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocale(locale === "de" ? "en" : "de")}
                className="flex items-center gap-1 px-2 py-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {locale === "de" ? "EN" : "DE"}
                </span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <div className="text-right mr-4">
                <div className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
                  <Users className="w-4 h-4" />
                  <span>
                    {trip.members.length} {t.dashboard.members}
                  </span>
                </div>
                {currentMember && (
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    {currentMember.name}
                    {currentMember.isAdmin && ` (${t.dashboard.admin})`}
                  </span>
                )}
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t.common.copied}
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    {t.dashboard.shareLink}
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="flex gap-1 mt-4 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition ${activeTab === tab.id ? "bg-stone-100 dark:bg-stone-950 text-orange-600 dark:text-orange-400 border border-b-0 border-stone-200 dark:border-stone-700" : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  {t.overview.tripDetails}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-stone-500 dark:text-stone-400">
                      {t.overview.startDate}
                    </span>
                    <p className="font-medium dark:text-white">
                      {formatDate(trip.startDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-stone-500 dark:text-stone-400">
                      {t.overview.endDate}
                    </span>
                    <p className="font-medium dark:text-white">
                      {formatDate(trip.endDate)}
                    </p>
                  </div>
                </div>
              </div>
              <BookingsSection
                tripId={trip.id}
                bookings={trip.bookings}
                isAdmin={currentMember?.isAdmin || false}
              />
              <NotesSection
                tripId={trip.id}
                initialNotes={trip.notes}
                isAdmin={currentMember?.isAdmin || false}
              />
            </div>
            <div className="space-y-6">
              <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  {t.overview.members}
                </h2>
                <ul className="space-y-2">
                  {trip.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center gap-2 py-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-sm font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium dark:text-white">
                        {member.name}
                      </span>
                      {member.isAdmin && (
                        <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                          {t.dashboard.admin}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-orange-500" />
                  {t.overview.invite}
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                  {t.dashboard.inviteDesc}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 text-sm px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "expenses" && (
          <ExpenseTracker
            tripId={trip.id}
            members={trip.members}
            expenses={trip.expenses}
            currentMember={currentMember}
          />
        )}
        {activeTab === "photos" && (
          <PhotoGallery
            tripId={trip.id}
            photos={trip.photos}
            storageConfig={trip.storageConfig}
            currentMember={currentMember}
          />
        )}
        {activeTab === "settings" && (
          <SettingsPage
            trip={trip}
            currentMember={currentMember}
            onTripUpdated={(updated) => setTrip({ ...trip, ...updated })}
          />
        )}
      </div>
    </div>
  );
}
