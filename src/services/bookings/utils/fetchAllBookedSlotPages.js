export function bookedSlotKey(slot = {}, index = 0) {
  const bookingId = String(slot?.bookingId || "").trim();
  if (bookingId) return `booking:${bookingId}`;

  return [
    "slot",
    slot?.eventId,
    slot?.userId,
    slot?.startIso,
    slot?.endIso,
    index,
  ].join(":");
}

export function compareBookedSlots(left = {}, right = {}) {
  const leftTime = new Date(left?.startIso || left?.startAtIso || "").getTime();
  const rightTime = new Date(right?.startIso || right?.startAtIso || "").getTime();
  const safeLeft = Number.isNaN(leftTime) ? Number.MAX_SAFE_INTEGER : leftTime;
  const safeRight = Number.isNaN(rightTime) ? Number.MAX_SAFE_INTEGER : rightTime;
  if (safeLeft !== safeRight) return safeLeft - safeRight;
  return String(left?.bookingId || "").localeCompare(String(right?.bookingId || ""));
}

export function buildBookedSlotStats(slots = []) {
  const stats = {
    total: slots.length,
    byStatus: {},
    byEvent: {},
  };

  slots.forEach((slot) => {
    const status = String(slot?.status || "").trim();
    const eventId = String(slot?.eventId || "").trim();
    if (status) stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    if (eventId) stats.byEvent[eventId] = (stats.byEvent[eventId] || 0) + 1;
  });

  return stats;
}

export function mergeBookedSlotCollections(...collections) {
  const slotsByKey = new Map();

  collections.flat().forEach((slot, index) => {
    slotsByKey.set(bookedSlotKey(slot, index), slot);
  });

  return [...slotsByKey.values()].sort(compareBookedSlots);
}

export async function fetchAllBookedSlotPages({
  api,
  url,
  params = {},
  signal,
  timeoutMs,
} = {}) {
  const slotsByKey = new Map();
  const seenCursors = new Set();
  let next;
  let pageCount = 0;
  let lastResponse = null;

  do {
    const pageParams = {
      ...params,
      ...(next ? { next } : {}),
    };
    const response = await api.get(url, {
      params: pageParams,
      signal,
      timeoutMs,
    });
    lastResponse = response;
    pageCount += 1;

    if (response?.ok === false) {
      console.warn("[booked-slots] pagination failed", {
        pageCount,
        fromIso: params?.fromIso || null,
        toIso: params?.toIso || null,
        error: response?.error || "unknown_error",
      });
      return {
        ok: false,
        response,
        pageCount,
      };
    }

    const pageSlots = Array.isArray(response?.slots) ? response.slots : [];
    pageSlots.forEach((slot, index) => {
      slotsByKey.set(bookedSlotKey(slot, index), slot);
    });

    const responseNext = typeof response?.next === "string"
      ? response.next.trim()
      : "";
    console.info("[booked-slots] page loaded", {
      page: pageCount,
      returnedCount: pageSlots.length,
      hasMore: Boolean(responseNext),
      fromIso: params?.fromIso || null,
      toIso: params?.toIso || null,
    });
    if (!responseNext) {
      next = "";
      break;
    }
    if (seenCursors.has(responseNext)) {
      const error = new Error("Booked-slot pagination returned a repeated cursor.");
      error.code = "BOOKED_SLOTS_CURSOR_LOOP";
      throw error;
    }

    seenCursors.add(responseNext);
    next = responseNext;
  } while (next);

  const slots = [...slotsByKey.values()].sort(compareBookedSlots);
  const stats = buildBookedSlotStats(slots);

  console.info("[booked-slots] pagination complete", {
    pageCount,
    slotCount: slots.length,
    fromIso: params?.fromIso || null,
    toIso: params?.toIso || null,
  });

  return {
    ok: true,
    pageCount,
    response: {
      ...(lastResponse || {}),
      slots,
      stats,
      next: null,
      hasMore: false,
      truncated: false,
    },
  };
}
