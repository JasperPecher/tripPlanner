"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  Trash2,
  AlertTriangle,
  Cloud,
  Server,
  HardDrive,
  ExternalLink,
  Info,
} from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";

type Member = { id: string; name: string; isAdmin: boolean };
type StorageConfig = { id: string; type: string; config: string } | null;
type Trip = {
  id: string;
  name: string;
  description: string | null;
  shareCode: string;
  startDate: string | null;
  endDate: string | null;
  notes: string;
  storageConfig: StorageConfig;
};

interface SettingsPageProps {
  trip: Trip;
  currentMember: Member | null;
  onTripUpdated: (updates: Partial<Trip>) => void;
}

export function SettingsPage({
  trip,
  currentMember,
  onTripUpdated,
}: SettingsPageProps) {
  const router = useRouter();
  const { t } = useLocale();
  const isAdmin = currentMember?.isAdmin || false;

  const [tripInfo, setTripInfo] = useState({
    name: trip.name,
    description: trip.description || "",
    startDate: trip.startDate ? trip.startDate.split("T")[0] : "",
    endDate: trip.endDate ? trip.endDate.split("T")[0] : "",
  });

  const [storage, setStorage] = useState({
    type: trip.storageConfig?.type || "local",
    googlePhotosLink: "",
    synologyShareLink: "",
    synologyRequestLink: "",
  });

  useEffect(() => {
    if (!trip.storageConfig) return;
    fetch(`/api/trips/${trip.id}/storage`)
      .then((res) => res.json())
      .then((data) => {
        if (data.configured && data.credentials) {
          setStorage({
            type: data.type,
            googlePhotosLink: data.credentials.googlePhotosLink || "",
            synologyShareLink: data.credentials.synologyShareLink || "",
            synologyRequestLink: data.credentials.synologyRequestLink || "",
          });
        }
      })
      .catch(() => {});
  }, [trip.id, trip.storageConfig]);

  const [savingTrip, setSavingTrip] = useState(false);
  const [savingStorage, setSavingStorage] = useState(false);
  const [testingStorage, setTestingStorage] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const inputClasses =
    "w-full px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition disabled:opacity-50";
  const labelClasses =
    "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1";
  const cardClasses =
    "bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-800";

  const handleSaveTripInfo = async () => {
    setSavingTrip(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripInfo),
      });
      if (response.ok) {
        const data = await response.json();
        onTripUpdated(data.trip);
        alert(t.settings.tripUpdated);
      }
    } catch (error) {
      alert(t.common.error);
    } finally {
      setSavingTrip(false);
    }
  };

  const handleSaveStorage = async () => {
    setSavingStorage(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}/storage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storage),
      });
      if (response.ok) {
        alert(t.settings.storageSaved);
      }
    } catch (error) {
      alert(t.common.error);
    } finally {
      setSavingStorage(false);
    }
  };

  const handleTestStorage = async () => {
    setTestingStorage(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}/storage/test`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        alert("Connection successful! " + (data.message || ""));
      } else {
        alert("Connection failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      alert(t.common.error);
    } finally {
      setTestingStorage(false);
    }
  };

  const handleDeleteTrip = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        localStorage.removeItem(`trip_${trip.id}_member`);
        alert(t.settings.tripDeleted);
        router.push("/");
      }
    } catch (error) {
      alert(t.common.error);
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl">
        <div className={cardClasses}>
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            {t.settings.title}
          </h2>
          <p className="text-stone-600 dark:text-stone-400">
            {t.settings.adminOnly}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className={cardClasses}>
        <h2 className="text-lg font-semibold mb-6 dark:text-white">
          {t.settings.tripInfo}
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>{t.settings.tripName}</label>
            <input
              type="text"
              value={tripInfo.name}
              onChange={(e) =>
                setTripInfo({ ...tripInfo, name: e.target.value })
              }
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>{t.settings.description}</label>
            <textarea
              value={tripInfo.description}
              onChange={(e) =>
                setTripInfo({ ...tripInfo, description: e.target.value })
              }
              className={inputClasses + " resize-none"}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>{t.settings.startDate}</label>
              <input
                type="date"
                value={tripInfo.startDate}
                onChange={(e) =>
                  setTripInfo({ ...tripInfo, startDate: e.target.value })
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>{t.settings.endDate}</label>
              <input
                type="date"
                value={tripInfo.endDate}
                onChange={(e) =>
                  setTripInfo({ ...tripInfo, endDate: e.target.value })
                }
                className={inputClasses}
              />
            </div>
          </div>
          <button
            onClick={handleSaveTripInfo}
            disabled={savingTrip}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50"
          >
            {savingTrip ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t.settings.saveTripInfo}
          </button>
        </div>
      </div>

      <div className={cardClasses}>
        <h2 className="text-lg font-semibold mb-6 dark:text-white">
          {t.settings.storageConfig}
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>{t.settings.storageType}</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "local", icon: HardDrive, label: t.settings.local },
                { value: "google", icon: Cloud, label: t.settings.google },
                { value: "synology", icon: Server, label: t.settings.synology },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStorage({ ...storage, type: value })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition ${
                    storage.type === value
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                      : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {storage.type === "google" && (
            <div className="space-y-4">
              <div>
                <label className={labelClasses}>
                  {t.settings.googlePhotosLink}
                </label>
                <input
                  type="url"
                  value={storage.googlePhotosLink}
                  onChange={(e) =>
                    setStorage({ ...storage, googlePhotosLink: e.target.value })
                  }
                  className={inputClasses}
                  placeholder="https://photos.app.goo.gl/..."
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {t.settings.googlePhotosLinkDesc}
                </p>
              </div>
            </div>
          )}

          {storage.type === "synology" && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-300">
                      {t.settings.synologyHowTo}
                    </h4>
                    <ol className="text-sm text-blue-700 dark:text-blue-400 mt-2 list-decimal list-inside space-y-1">
                      <li>{t.settings.synologyStep1}</li>
                      <li>{t.settings.synologyStep2}</li>
                      <li>{t.settings.synologyStep3}</li>
                      <li>{t.settings.synologyStep4}</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClasses}>
                  {t.settings.synologyShareLink}
                </label>
                <input
                  type="url"
                  value={storage.synologyShareLink}
                  onChange={(e) =>
                    setStorage({
                      ...storage,
                      synologyShareLink: e.target.value,
                    })
                  }
                  className={inputClasses}
                  placeholder="https://your-nas:5000/sharing/XXXXX"
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {t.settings.synologyShareLinkDesc}
                </p>
              </div>

              <div>
                <label className={labelClasses}>
                  {t.settings.synologyRequestLink}
                </label>
                <input
                  type="url"
                  value={storage.synologyRequestLink}
                  onChange={(e) =>
                    setStorage({
                      ...storage,
                      synologyRequestLink: e.target.value,
                    })
                  }
                  className={inputClasses}
                  placeholder="https://your-nas:5000/sharing/XXXXX"
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {t.settings.synologyRequestLinkDesc}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSaveStorage}
              disabled={savingStorage}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50"
            >
              {savingStorage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t.settings.saveStorage}
            </button>
            {trip.storageConfig && (
              <button
                onClick={handleTestStorage}
                disabled={testingStorage}
                className="flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 font-medium disabled:opacity-50 text-stone-700 dark:text-stone-300"
              >
                {testingStorage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Server className="w-4 h-4" />
                )}
                Test Connection
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-red-200 dark:border-red-900">
        <h2 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {t.settings.dangerZone}
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
          {t.settings.deleteWarning}
        </p>
        {showDeleteConfirm ? (
          <div className="flex gap-3">
            <button
              onClick={handleDeleteTrip}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {t.common.confirm}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              {t.common.cancel}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            {t.settings.deleteTrip}
          </button>
        )}
      </div>
    </div>
  );
}
