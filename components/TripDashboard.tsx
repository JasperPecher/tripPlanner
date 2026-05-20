"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { RouteMapPageProps } from "./RouteMapPage";
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
  User,
  Briefcase,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/LocaleContext";
import { useTheme } from "@/lib/ThemeContext";
import { ExpenseTracker } from "./ExpenseTracker";
import { PhotoGallery } from "./PhotoGallery";
import { NotesSection } from "./NotesSection";
import { BookingsSection } from "./BookingsSection";
import { SettingsPage } from "./SettingsPage";
import { UserSettings } from "./UserSettings";
import { DateVoteCalendar } from "./DateVoteCalendar";
import PackingListPage from "./PackingListPage";
const RouteMapPage = dynamic<RouteMapPageProps>(() => import("./RouteMapPage"), { ssr: false });

type RoutePoint = {
  id: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  date: string | null;
  order: number;
};

type Member = {
  id: string;
  name: string;
  joinedAt: string;
  paypalLink?: string | null;
};
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
type Payment = {
  id: string;
  amount: number;
  createdAt: string;
  fromId: string;
  toId: string;
  from: Member;
  to: Member;
};
type StorageConfig = { id: string; type: string; config: string } | null;
type PackingItem = {
  id: string;
  item: string;
  category: string | null;
  packed: boolean;
  assignedToId: string | null;
  assignedTo: Member | null;
};
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
  payments: Payment[];
  packingItems: PackingItem[];
  routePoints: RoutePoint[];
  storageConfig: StorageConfig;
  hasExpenses: boolean;
  hasPhotos: boolean;
  hasDateVoting: boolean;
  hasPackingList: boolean;
  hasMap: boolean;
};

