"use client";

import { useState } from "react";
import {
  Plus,
  Plane,
  Hotel,
  Car,
  Ticket,
  X,
  Loader2,
  MapPin,
  Calendar,
  Pen,
  TrainFrontIcon,
} from "lucide-react";
import { formatDateTime, formatCurrency, toLocalInput } from "@/lib/utils";
import { useLocale } from "@/lib/LocaleContext";

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
interface BookingsSectionProps {
  tripId: string;
  bookings: Booking[];
}

const typeIcons: Record<string, React.ElementType> = {
  hotel: Hotel,
  flight: Plane,
  train: TrainFrontIcon,
  car: Car,
  activity: Ticket,
  other: MapPin,
};

export function BookingsSection({
  tripId,
  bookings: initialBookings,
}: BookingsSectionProps) {
  const { t } = useLocale();
  const [bookings, setBookings] = useState(initialBookings);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: "new",
    title: "",
    description: "",
    type: "hotel",
    reference: "",
    checkIn: "",
    checkOut: "",
    location: "",
    price: "",
    currency: "EUR",
  });

  const bookingTypes = [
    { value: "hotel", label: t.bookings.types.hotel, icon: Hotel },
    { value: "flight", label: t.bookings.types.flight, icon: Plane },
    { value: "train", label: t.bookings.types.train, icon: TrainFrontIcon },
    { value: "car", label: t.bookings.types.car, icon: Car },
    { value: "activity", label: t.bookings.types.activity, icon: Ticket },
    { value: "other", label: t.bookings.types.other, icon: MapPin },
  ];

  const inputClasses =
    "w-full p-0 md:px-2 md:px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-xs md:text-base tracking-tighter text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none";

  const handleAddBooking = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
        }),
      });
      if (response.ok) {
        const newBooking = await response.json();
        setBookings([newBooking, ...bookings]);
        setShowForm(false);
        setFormData({
          id: "new",
          title: "",
          description: "",
          type: "hotel",
          reference: "",
          checkIn: "",
          checkOut: "",
          location: "",
          price: "",
          currency: "EUR",
        });
      }
    } catch (error) {
      alert(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(
        `/api/trips/${tripId}/bookings/${formData.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            price: formData.price ? parseFloat(formData.price) : null,
          }),
        },
      );
      if (response.ok) {
        const updatedBooking = await response.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)),
        );
        setShowForm(false);
        setFormData({
          id: "new",
          title: "",
          description: "",
          type: "hotel",
          reference: "",
          checkIn: "",
          checkOut: "",
          location: "",
          price: "",
          currency: "EUR",
        });
      }
    } catch (error) {
      alert(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm(t.common.delete + "?")) return;
    try {
      const response = await fetch(
        `/api/trips/${tripId}/bookings/${bookingId}`,
        { method: "DELETE" },
      );
      if (response.ok) setBookings(bookings.filter((b) => b.id !== bookingId));
    } catch (error) {
      alert(t.common.error);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl p-2 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Ticket className="w-5 h-5 text-orange-500" />
          {t.bookings.title}
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-0 md:gap-1 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400"
        >
          <Plus className="w-4 h-4" />
          {t.common.add}
        </button>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-70 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                {t.bookings.form.addTitle}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t.bookings.form.type}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {bookingTypes.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: value })}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition ${formData.type === value ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"}`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t.bookings.form.title}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={inputClasses}
                  placeholder={t.bookings.form.titlePlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t.bookings.form.reference}
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  className={inputClasses}
                  placeholder={t.bookings.form.referencePlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t.bookings.form.location}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className={inputClasses}
                  placeholder={t.bookings.form.locationPlaceholder}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.bookings.form.checkIn}
                  </label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(formData.checkIn)}
                    onChange={(e) =>
                      setFormData({ ...formData, checkIn: e.target.value })
                    }
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.bookings.form.checkOut}
                  </label>
                  <input
                    type="datetime-local"
                    value={toLocalInput(formData.checkOut)}
                    onChange={(e) =>
                      setFormData({ ...formData, checkOut: e.target.value })
                    }
                    className={inputClasses}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.bookings.form.price}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className={inputClasses}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.bookings.form.currency}
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className={inputClasses}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t.bookings.form.description}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={inputClasses + " resize-none"}
                  rows={2}
                  placeholder={t.bookings.form.descriptionPlaceholder}
                />
              </div>
              {formData.id !== "new" ? (
                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleUpdateBooking}
                  className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    t.common.save
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleAddBooking}
                  className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    t.bookings.form.addButton
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {bookings.length === 0 ? (
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          {t.bookings.noBookings}
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const Icon = typeIcons[booking.type] || MapPin;
            return (
              <div
                key={booking.id}
                className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg group"
              >
                <div className="p-2 bg-white dark:bg-stone-700 rounded-lg shadow-sm">
                  <Icon className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-stone-900 dark:text-white">
                      {booking.title}
                    </h4>
                    {booking.reference && (
                      <span className="text-xs bg-stone-200 dark:bg-stone-600 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded">
                        {booking.reference}
                      </span>
                    )}
                  </div>
                  {booking.location && (
                    <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {booking.location}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-stone-500 dark:text-stone-400">
                    {booking.checkIn && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(booking.checkIn)}
                        {booking.checkOut && (
                          <> &rarr; {formatDateTime(booking.checkOut)}</>
                        )}
                      </span>
                    )}
                    {!booking.checkIn && booking.checkOut && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(booking.checkOut)}
                      </span>
                    )}
                    {booking.price && (
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        {formatCurrency(booking.price, booking.currency)}
                      </span>
                    )}
                  </div>
                  {booking.description && (
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 whitespace-pre-wrap break-all">
                      {booking.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      (setShowForm(true),
                        console.log(booking),
                        setFormData({
                          id: booking.id,
                          title: booking.title,
                          description: booking.description || "",
                          type: booking.type,
                          reference: booking.reference || "",
                          checkIn: booking.checkIn || "",
                          checkOut: booking.checkOut || "",
                          location: booking.location || "",
                          price: String(booking.price) || "",
                          currency: booking.currency,
                        }));
                    }}
                    className="text-stone-400 hover:text-red-500 transition p-1"
                  >
                    <Pen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(booking.id)}
                    className="text-stone-400 hover:text-red-500 transition p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
