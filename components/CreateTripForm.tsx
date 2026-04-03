"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";

export function CreateTripForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    adminName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(
          `trip_${data.trip.id}_member`,
          JSON.stringify({ id: data.memberId, name: formData.adminName }),
        );
        router.push(`/trip/${data.trip.id}`);
      } else {
        alert(data.error || t.common.error);
      }
    } catch (error) {
      alert(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {loading ? (
        <div className="h-100 content-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mt-auto"></div>
        </div>
      ) : (
        <div>
          <div>
            <label
              htmlFor="adminName"
              className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
            >
              {t.home.adminName}
            </label>
            <input
              id="adminName"
              type="text"
              required
              value={formData.adminName}
              onChange={(e) =>
                setFormData({ ...formData, adminName: e.target.value })
              }
              className={inputClasses}
              placeholder={t.home.adminNamePlaceholder}
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
            >
              {t.home.tripName}
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={inputClasses}
              placeholder={t.home.tripNamePlaceholder}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
            >
              {t.home.description}
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={inputClasses + " resize-none"}
              rows={2}
              placeholder={t.home.descriptionPlaceholder}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
              >
                {t.home.startDate}
              </label>
              <input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
              >
                {t.home.endDate}
              </label>
              <input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className={inputClasses}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            t.home.createButton
          </button>
        </div>
      )}
    </form>
  );
}
