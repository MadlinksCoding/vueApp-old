import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus, getEtag, isApiNotModified } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { getBookingsApiBaseUrl, asFlowError, toNumber } from "@/services/bookings/bookingsApiUtils.js";
import { fetchAllBookedSlotPages } from "@/services/bookings/utils/fetchAllBookedSlotPages.js";

function buildEventsParams(payload = {}) {
  return {
    creatorId: payload.creatorId,
    status: payload.status || "active",
    limit: payload.limit,
    next: payload.next,
  };
}

function buildBookedSlotParams(payload = {}, { includeEventId = false } = {}) {
  const eventId = payload.eventId == null ? "" : String(payload.eventId).trim();
  const params = {
    fromIso: payload.fromIso,
    toIso: payload.toIso,
    periodMonths: payload.periodMonths,
    limit: payload.slotLimit,
    statusIn: payload.statusIn,
  };

  if (includeEventId && eventId) {
    params.eventId = eventId;
  }

  return params;
}

function resolveBookedSlotsEndpoint(baseUrl, payload = {}) {
  const creatorId = toNumber(payload.creatorId, null);

  return `${baseUrl}/bookings/creators/${creatorId}/booked-slots`;
}

function readCachedRawEvents(context) {
  const engine = context?.stateEngine;
  if (!engine || typeof engine.getState !== "function") return [];

  const cached = engine.getState("fanBooking.catalog.rawEvents");
  return Array.isArray(cached) ? cached : [];
}

function readCachedBookedSlots(context) {
  const engine = context?.stateEngine;
  if (!engine || typeof engine.getState !== "function") return [];

  const cached = engine.getState("fanBooking.catalog.bookedSlots");
  return Array.isArray(cached) ? cached : [];
}

function readCachedTemporaryHoldSlots(context) {
  const engine = context?.stateEngine;
  if (!engine || typeof engine.getState !== "function") return [];
  const cached = engine.getState("fanBooking.catalog.temporaryHoldSlots");
  return Array.isArray(cached) ? cached : [];
}

function retainUnexpiredTemporaryHoldSlots(slots = [], nowMs = Date.now()) {
  return (Array.isArray(slots) ? slots : []).filter((slot) => {
    const expiresAtMs = Date.parse(slot?.expiresAt || "");
    return Number.isFinite(expiresAtMs) && expiresAtMs > nowMs;
  });
}

function mergeEventScopedBookedSlots(context, eventId, bookedSlots = []) {
  const normalizedEventId = String(eventId || "").trim();
  if (!normalizedEventId) return bookedSlots;

  const cachedBookedSlots = readCachedBookedSlots(context);
  return [
    ...cachedBookedSlots.filter((slot) => String(slot?.eventId || "").trim() !== normalizedEventId),
    ...bookedSlots,
  ];
}

function mergeEventScopedTemporaryHoldSlots(context, eventId, temporaryHoldSlots = []) {
  const normalizedEventId = String(eventId || "").trim();
  if (!normalizedEventId) return [];
  const cached = retainUnexpiredTemporaryHoldSlots(readCachedTemporaryHoldSlots(context));
  return [
    ...cached.filter((slot) => String(slot?.eventId || "").trim() !== normalizedEventId),
    ...temporaryHoldSlots,
  ];
}

function mapAvailabilityHolds(response, eventId) {
  const nowMs = Date.now();
  return (Array.isArray(response?.holds) ? response.holds : [])
    .filter((hold) => {
      const startMs = Date.parse(hold?.startIso || "");
      const endMs = Date.parse(hold?.endIso || "");
      const expiresAtMs = Date.parse(hold?.expiresAt || "");
      return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
        && Number.isFinite(expiresAtMs) && expiresAtMs > nowMs;
    })
    .map((hold) => ({
      eventId: String(hold.eventId || eventId),
      startIso: hold.startIso,
      endIso: hold.endIso,
      expiresAt: hold.expiresAt,
      capacityUnits: 1,
      status: "temporary_hold",
      availabilityType: "temporary_hold",
    }));
}

function resolveCombinedStatus(eventsStatus, eventsNotModified, bookedSlotsResponse) {
  return eventsNotModified
    ? getHttpStatus(bookedSlotsResponse, 200)
    : eventsStatus;
}

function shouldFetchFirstTimeDiscountStatus(payload = {}) {
  const creatorId = toNumber(payload.creatorId, null);
  const fanId = toNumber(payload.fanId, null);
  return creatorId != null && fanId != null && fanId > 0;
}

function extractEventIds(events = []) {
  return Array.from(new Set(
    events
      .map((event) => event?.eventId || event?.id)
      .map((eventId) => String(eventId || "").trim())
      .filter(Boolean),
  ));
}

