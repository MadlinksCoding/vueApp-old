import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus, getEtag, isApiNotModified } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { getBookingsApiBaseUrl, asFlowError, toNumber } from "@/services/bookings/bookingsApiUtils.js";
import { normalizeDashboardBookingRole } from "@/utils/dashboardRole.js";
import {
  buildBookedSlotStats,
  fetchAllBookedSlotPages,
  mergeBookedSlotCollections,
} from "@/services/bookings/utils/fetchAllBookedSlotPages.js";

function buildCreatorEventParams(payload = {}) {
  return {
    creatorId: payload.creatorId,
    status: payload.status || "active",
    limit: payload.limit,
    next: payload.next,
  };
}

function buildIdsEventParams(eventIds = [], payload = {}) {
  return {
    ids: eventIds.join(","),
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

function buildWidgetBookedSlotParams(payload = {}, statusIn = payload.widgetStatusIn) {
  return {
    fromIso: payload.widgetFromIso,
    toIso: payload.widgetToIso,
    limit: payload.slotLimit,
    statusIn,
  };
}

function shouldFetchWidgetBookedSlots(payload = {}) {
  return Boolean(payload.widgetFromIso && payload.widgetToIso);
}

function resolveBookedSlotsEndpoint(baseUrl, payload = {}) {
  const creatorId = toNumber(payload.creatorId, null);
  const fanId = toNumber(payload.fanId, null);
  const userRole = normalizeDashboardBookingRole(payload.userRole, "");

  if (userRole === "fan") {
    return `${baseUrl}/bookings/fans/${fanId}/booked-slots`;
  }

  return `${baseUrl}/bookings/creators/${creatorId}/booked-slots`;
}

function readCachedRawEvents(context) {
  const engine = context?.stateEngine;
  if (!engine || typeof engine.getState !== "function") return [];

  const cached = engine.getState("events.rawEvents");
  return Array.isArray(cached) ? cached : [];
}

function resolveCombinedStatus(eventsStatus, eventsNotModified, bookedSlotsResponse) {
  return eventsNotModified
    ? getHttpStatus(bookedSlotsResponse, 200)
    : eventsStatus;
}

function extractUniqueEventIdsFromSlots(slots = []) {
  const ids = [];
  const seen = new Set();

  (Array.isArray(slots) ? slots : []).forEach((slot) => {
    const eventId = String(slot?.eventId || "").trim();
    if (!eventId || seen.has(eventId)) return;
    seen.add(eventId);
    ids.push(eventId);
  });

  return ids;
}

async function fetchBookedSlots({ api, url, params, context }) {
  const result = await fetchAllBookedSlotPages({
    api,
    url,
    params,
    signal: context.signal,
    timeoutMs: context.requestTimeoutMs,
  });

  if (!result.ok || result.response?.ok === false) {
    return {
      ok: false,
      response: result.response,
    };
  }

  return {
    ok: true,
    response: result.response,
  };
}

async function fetchWidgetBookedSlots({ api, url, payload, context, creatorMode }) {
  if (!shouldFetchWidgetBookedSlots(payload)) {
    return { ok: true, response: null };
  }

  const normalizedStatuses = String(payload.widgetStatusIn || "")
    .split(",")
    .map((status) => status.trim())
    .filter(Boolean);
  const statusStreams = creatorMode && normalizedStatuses.length > 0
    ? normalizedStatuses
    : [payload.widgetStatusIn];
  const results = await Promise.all(
    statusStreams.map((statusIn) => fetchBookedSlots({
      api,
      url,
      params: buildWidgetBookedSlotParams(payload, statusIn),
      context,
    })),
  );
  const failed = results.find((result) => !result.ok);
  if (failed) return failed;

  const slots = mergeBookedSlotCollections(
    ...results.map((result) => result.response?.slots || []),
  );

  return {
    ok: true,
    response: {
      ...(results.at(-1)?.response || {}),
      slots,
      stats: buildBookedSlotStats(slots),
      next: null,
      hasMore: false,
      truncated: false,
    },
  };
}

async function fetchCreatorDashboardContext({ payload, context, api, baseUrl, headers }) {
  if (payload?.creatorId == null || payload?.creatorId === "") {
    return fail({
      code: "MISSING_CREATOR_ID",
      message: "creatorId is required to fetch dashboard booking context.",
    });
  }

  const eventsResponse = await api.get(`${baseUrl}/events`, {
    params: buildCreatorEventParams(payload),
    headers,
    signal: context.signal,
    timeoutMs: context.requestTimeoutMs,
  });

  const eventsStatus = getHttpStatus(eventsResponse, 200);
  const etag = getEtag(eventsResponse);

  if (eventsResponse?.ok === false) {
    return fail({
      code: "FETCH_DASHBOARD_EVENTS_FAILED",
      message: eventsResponse?.error || "Failed to fetch dashboard events.",
      details: eventsResponse,
    });
  }

  const eventsNotModified = isApiNotModified(eventsResponse);
  const rawEvents = eventsNotModified
    ? readCachedRawEvents(context)
    : (Array.isArray(eventsResponse?.items) ? eventsResponse.items : []);

  const bookedSlotsUrl = resolveBookedSlotsEndpoint(baseUrl, payload);
  const [bookedSlotsResult, widgetBookedSlotsResult] = await Promise.all([
    fetchBookedSlots({
      api,
      url: bookedSlotsUrl,
      params: buildBookedSlotParams(payload, { includeEventId: true }),
      context,
    }),
    fetchWidgetBookedSlots({
      api,
      url: bookedSlotsUrl,
      payload,
      context,
      creatorMode: true,
    }),
  ]);
  const bookedSlotsResponse = bookedSlotsResult.response;
  const widgetBookedSlotsResponse = widgetBookedSlotsResult.response;

  if (!bookedSlotsResult.ok || bookedSlotsResponse?.ok === false) {
    return fail({
      code: "FETCH_DASHBOARD_BOOKED_SLOTS_FAILED",
      message: bookedSlotsResponse?.error || "Failed to fetch dashboard booked slots.",
      details: bookedSlotsResponse,
    });
  }
  if (!widgetBookedSlotsResult.ok || widgetBookedSlotsResponse?.ok === false) {
    return fail({
      code: "FETCH_DASHBOARD_WIDGET_BOOKED_SLOTS_FAILED",
      message: widgetBookedSlotsResponse?.error || "Failed to fetch dashboard widget booked slots.",
      details: widgetBookedSlotsResponse,
    });
  }

  return ok(
    {
      rawEvents,
      bookedSlots: Array.isArray(bookedSlotsResponse?.slots) ? bookedSlotsResponse.slots : [],
      widgetBookedSlots: widgetBookedSlotsResponse
        ? (Array.isArray(widgetBookedSlotsResponse.slots) ? widgetBookedSlotsResponse.slots : [])
        : null,
      stats: bookedSlotsResponse?.stats || {},
      widgetStats: widgetBookedSlotsResponse?.stats || {},
    },
    {
      flow: "bookings.fetchDashboardBookingContext",
      status: resolveCombinedStatus(eventsStatus, eventsNotModified, bookedSlotsResponse),
      etag,
      eventsNotModified,
      fetchedAt: Date.now(),
      mode: "creator",
    }
  );
}

async function fetchFanDashboardContext({ payload, context, api, baseUrl }) {
  if (payload?.fanId == null || payload?.fanId === "") {
    return fail({
      code: "MISSING_FAN_ID",
      message: "fanId is required to fetch fan dashboard booking context.",
    });
  }

  const bookedSlotsUrl = resolveBookedSlotsEndpoint(baseUrl, payload);
  const [bookedSlotsResult, widgetBookedSlotsResult] = await Promise.all([
    fetchBookedSlots({
      api,
      url: bookedSlotsUrl,
      params: buildBookedSlotParams(payload),
      context,
    }),
    fetchWidgetBookedSlots({
      api,
      url: bookedSlotsUrl,
      payload,
      context,
      creatorMode: false,
    }),
  ]);
  const bookedSlotsResponse = bookedSlotsResult.response;
  const widgetBookedSlotsResponse = widgetBookedSlotsResult.response;

  if (!bookedSlotsResult.ok || bookedSlotsResponse?.ok === false) {
    return fail({
      code: "FETCH_DASHBOARD_BOOKED_SLOTS_FAILED",
      message: bookedSlotsResponse?.error || "Failed to fetch fan booked slots.",
      details: bookedSlotsResponse,
    });
  }
  if (!widgetBookedSlotsResult.ok || widgetBookedSlotsResponse?.ok === false) {
    return fail({
      code: "FETCH_DASHBOARD_WIDGET_BOOKED_SLOTS_FAILED",
      message: widgetBookedSlotsResponse?.error || "Failed to fetch fan widget booked slots.",
      details: widgetBookedSlotsResponse,
    });
  }

  const bookedSlots = Array.isArray(bookedSlotsResponse?.slots) ? bookedSlotsResponse.slots : [];
  const widgetBookedSlots = widgetBookedSlotsResponse
    ? (Array.isArray(widgetBookedSlotsResponse.slots) ? widgetBookedSlotsResponse.slots : [])
    : null;
  const eventIds = extractUniqueEventIdsFromSlots(
    mergeBookedSlotCollections(bookedSlots, widgetBookedSlots || []),
  );

  if (eventIds.length === 0) {
    return ok(
      {
        rawEvents: [],
        bookedSlots,
        widgetBookedSlots,
        stats: bookedSlotsResponse?.stats || {},
        widgetStats: widgetBookedSlotsResponse?.stats || {},
      },
      {
        flow: "bookings.fetchDashboardBookingContext",
        status: getHttpStatus(bookedSlotsResponse, 200),
        etag: null,
        eventsNotModified: false,
        fetchedAt: Date.now(),
        mode: "fan",
      }
    );
  }

  const eventsResponse = await api.get(`${baseUrl}/events`, {
    params: buildIdsEventParams(eventIds, payload),
    headers: context.requestHeaders || {},
    signal: context.signal,
    timeoutMs: context.requestTimeoutMs,
  });

  const eventsStatus = getHttpStatus(eventsResponse, 200);
  const etag = getEtag(eventsResponse);

  if (eventsResponse?.ok === false) {
    return fail({
      code: "FETCH_DASHBOARD_EVENTS_FAILED",
      message: eventsResponse?.error || "Failed to fetch dashboard events.",
      details: eventsResponse,
    });
  }

  const eventsNotModified = isApiNotModified(eventsResponse);
  const rawEvents = eventsNotModified
    ? readCachedRawEvents(context)
    : (Array.isArray(eventsResponse?.items) ? eventsResponse.items : []);

  return ok(
    {
      rawEvents,
      bookedSlots,
      widgetBookedSlots,
      stats: bookedSlotsResponse?.stats || {},
      widgetStats: widgetBookedSlotsResponse?.stats || {},
    },
    {
      flow: "bookings.fetchDashboardBookingContext",
      status: resolveCombinedStatus(eventsStatus, eventsNotModified, bookedSlotsResponse),
      etag,
      eventsNotModified,
      fetchedAt: Date.now(),
      mode: "fan",
    }
  );
}

export async function fetchDashboardBookingContextFlow({ payload, context, api }) {
  const baseUrl = getBookingsApiBaseUrl(context);
  const headers = context.requestHeaders || {};
  const userRole = normalizeDashboardBookingRole(payload?.userRole, "");

  try {
    if (userRole === "fan") {
      return await fetchFanDashboardContext({ payload, context, api, baseUrl, headers });
    }

    if (userRole === "creator") {
      return await fetchCreatorDashboardContext({ payload, context, api, baseUrl, headers });
    }

    return fail({
      code: "UNSUPPORTED_DASHBOARD_USER_ROLE",
      message: "Unsupported dashboard user role.",
    });
  } catch (error) {
    return asFlowError(
      error,
      "FETCH_DASHBOARD_BOOKING_CONTEXT_UNEXPECTED",
      "Unexpected error while loading dashboard booking context."
    );
  }
}
