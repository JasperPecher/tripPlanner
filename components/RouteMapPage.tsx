"use client";

import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Plus,
  Trash,
  Calendar,
  MapPin,
  Loader2,
  Edit,
  Check,
  ArrowUp,
  ArrowDown,
  Car,
  Plane,
  Train,
  Bus,
  Footprints,
} from "lucide-react";
import { renderToString } from "react-dom/server";
import { useLocale } from "@/lib/LocaleContext";
import { formatDate } from "@/lib/utils";

// Fix for default marker icon issue in Leaflet + Next.js
// We'll use a custom divIcon with Lucide icons instead!

type RoutePoint = {
  id: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  date: string | null;
  order: number;
  travelType?: string | null;
};

type Trip = {
  id: string;
  routePoints: RoutePoint[];
};

export interface RouteMapPageProps {
  trip: Trip;
  currentMember: any;
  onTripUpdated: (updatedTrip: any) => void;
}

export default function RouteMapPage({
  trip,
  currentMember,
  onTripUpdated,
}: RouteMapPageProps) {
  const { t } = useLocale();
  const [points, setPoints] = useState<RoutePoint[]>(trip.routePoints || []);
  const [newPoint, setNewPoint] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationName, setLocationName] = useState("");
  const [date, setDate] = useState("");
  const [travelType, setTravelType] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [editLocationName, setEditLocationName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTravelType, setEditTravelType] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  const travelTypes = [
    { id: "Car", icon: Car, label: "Car" },
    { id: "Plane", icon: Plane, label: "Plane" },
    { id: "Train", icon: Train, label: "Train" },
    { id: "Bus", icon: Bus, label: "Bus" },
    { id: "Walk", icon: Footprints, label: "Walk" },
  ];

  useEffect(() => {
    setPoints(trip.routePoints || []);
  }, [trip.routePoints]);

  const handleAddPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoint || !locationName.trim() || adding) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}/route-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: locationName.trim(),
          latitude: newPoint.lat,
          longitude: newPoint.lng,
          date: date || null,
          order: points.length,
          travelType: travelType || null,
        }),
      });

      if (response.ok) {
        const createdPoint = await response.json();
        onTripUpdated({
          ...trip,
          routePoints: [...points, createdPoint].sort((a, b) => {
            if (a.date && b.date) {
              const dateDiff =
                new Date(a.date).getTime() - new Date(b.date).getTime();
              if (dateDiff !== 0) return dateDiff;
            } else if (a.date) return -1;
            else if (b.date) return 1;
            return a.order - b.order;
          }),
        });
        setNewPoint(null);
        setLocationName("");
        setDate("");
        setTravelType("");
      }
    } catch (error) {
      console.error("Error adding route point:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePoint = async (pointId: string) => {
    if (!confirm(t.map.deleteConfirm || "Are you sure?")) return;

    try {
      const response = await fetch(
        `/api/trips/${trip.id}/route-points/${pointId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        onTripUpdated({
          ...trip,
          routePoints: points.filter((p) => p.id !== pointId),
        });
      }
    } catch (error) {
      console.error("Error deleting route point:", error);
    }
  };

  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;

    setSearching(true);
    setSearchResults([]);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        if (data.length === 0) {
          alert("No results found");
        }
      }
    } catch (error) {
      console.error("Error searching address:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    setNewPoint({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setLocationName(result.display_name.split(",")[0]); // Take the first part as name
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleEditClick = (point: RoutePoint) => {
    setEditingPointId(point.id);
    setEditLocationName(point.location);
    setEditDate(point.date ? point.date.split("T")[0] : "");
    setEditTravelType(point.travelType || "");
  };

  const handleUpdatePoint = async (pointId: string) => {
    if (!editLocationName.trim() || updating) return;

    setUpdating(true);
    try {
      const response = await fetch(
        `/api/trips/${trip.id}/route-points/${pointId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: editLocationName.trim(),
            date: editDate || null,
            travelType: editTravelType || null,
          }),
        },
      );

      if (response.ok) {
        const updatedPoint = await response.json();
        onTripUpdated({
          ...trip,
          routePoints: points
            .map((p) => (p.id === pointId ? updatedPoint : p))
            .sort((a, b) => {
              if (a.date && b.date) {
                const dateDiff =
                  new Date(a.date).getTime() - new Date(b.date).getTime();
                if (dateDiff !== 0) return dateDiff;
              } else if (a.date) return -1;
              else if (b.date) return 1;
              return a.order - b.order;
            }),
        });
        setEditingPointId(null);
      }
    } catch (error) {
      console.error("Error updating route point:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleMovePoint = async (pointId: string, direction: "up" | "down") => {
    // Sort points properly by current visual order to ensure no duplicate index issues
    const sortedPoints = [...points].sort((a, b) => {
      if (a.date && b.date) {
        const dateDiff =
          new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
      } else if (a.date) return -1;
      else if (b.date) return 1;
      return a.order - b.order;
    });

    const index = sortedPoints.findIndex((p) => p.id === pointId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedPoints.length) return;

    // Swap elements in array
    const temp = sortedPoints[index];
    sortedPoints[index] = sortedPoints[targetIndex];
    sortedPoints[targetIndex] = temp;

    // Reassign sequential orders to fix any previous duplicate/gap issues
    const updatedPoints = sortedPoints.map((p, i) => ({ ...p, order: i }));

    try {
      // Optimistic update
      setPoints(updatedPoints);

      // Save to API (batch update)
      await fetch(`/api/trips/${trip.id}/route-points/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointIds: updatedPoints.map((p) => p.id) }),
      });

      // Notify parent
      onTripUpdated({
        ...trip,
        routePoints: updatedPoints,
      });
    } catch (error) {
      console.error("Error moving route point:", error);
      // Revert on error
      setPoints(points);
    }
  };

  // Component to handle map clicks
  function MapEvents() {
    useMapEvents({
      click(e) {
        setNewPoint(e.latlng);
      },
    });
    return null;
  }

  const activePoints = points.filter(
    (p) => p.latitude !== null && p.longitude !== null,
  );

  const sortedActivePoints = [...activePoints].sort((a, b) => {
    if (a.date && b.date) {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
    } else if (a.date) return -1;
    else if (b.date) return 1;
    return a.order - b.order;
  });

  const polylinePositions = sortedActivePoints.map(
    (p) => [p.latitude!, p.longitude!] as [number, number],
  );

  // Center of the map (default to first point or center of Europe)
  const center =
    activePoints.length > 0
      ? ([activePoints[0].latitude!, activePoints[0].longitude!] as [
          number,
          number,
        ])
      : ([51.03, 13.44] as [number, number]); // Dresden

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-800 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            {t.map.title || "Route Map"}
          </h2>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {t.map.clickToToggle || "Click on map to add a stop"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2 h-100 lg:h-[calc(100vh-20rem)] lg:min-h-125 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
            <MapContainer
              center={center}
              zoom={5}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapEvents />

              {activePoints.map((point) => {
                const mapPinHtml = renderToString(<MapPin size={14} className="text-white" />);
                
                return (
                <Marker
                  key={point.id}
                  position={[point.latitude!, point.longitude!]}
                  icon={L.divIcon({
                    className: "custom-div-icon",
                    html: `
                      <div class="flex flex-col items-center" style="transform: translate(-50%, -100%);">
                        <div class="bg-white dark:bg-stone-800 px-2 py-0.5 rounded shadow-md border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-white whitespace-nowrap mb-1">
                          ${point.location}
                        </div>
                        <div class="bg-orange-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white flex items-center justify-center">
                          ${mapPinHtml}
                        </div>
                      </div>
                    `,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0],
                  })}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-semibold text-stone-800">
                        {point.location}
                      </p>
                      {point.date && (
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(point.date)}
                        </p>
                      )}
                      {point.travelType && (
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                          {(() => {
                            const Icon =
                              travelTypes.find((t) => t.id === point.travelType)
                                ?.icon || MapPin;
                            return <Icon className="w-3 h-3" />;
                          })()}
                          {point.travelType}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )})}

              {polylinePositions.length > 1 && (
                <Polyline
                  positions={polylinePositions}
                  color="#f97316"
                  weight={3}
                  opacity={0.7}
                />
              )}
              
              {sortedActivePoints.map((point, index) => {
                if (index === 0 || !point.travelType) return null;
                const prevPoint = sortedActivePoints[index - 1];
                
                // Shift the position slightly based on index to avoid overlaps on same segments
                // Using 0.35, 0.5, 0.65 of the way along the line
                const fraction = 0.35 + (index % 3) * 0.15; 
                const midLat = prevPoint.latitude! + (point.latitude! - prevPoint.latitude!) * fraction;
                const midLng = prevPoint.longitude! + (point.longitude! - prevPoint.longitude!) * fraction;
                
                const Icon = travelTypes.find(t => t.id === point.travelType)?.icon || MapPin;
                // Force inline style or use parent div to ensure currentColor works
                const iconHtml = renderToString(<Icon size={16} strokeWidth={2.5} />);
                
                return (
                  <Marker
                    key={`mid-${point.id}`}
                    position={[midLat, midLng]}
                    icon={L.divIcon({
                      className: "custom-div-icon",
                      html: `
                        <div class="bg-white dark:bg-stone-800 text-orange-500 p-1 rounded-full shadow-md border border-stone-200 dark:border-stone-700 flex items-center justify-center" style="transform: translate(-50%, -50%); width: 26px; height: 26px;">
                          ${iconHtml}
                        </div>
                      `,
                      iconSize: [0, 0],
                      iconAnchor: [0, 0],
                    })}
                  />
                );
              })}
            </MapContainer>
          </div>

          {/* Sidebar / List */}
          <div className="space-y-4 flex flex-col lg:h-[calc(100vh-20rem)] lg:min-h-125">
            {/* Address Search */}
            <form
              onSubmit={handleSearchAddress}
              className="bg-stone-50 dark:bg-stone-900 p-4 rounded-lg border border-stone-200 dark:border-stone-700 space-y-3"
            >
              <p className="text-sm font-medium text-stone-700 dark:text-white flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {t.map.title || "Search"}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.map.locationName || "Location name"}
                  className="flex-1 px-3 py-1.5 text-sm rounded border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 focus:outline-none disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 text-xs space-y-1 max-h-37.5 overflow-y-auto bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-1">
                  {searchResults.map((result: any) => (
                    <button
                      key={result.place_id}
                      type="button"
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left px-2 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded truncate text-stone-700 dark:text-stone-200"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {newPoint && (
              <form
                onSubmit={handleAddPoint}
                className="bg-stone-50 dark:bg-stone-900 p-4 rounded-lg border border-orange-200 dark:border-orange-900 space-y-3"
              >
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Plus className="w-4 h-4" />{" "}
                  {t.map.addStop || "Add Stop Here"}
                </p>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={t.map.locationName || "Location name"}
                  className="w-full px-3 py-1.5 text-sm rounded border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-2 mb-2">
                  {travelTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setTravelType(travelType === type.id ? "" : type.id)
                      }
                      className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                        travelType === type.id
                          ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300 border border-orange-300 dark:border-orange-700"
                          : "bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
                      }`}
                      title={type.label}
                    >
                      <type.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={adding || !locationName.trim()}
                    className="flex-1 px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 focus:outline-none disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {adding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPoint(null)}
                    className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-sm rounded hover:bg-stone-300 dark:hover:bg-stone-600 focus:outline-none"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3 flex-1 min-h-0 max-h-100 lg:max-h-none overflow-y-auto pr-2">
              {points.length === 0 ? (
                <p className="text-center text-stone-500 dark:text-stone-400 py-4 text-sm">
                  {t.map.noItems || "No stops added yet."}
                </p>
              ) : (
                points.map((point, index) => (
                  <div
                    key={point.id}
                    className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700"
                  >
                    {editingPointId === point.id ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editLocationName}
                          onChange={(e) => setEditLocationName(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <div className="flex gap-1.5 mb-1">
                          {travelTypes.map((type) => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() =>
                                setEditTravelType(
                                  editTravelType === type.id ? "" : type.id,
                                )
                              }
                              className={`p-1 rounded flex items-center justify-center transition-colors ${
                                editTravelType === type.id
                                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300 border border-orange-300 dark:border-orange-700"
                                  : "bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
                              }`}
                              title={type.label}
                            >
                              <type.icon className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleUpdatePoint(point.id)}
                            disabled={updating || !editLocationName.trim()}
                            className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
                          >
                            {updating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPointId(null)}
                            className="text-xs px-2 py-1 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded hover:bg-stone-300 dark:hover:bg-stone-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-700 dark:text-white truncate">
                            {point.location}
                          </p>
                          {point.date && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {formatDate(point.date)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {point.travelType && (
                            <div
                              className="text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 p-1 rounded-full shrink-0"
                              title={point.travelType}
                            >
                              {(() => {
                                const Icon =
                                  travelTypes.find(
                                    (t) => t.id === point.travelType,
                                  )?.icon || MapPin;
                                return <Icon className="w-4 h-4" />;
                              })()}
                            </div>
                          )}
                          <div className="flex items-center gap-1 ml-1 border-l border-stone-200 dark:border-stone-700 pl-2">
                            <button
                              onClick={() => handleMovePoint(point.id, "up")}
                              disabled={index === 0}
                              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 focus:outline-none disabled:opacity-30"
                              title="Move up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMovePoint(point.id, "down")}
                              disabled={index === points.length - 1}
                              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 focus:outline-none disabled:opacity-30"
                              title="Move down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(point)}
                              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 focus:outline-none ml-1"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePoint(point.id)}
                              className="text-stone-400 hover:text-red-500 focus:outline-none"
                              title="Delete"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