export async function fetchCreatorBookingContextFlow({ payload, context, api }) {
  const baseUrl = getBookingsApiBaseUrl(context);
  const headers = context.requestHeaders || {};

  if (payload?.creatorId == null || payload?.creatorId === "") {
    return fail({
      code: "MISSING_CREATOR_ID",
      message: "creatorId is required to fetch booking context.",
    });
  }

  try {
    // Required order: events first, then booked slots.
    const eventsResponse = await api.get(`${baseUrl}/events`, {
      params: buildEventsParams(payload),
      headers,
      signal: context.signal,
      timeoutMs: context.requestTimeoutMs,
    });

    const eventsStatus = getHttpStatus(eventsResponse, 200);
    const etag = getEtag(eventsResponse);

    if (eventsResponse?.ok === false) {
      return fail({
        code: "FETCH_CREATOR_EVENTS_FAILED",
        message: eventsResponse?.error || "Failed to fetch creator events.",
        details: eventsResponse,
      });
    }

    const eventsNotModified = isApiNotModified(eventsResponse);
    const rawEvents = eventsNotModified
      ? readCachedRawEvents(context)
      : (Array.isArray(eventsResponse?.items) ? eventsResponse.items : []);

    const normalizedEventId = String(payload?.eventId || "").trim();
    const [bookedSlotsResult, availabilityResponse] = await Promise.all([
      fetchAllBookedSlotPages({
        api,
        url: resolveBookedSlotsEndpoint(baseUrl, payload),
        params: buildBookedSlotParams(payload, {
          includeEventId: true,
        }),
        signal: context.signal,
        timeoutMs: context.requestTimeoutMs,
      }),
      normalizedEventId
        ? api.get(`${baseUrl}/temporary-holds/availability`, {
          params: { eventId: normalizedEventId },
          headers,
          signal: context.signal,
          timeoutMs: context.requestTimeoutMs,
        }).catch((error) => ({ ok: false, error }))
        : Promise.resolve({ ok: true, holds: [] }),
    ]);
    const bookedSlotsResponse = bookedSlotsResult.response;

    if (!bookedSlotsResult.ok || bookedSlotsResponse?.ok === false) {
      return fail({
        code: "FETCH_CREATOR_BOOKED_SLOTS_FAILED",
        message: bookedSlotsResponse?.error || "Failed to fetch creator booked slots.",
        details: bookedSlotsResponse,
      });
    }

    const fetchedBookedSlots = Array.isArray(bookedSlotsResponse?.slots) ? bookedSlotsResponse.slots : [];
    const bookedSlots = mergeEventScopedBookedSlots(context, payload?.eventId, fetchedBookedSlots);
    const temporaryHoldAvailabilityStale = Boolean(normalizedEventId && availabilityResponse?.ok === false);
    const fetchedTemporaryHoldSlots = temporaryHoldAvailabilityStale
      ? retainUnexpiredTemporaryHoldSlots(readCachedTemporaryHoldSlots(context))
        .filter((slot) => String(slot?.eventId || "") === normalizedEventId)
      : mapAvailabilityHolds(availabilityResponse, normalizedEventId);
    const temporaryHoldSlots = mergeEventScopedTemporaryHoldSlots(
      context,
      normalizedEventId,
      fetchedTemporaryHoldSlots,
    );
    let isFirstBookingForCreator = null;
    let eventBookingCountsByEventId = {};

    const creatorId = toNumber(payload.creatorId, null);
    const fanId = toNumber(payload.fanId, null);
    if (fanId === 0) {
      isFirstBookingForCreator = true;
    } else if (shouldFetchFirstTimeDiscountStatus(payload)) {
      const eligibilityResponse = await api.get(
        `${baseUrl}/bookings/creators/${creatorId}/fans/${fanId}/first-time-discount-status`,
        {
          signal: context.signal,
          timeoutMs: context.requestTimeoutMs,
        },
      );

      if (eligibilityResponse?.ok === false) {
        return fail({
          code: "FETCH_FIRST_TIME_DISCOUNT_STATUS_FAILED",
          message: eligibilityResponse?.error || "Failed to fetch first-time discount status.",
          details: eligibilityResponse,
        });
      }

      isFirstBookingForCreator = Boolean(eligibilityResponse?.isFirstBookingForCreator);

      const eventIds = extractEventIds(rawEvents);
      if (eventIds.length > 0) {
        const countsResponse = await api.get(
          `${baseUrl}/bookings/fans/${fanId}/event-booking-counts`,
          {
            params: {
              eventIds: eventIds.join(","),
              statuses: "confirmed,completed",
            },
            signal: context.signal,
            timeoutMs: context.requestTimeoutMs,
          },
        );

        if (countsResponse?.ok === false) {
          return fail({
            code: "FETCH_EVENT_BOOKING_COUNTS_FAILED",
            message: countsResponse?.error || "Failed to fetch event booking counts.",
            details: countsResponse,
          });
        }

        eventBookingCountsByEventId = countsResponse?.countsByEventId || {};
      }
    }

    return ok(
      {
        rawEvents,
        bookedSlots,
        temporaryHoldSlots,
        temporaryHoldAvailabilityStale,
        isFirstBookingForCreator,
        eventBookingCountsByEventId,
        stats: bookedSlotsResponse?.stats || {},
      },
      {
        flow: "bookings.fetchCreatorBookingContext",
        status: resolveCombinedStatus(eventsStatus, eventsNotModified, bookedSlotsResponse),
        etag,
        eventsNotModified,
        fetchedAt: Date.now(),
      }
    );
  } catch (error) {
    return asFlowError(
      error,
      "FETCH_CREATOR_BOOKING_CONTEXT_UNEXPECTED",
      "Unexpected error while loading booking context."
    );
  }
}
