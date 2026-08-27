import { mapSingleEventFromResponse } from "@/services/events/mappers/fetchCreatorEventsMapper.js";
import { buildBookedSlotsIndex } from "@/services/bookings/utils/bookingSlotUtils.js";

export function mapFetchCreatorBookingContextFromResponse(responseData = {}) {
  const rawEvents = Array.isArray(responseData.rawEvents) ? responseData.rawEvents : [];
  const bookedSlots = Array.isArray(responseData.bookedSlots) ? responseData.bookedSlots : [];
  const temporaryHoldSlots = (Array.isArray(responseData.temporaryHoldSlots) ? responseData.temporaryHoldSlots : [])
    .filter((slot) => {
      const expiresAtMs = Date.parse(slot?.expiresAt || "");
      return Number.isFinite(expiresAtMs) && expiresAtMs > Date.now();
    });

  const events = rawEvents.map((item) => mapSingleEventFromResponse(item));
  const bookedSlotsIndex = buildBookedSlotsIndex(bookedSlots);
  const temporaryHoldSlotsIndex = buildBookedSlotsIndex(temporaryHoldSlots);

  return {
    events,
    rawEvents,
    bookedSlots,
    bookedSlotsIndex,
    temporaryHoldSlots,
    temporaryHoldSlotsIndex,
    temporaryHoldAvailabilityStale: responseData?.temporaryHoldAvailabilityStale === true,
    isFirstBookingForCreator: responseData?.isFirstBookingForCreator ?? null,
    eventBookingCountsByEventId: responseData?.eventBookingCountsByEventId || {},
    stats: responseData?.stats || {},
    meta: {
      fetchedAt: Date.now(),
      eventsCount: events.length,
      bookedSlotsCount: bookedSlots.length,
      temporaryHoldSlotsCount: temporaryHoldSlots.length,
    },
  };
}