interface TripDashboardProps {
  trip: Trip;
  shareUrl: string;
}
type Tab =
  | "overview"
  | "expenses"
  | "photos"
  | "calendar"
  | "packing"
  | "map"
  | "user"
  | "settings";

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
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  // Lock background scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (isOpenMenu) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpenMenu]);

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

  const handleMemberUpdated = (updated: Member) => {
    setCurrentMember(updated);
    setTrip({
      ...trip,
      members: trip.members.map((m) => (m.id === updated.id ? updated : m)),
    });
  };

  const tabs = [
    {
      id: "overview" as Tab,
      label: t.dashboard.tabs.overview,
      icon: <Calendar className="w-4 h-4" />,
    },
    ...(trip.hasExpenses ?? true ? [{
      id: "expenses" as Tab,
      label: t.dashboard.tabs.expenses,
      icon: <Receipt className="w-4 h-4" />,
    }] : []),
    ...(trip.hasPhotos ?? true ? [{
      id: "photos" as Tab,
      label: t.dashboard.tabs.photos,
      icon: <Camera className="w-4 h-4" />,
    }] : []),
    ...(trip.hasDateVoting ?? true ? [{
      id: "calendar" as Tab,
      label: t.dashboard.tabs.calendarVoting,
      icon: <Calendar className="w-4 h-4" />,
    }] : []),
    ...(trip.hasPackingList ?? true ? [{
      id: "packing" as Tab,
      label: t.dashboard.tabs.packingList,
      icon: <Briefcase className="w-4 h-4" />,
    }] : []),
    ...(trip.hasMap ?? true ? [{
      id: "map" as Tab,
      label: t.dashboard.tabs.map || "Map",
      icon: <Globe className="w-4 h-4" />,
    }] : []),
    {
      id: "user" as Tab,
      label: t.dashboard.tabs.user,
      icon: <User className="w-4 h-4" />,
    },
    {
      id: "settings" as Tab,
      label: t.dashboard.tabs.settings,
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 hidden md:block">
        <div className="max-w-6xl mx-auto px-4 pb-0 py-3 ">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-stone-900 dark:text-white mt-0.5 truncate">
                {trip.name}
              </h1>
              {trip.description && (
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-2 hidden sm:block">
                  {trip.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5  shrink-0">
              <button
                onClick={() => setLocale(locale === "de" ? "en" : "de")}
                className="flex items-center gap-1.5 p-1.5 px-3 py-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200  hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-sm transition"
              >
                <Globe className="w-4 h-4" />
                {locale === "de" ? "DE" : "EN"}
              </button>
              <button
                onClick={toggleTheme}
                className="p-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                {theme === "dark" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1 px-2 text-sm text-stone-600 dark:text-stone-400">
                  <Users className="w-4 h-4" />
                  <span>
                    {trip.members.length} {t.dashboard.members}
                  </span>
                </div>
                {currentMember && (
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    {currentMember.name}
                  </span>
                )}
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.common.copied}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {t.dashboard.shareLink}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="flex gap-0.5 sm:gap-1 mt-3 -mb-px overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition whitespace-nowrap ${activeTab === tab.id ? "bg-stone-100 dark:bg-stone-950 text-orange-600 dark:text-orange-400 border border-b-0 border-stone-200 dark:border-stone-700" : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Sticky, Glassmorphic Mobile Header */}
      <header className="sticky top-0 z-[100] w-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Briefcase className="w-5 h-5 text-orange-500 shrink-0" />
            <h1 className="text-lg font-bold text-stone-900 dark:text-white truncate">
              {trip.name}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Share Link */}
            <button
              onClick={handleCopyLink}
              className="w-10 h-10 flex items-center justify-center bg-stone-50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50 text-stone-600 dark:text-stone-300 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              aria-label="Share trip"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Compact Hamburger Button */}
            <button
              aria-label={isOpenMenu ? "Close menu" : "Open menu"}
              className="w-10 h-10 flex items-center justify-center bg-stone-50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-900 dark:text-white transition relative z-[1070]"
              onClick={() => setIsOpenMenu((s) => !s)}
            >
              <div className="relative flex flex-col justify-between w-4 h-3">
                <div
                  className={`relative w-full h-[2px] transition-all duration-300 ${
                    isOpenMenu ? "rotate-45 top-[5px]" : "top-0"
                  }`}
                >
                  <span className="absolute left-0 bg-stone-900 dark:bg-white w-full h-full rounded" />
                </div>

                <div
                  className={`relative w-full h-[2px] transition-all duration-200 ${
                    isOpenMenu ? "translate-x-4 opacity-0" : ""
                  }`}
                >
                  <span className="absolute left-0 bg-stone-900 dark:bg-white w-full h-full rounded" />
                </div>

                <div
                  className={`relative w-full h-[2px] transition-all duration-300 ${
                    isOpenMenu ? "-rotate-45 -top-[5px]" : "bottom-0"
                  }`}
                >
                  <span className="absolute left-0 bg-stone-900 dark:bg-white w-full h-full rounded" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="md:hidden">
        {/* Backdrop */}
        <div
          aria-hidden={!isOpenMenu}
          onClick={() => setIsOpenMenu(false)}
          className={`fixed inset-0 bg-stone-950/40 backdrop-blur-sm transition-opacity duration-300 z-[1050] ${
            isOpenMenu
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Sidebar Drawer */}
        <aside
          aria-hidden={!isOpenMenu}
          className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-stone-900 shadow-2xl transform transition-transform duration-300 z-[1060] ${
            isOpenMenu ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <nav className="p-6 bg-white dark:bg-stone-900 h-screen flex flex-col justify-between border-l border-stone-200 dark:border-stone-800">
            {/* Top Navigation Options */}
            <div className="space-y-6 overflow-y-auto scrollbar-hide py-4">
              <div className="flex items-center gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
                <Briefcase className="w-5 h-5 text-orange-500 shrink-0" />
                <span className="font-bold text-stone-900 dark:text-white truncate">
                  {trip.name}
                </span>
              </div>

              {/* Current Active User Profile Card */}
              {currentMember && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl flex items-center gap-3 border border-stone-200/20 dark:border-stone-700/20">
                  <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-sm font-semibold shrink-0">
                    {currentMember.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider font-semibold">
                      {t.dashboard.tabs.user}
                    </p>
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">
                      {currentMember.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Navigation list */}
              <ul className="space-y-1.5">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsOpenMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-semibold border-l-4 border-orange-500 shadow-sm"
                            : "text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-50 hover:bg-stone-50 dark:hover:bg-stone-800/40"
                        }`}
                      >
                        <span className={`${isActive ? "text-orange-500" : "text-stone-400 dark:text-stone-500"}`}>
                          {tab.icon}
                        </span>
                        <span>{tab.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Bottom Utilities Footer */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-4 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                {/* Locale Toggle */}
                <button
                  onClick={() => setLocale(locale === "de" ? "en" : "de")}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-stone-50 dark:bg-stone-800/40 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-semibold border border-stone-200/20 dark:border-stone-700/20 transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{locale === "de" ? "DE" : "EN"}</span>
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-stone-50 dark:bg-stone-800/40 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-semibold border border-stone-200/20 dark:border-stone-700/20 transition"
                >
                  {theme === "dark" ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-orange-400" />
                      <span>Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-orange-500" />
                      <span>Light</span>
                    </>
                  )}
                </button>
              </div>

              {/* Members Status Indicator */}
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{t.overview.members}</span>
                </span>
                <span className="font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full text-[10px]">
                  {trip.members.length}
                </span>
              </div>
            </div>
          </nav>
        </aside>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-0 md:py-6">
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

              <BookingsSection tripId={trip.id} bookings={trip.bookings} />
              <NotesSection tripId={trip.id} initialNotes={trip.notes} />
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
            payments={trip.payments}
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
        {activeTab === "calendar" && (
          <DateVoteCalendar
            tripId={trip.id}
            members={trip.members}
            currentMember={currentMember}
          />
        )}
        {activeTab === "packing" && (
          <PackingListPage
            trip={trip}
            currentMember={currentMember}
            onTripUpdated={setTrip}
          />
        )}
        {activeTab === "map" && (
          <RouteMapPage
            trip={trip}
            currentMember={currentMember}
            onTripUpdated={setTrip}
          />
        )}
        {activeTab === "user" && currentMember && (
          <UserSettings
            tripId={trip.id}
            currentMember={currentMember}
            onMemberUpdated={handleMemberUpdated}
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
