import { mapBookedSlotsToCalendarEvents } from "@/services/bookings/utils/bookingSlotUtils.js";

/**
 * Flattens the nested `eventSnapshot` / `eventCurrent` shape a booking comes back
 * with into the flat keys `mapBookedSlotsToCalendarEvents` expects.
 */
export function normalizeBookingForCalendar(value = {}) {
  const eventSnapshot = value.eventSnapshot && typeof value.eventSnapshot === "object" ? value.eventSnapshot : {};
  const eventCurrent = value.eventCurrent && typeof value.eventCurrent === "object" ? value.eventCurrent : {};
  return {
    ...value,
    startIso: value.startIso || value.startAtIso || value.startAt || "",
    endIso: value.endIso || value.endAtIso || value.endAt || "",
    eventTitle: value.eventTitle || eventSnapshot.title || eventCurrent.title || "",
    eventType: value.eventType || eventSnapshot.eventType || eventSnapshot.type || eventCurrent.eventType || eventCurrent.type || "",
    eventCallType: value.eventCallType || eventSnapshot.eventCallType || eventCurrent.eventCallType || "",
    eventColorSkin: value.eventColorSkin || eventSnapshot.eventColorSkin || eventCurrent.eventColorSkin || "",
  };
}

/**
 * Turns a booking into the calendar-event shape the booking detail popup and the
 * `bookingJoinUtils` helpers read (`getCalendarEventJoinState` /
 * `getCalendarEventApprovalState`). Returns `null` when the booking has no usable
 * schedule.
 */
export function toCalendarEvent(booking, { titleFallback = "" } = {}) {
  if (!booking || typeof booking !== "object") return null;
  return mapBookedSlotsToCalendarEvents([normalizeBookingForCalendar(booking)], {
    titleFallback,
  })[0] || null;
}
