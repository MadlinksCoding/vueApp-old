import { mapSingleEventFromResponse } from "@/services/events/mappers/fetchCreatorEventsMapper.js";
import { buildBookedSlotsIndex } from "@/services/bookings/utils/bookingSlotUtils.js";

export function mapFetchDashboardBookingContextFromResponse(responseData = {}) {
  const rawEvents = Array.isArray(responseData.rawEvents) ? responseData.rawEvents : [];
  const bookedSlots = Array.isArray(responseData.bookedSlots) ? responseData.bookedSlots : [];
  const widgetBookedSlots = Array.isArray(responseData.widgetBookedSlots)
    ? responseData.widgetBookedSlots
    : null;

  const events = rawEvents.map((item) => mapSingleEventFromResponse(item));
  const bookedSlotsIndex = buildBookedSlotsIndex(bookedSlots);

  return {
    events,
    rawEvents,
    bookedSlots,
    widgetBookedSlots,
    bookedSlotsIndex,
    stats: responseData?.stats || {},
    widgetStats: responseData?.widgetStats || {},
    meta: {
      fetchedAt: Date.now(),
      eventsCount: events.length,
      bookedSlotsCount: bookedSlots.length,
      widgetBookedSlotsCount: widgetBookedSlots?.length || 0,
    },
  };
}
