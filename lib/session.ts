export const SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days (~3 months)

export function getTripMemberCookieName(tripId: string): string {
  return `trip_${tripId}_member`;
}

export interface TripMemberSession {
  id: string;
  name: string;
}

/**
 * Sets the member session in both document.cookie (valid for 3 months) and localStorage.
 */
export function setTripMemberSession(
  tripId: string,
  member: TripMemberSession
): void {
  if (typeof window === "undefined") return;

  const cookieName = getTripMemberCookieName(tripId);
  const jsonValue = JSON.stringify({ id: member.id, name: member.name });
  const encoded = encodeURIComponent(jsonValue);

  // Set cookie for 3 months
  document.cookie = `${cookieName}=${encoded}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;

  try {
    localStorage.setItem(cookieName, jsonValue);
  } catch (e) {
    console.error("Failed to write to localStorage", e);
  }
}

/**
 * Clears the member session from both cookies and localStorage.
 */
export function clearTripMemberSession(tripId: string): void {
  if (typeof window === "undefined") return;

  const cookieName = getTripMemberCookieName(tripId);
  document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;

  try {
    localStorage.removeItem(cookieName);
  } catch (e) {
    console.error("Failed to remove from localStorage", e);
  }
}

/**
 * Retrieves the member session from localStorage if available.
 */
export function getTripMemberFromLocalStorage(
  tripId: string
): TripMemberSession | null {
  if (typeof window === "undefined") return null;

  try {
    const item = localStorage.getItem(getTripMemberCookieName(tripId));
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (parsed && typeof parsed.id === "string") {
      return { id: parsed.id, name: parsed.name || "" };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Parses the member session from a raw cookie value (used server-side or client-side).
 */
export function parseTripMemberCookie(
  cookieValue?: string | null
): TripMemberSession | null {
  if (!cookieValue) return null;
  try {
    const decoded = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.id === "string") {
      return { id: parsed.id, name: parsed.name || "" };
    }
  } catch {
    // If it was stored without URI encoding
    try {
      const parsed = JSON.parse(cookieValue);
      if (parsed && typeof parsed.id === "string") {
        return { id: parsed.id, name: parsed.name || "" };
      }
    } catch {
      return null;
    }
  }
  return null;
}
