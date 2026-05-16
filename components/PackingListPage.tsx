"use client";

import { useState } from "react";
import { Plus, Trash, Check, Square, Briefcase, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/LocaleContext";

type Member = {
  id: string;
  name: string;
};

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
  members: Member[];
  packingItems: PackingItem[];
};

interface PackingListPageProps {
  trip: Trip;
  currentMember: Member | null;
  onTripUpdated: (updatedTrip: any) => void;
}

export default function PackingListPage({
  trip,
  currentMember,
  onTripUpdated,
}: PackingListPageProps) {
  const { t } = useLocale();
  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || adding) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}/packing-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: newItemName.trim() }),
      });

      if (response.ok) {
        const newItem = await response.json();
        onTripUpdated({
          ...trip,
          packingItems: [...trip.packingItems, newItem],
        });
        setNewItemName("");
      }
    } catch (error) {
      console.error("Error adding packing item:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleTogglePacked = async (itemId: string, currentPacked: boolean) => {
    setUpdatingItemId(itemId);
    try {
      const response = await fetch(`/api/trips/${trip.id}/packing-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packed: !currentPacked }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        onTripUpdated({
          ...trip,
          packingItems: trip.packingItems.map((item) =>
            item.id === itemId ? updatedItem : item
          ),
        });
      }
    } catch (error) {
      console.error("Error toggling packed status:", error);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleAssignMember = async (itemId: string, memberId: string | null) => {
    setUpdatingItemId(itemId);
    try {
      const response = await fetch(`/api/trips/${trip.id}/packing-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: memberId }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        onTripUpdated({
          ...trip,
          packingItems: trip.packingItems.map((item) =>
            item.id === itemId ? updatedItem : item
          ),
        });
      }
    } catch (error) {
      console.error("Error assigning member:", error);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t.expenses.deleteConfirm)) return;

    setUpdatingItemId(itemId);
    try {
      const response = await fetch(`/api/trips/${trip.id}/packing-items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onTripUpdated({
          ...trip,
          packingItems: trip.packingItems.filter((item) => item.id !== itemId),
        });
      }
    } catch (error) {
      console.error("Error deleting packing item:", error);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const packedCount = trip.packingItems.filter((i) => i.packed).length;
  const totalCount = trip.packingItems.length;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-500" />
            {t.dashboard.tabs.packingList}
          </h2>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {packedCount} / {totalCount} {t.packing.packed}
          </span>
        </div>

        <form onSubmit={handleAddItem} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={t.packing.addItemPlaceholder}
            className="flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={adding}
          />
          <button
            type="submit"
            disabled={adding || !newItemName.trim()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 flex items-center gap-2"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t.packing.add}
          </button>
        </form>

        <div className="space-y-3">
          {trip.packingItems.length === 0 ? (
            <p className="text-center text-stone-500 dark:text-stone-400 py-4">
              {t.packing.noItems}
            </p>
          ) : (
            trip.packingItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.packed
                    ? "bg-stone-50 dark:bg-stone-950 border-stone-100 dark:border-stone-800"
                    : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => handleTogglePacked(item.id, item.packed)}
                    disabled={updatingItemId === item.id}
                    className="text-orange-500 hover:text-orange-600 focus:outline-none"
                  >
                    {item.packed ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <span
                    className={`text-sm ${
                      item.packed
                        ? "text-stone-400 dark:text-stone-500 line-through"
                        : "text-stone-700 dark:text-stone-200"
                    }`}
                  >
                    {item.item}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={item.assignedToId || ""}
                    onChange={(e) => handleAssignMember(item.id, e.target.value || null)}
                    disabled={updatingItemId === item.id}
                    className="text-xs px-2 py-1 rounded border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">{t.packing.unassigned}</option>
                    {trip.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={updatingItemId === item.id}
                    className="text-stone-400 hover:text-red-500 focus:outline-none"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
