import { BOOKING_NOTICE_TYPES } from "@/components/ui/card/event/bookingNoticeConfig";

export const LAB_NOTICE_VARIANTS = Object.freeze([
  { value: "booking-request", label: "New booking request" },
  { value: "booking-confirmed", label: "Booking confirmed" },
  { value: "booking-declined", label: "Booking declined" },
  { value: "booking-cancelled", label: "Booking cancelled" },
  { value: "price-adjustment-sent", label: "Price adjustment sent" },
  { value: "price-adjustment-accepted", label: "Price adjustment accepted" },
  { value: "price-adjustment-declined", label: "Price adjustment declined" },
  { value: "ready-to-join", label: "Ready to join" },
  { value: "events-today", label: "Events today — standalone fallback" },
  { value: "summary-single", label: "One summary candidate — standalone fallback" },
  { value: "summary", label: "Activity summary" },
]);

const LOCAL_HOSTS = new Set(["fansocial.local", "localhost", "127.0.0.1", "::1", "[::1]"]);
export const BOOKING_NOTICE_PREVIEW_STORAGE_KEY = "fsBookingNoticePreview:v1";

export function isBookingNoticeLabHost(hostname) {
  return LOCAL_HOSTS.has(String(hostname || "").toLowerCase());
}

export function createBookingNoticePreviewPayload(notices, config, viewerRole, now = Date.now()) {
  return {
    schemaVersion: 1,
    createdAt: now,
    expiresAt: now + 60 * 60 * 1000,
    viewerRole: viewerRole === "creator" ? "creator" : "fan",
    notices: JSON.parse(JSON.stringify(Array.isArray(notices) ? notices : [])),
    config: JSON.parse(JSON.stringify(config && typeof config === "object" ? config : {})),
  };
}

function labItem(index, viewerRole, status, longContent, prefix) {
  const otherPerson = viewerRole === "creator" ? "The grape gatsby" : "Lantau Cows";
  const eventDate = new Date(Date.UTC(2026, 3, 24 + index, 14, 15));
  const occurredDate = new Date(Date.UTC(2026, 3, 10 + index, 9));
  const monthLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return {
    id: `${prefix}-item-${index}`,
    bookingId: `${prefix}-booking-${index}`,
    month: monthLabels[eventDate.getUTCMonth()],
    day: String(eventDate.getUTCDate()),
    title: longContent
      ? "A deliberately long event title for checking wrapping and responsive notice spacing"
      : index === 1 ? "Lantau cows meet up" : `Booking test event ${index}`,
    time: "2:15pm – 9:30pm",
    person: { name: otherPerson, avatar: "https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp" },
    status,
    eventAt: eventDate.toISOString(),
    occurredAt: occurredDate.toISOString(),
    joinUrl: "#notice-lab-join",
  };
}

function priceState(variant) {
  if (variant.endsWith("accepted")) return "accepted";
  if (variant.endsWith("declined")) return "declined";
  return "request-sent";
}

function groupedLabHeading(variant, count) {
  if (variant === "booking-request") return `You have ${count} new pending bookings:`;
  if (variant === "booking-confirmed") return `You have ${count} confirmed bookings:`;
  if (variant === "booking-declined") return `You have ${count} declined booking requests:`;
  if (variant === "booking-cancelled") return `You have ${count} cancelled bookings:`;
  if (variant === "events-today") return `You have ${count} events today:`;
  if (variant === "price-adjustment-sent") return `You have ${count} new price adjustment requests:`;
  if (variant === "price-adjustment-accepted") return `You have ${count} accepted price adjustments:`;
  if (variant === "price-adjustment-declined") return `You have ${count} declined price adjustments:`;
  return undefined;
}

function formatLabTime(value) {
  return value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()
    .replace(/\s+/g, "");
}

function readyLabItem(item, options, offsetMinutes = 5) {
  const configuredNow = Number(options?.nowMs);
  const nowMs = Number.isFinite(configuredNow) ? configuredNow : Date.now();
  const start = new Date(nowMs + offsetMinutes * 60_000);
  const end = new Date(start.getTime() + 15 * 60_000);
  return {
    ...item,
    timeOnly: true,
    status: "confirmed",
    eventAt: start.toISOString(),
    time: `${formatLabTime(start)} – ${formatLabTime(end)}`,
  };
}

function eventsTodayLabItem(item, options, offsetMinutes = 30) {
  const readyItem = readyLabItem(item, options, offsetMinutes);
  const start = new Date(readyItem.eventAt);
  return {
    ...readyItem,
    timeOnly: false,
    activityType: BOOKING_NOTICE_TYPES.EVENTS_TODAY,
    month: start.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(start.getDate()),
  };
}

export function createBookingNoticeLabNotice(variant, options = {}) {
  const sequence = Number(options.sequence) || 1;
  const viewerRole = options.viewerRole === "creator" ? "creator" : "fan";
  const count = Math.min(30, Math.max(1, Number(options.itemCount) || 1));
  const prefix = `lab-${variant}-${sequence}`;
  const actor = { displayName: viewerRole === "creator" ? "@grapegatsby" : "@lantaucows" };
  const status = variant.includes("declined") ? "declined" : variant === "booking-request" ? "pending" : "confirmed";
  const items = Array.from({ length: count }, (_, index) => labItem(index + 1, viewerRole, status, options.longContent, prefix));
  if (variant === BOOKING_NOTICE_TYPES.BOOKING_REQUEST && viewerRole === "fan") return null;
  if (variant === "summary-single") {
    return createBookingNoticeLabNotice("price-adjustment-sent", { ...options, sequence, viewerRole, itemCount: 1 });
  }
  const base = {
    id: prefix,
    type: variant,
    audience: viewerRole,
    actor,
    items,
    totalCount: count,
    ...(count > 1 ? {
      heading: groupedLabHeading(variant, count),
      dismissItemIds: items.map((item) => item.id),
      serverActivityIds: items.map((item) => item.id),
    } : {}),
  };

  if (variant.startsWith("price-adjustment")) {
    return {
      ...base,
      type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT,
      items: items.map((item) => ({ ...item, activityType: variant })),
      priceAdjustmentState: priceState(variant),
      showDetail: true,
      action: variant.endsWith("sent") ? { id: "review-adjustment", label: "REVIEW ADJUSTMENT" } : undefined,
    };
  }
  if (variant === BOOKING_NOTICE_TYPES.BOOKING_REQUEST) {
    return {
      ...base,
      heading: count > 1 ? `You have ${count} new pending bookings:` : undefined,
      dismissItemIds: count > 1 ? items.map((item) => item.id) : undefined,
      action: { id: count > 1 ? "review-bookings" : "review-booking", label: "REVIEW", showArrow: false },
    };
  }
  if (variant === BOOKING_NOTICE_TYPES.EVENTS_TODAY) {
    const eventItems = items.map((item, index) => eventsTodayLabItem(item, options, 30 + (index * 15)));
    return {
      ...base,
      heading: groupedLabHeading(variant, count),
      items: eventItems,
      showDetail: true,
    };
  }
  if (variant === BOOKING_NOTICE_TYPES.READY_TO_JOIN) {
    return {
      ...base,
      items: items.map((item, index) => readyLabItem(item, options, 5 + index)),
      action: { id: "join-call", label: "JOIN CALL", bookingId: items[0].bookingId, url: items[0].joinUrl },
    };
  }
  if (variant === BOOKING_NOTICE_TYPES.BOOKING_CANCELLED) {
    return {
      ...base,
      items: items.map((item) => ({
        ...item,
        status: "cancelled_system",
        activityType: BOOKING_NOTICE_TYPES.BOOKING_CANCELLED,
        cancellationStatus: "cancelled_system",
        cancellationReason: "both_no_show_auto_cancel",
      })),
      cancellationStatus: "cancelled_system",
      cancellationReason: "both_no_show_auto_cancel",
      showDetail: true,
    };
  }
  if (variant === BOOKING_NOTICE_TYPES.SUMMARY) {
    const eventsTodayItems = items.map((item, index) => eventsTodayLabItem(item, options, 30 + (index * 15)));
    const requestItems = Array.from({ length: count + 20 }, (_, index) => ({
      ...labItem(index + 1, viewerRole, "pending", options.longContent, `${prefix}-request`),
      status: "pending",
    }));
    const summaryItems = (suffix, itemStatus, activityType) => items.map((item) => ({
      ...item,
      id: `${item.id}-${suffix}`,
      bookingId: `${item.bookingId}-${suffix}`,
      status: itemStatus,
      activityType,
    }));
    return {
      ...base,
      type: BOOKING_NOTICE_TYPES.SUMMARY,
      viewer: { role: viewerRole, displayName: viewerRole === "creator" ? "Beaver Boy" : "Grape Gatsby" },
      sections: [
        { type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, label: "Events today", totalCount: eventsTodayItems.length, items: eventsTodayItems, sort: "soonest-first", priority: "events-today" },
        { type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, label: "Confirmed bookings", priority: "general-information", totalCount: count, items: summaryItems("confirmed", "confirmed", "booking-confirmed") },
        ...(viewerRole === "creator" ? [{ type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST, label: "New booking requests", totalCount: requestItems.length, items: requestItems }] : []),
        { id: "price-adjustment:request-sent", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "request-sent", label: "Price adjustment requests", totalCount: count, items: summaryItems("price-sent", "pending", "price-adjustment-sent") },
        { id: "price-adjustment:accepted", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "accepted", priority: "status-change", label: "Accepted price adjustments", totalCount: count, items: summaryItems("price-accepted", "confirmed", "price-adjustment-accepted") },
        { id: "price-adjustment:declined", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "declined", priority: "status-change", label: "Declined price adjustments", totalCount: count, items: summaryItems("price-declined", "declined", "price-adjustment-declined") },
        { type: BOOKING_NOTICE_TYPES.BOOKING_DECLINED, label: "Declined booking requests", totalCount: count, items: summaryItems("declined", "declined", "booking-declined") },
        { type: BOOKING_NOTICE_TYPES.BOOKING_CANCELLED, priority: "status-change", label: "Cancelled bookings", totalCount: count, items: summaryItems("cancelled", "cancelled_system", "booking-cancelled").map((item) => ({ ...item, cancellationReason: "both_no_show_auto_cancel" })) },
      ],
      action: { id: "review-summary", label: "REVIEW IN EVENT PAGE", showArrow: true },
    };
  }
  return { ...base, showDetail: true };
}

export function createBookingNoticeLabNotices(variant, options = {}) {
  const count = Math.min(30, Math.max(1, Number(options.itemCount) || 1));
  if (variant !== BOOKING_NOTICE_TYPES.READY_TO_JOIN || count === 1) {
    const notice = createBookingNoticeLabNotice(variant, options);
    return notice ? [notice] : [];
  }
  const configuredNow = Number(options.nowMs);
  const baseNow = Number.isFinite(configuredNow) ? configuredNow : Date.now();
  return Array.from({ length: count }, (_, index) => createBookingNoticeLabNotice(variant, {
    ...options,
    itemCount: 1,
    sequence: (Number(options.sequence) || 1) + index,
    nowMs: baseNow + index * 60_000,
  })).filter(Boolean);
}

export function createAllBookingNoticeLabNotices(options = {}) {
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right", "center-center"];
  return LAB_NOTICE_VARIANTS.flatMap((entry, index) => createBookingNoticeLabNotices(entry.value, {
    ...options,
    sequence: (Number(options.sequence) || 1) + index * 100,
  }).map((notice, noticeIndex) => {
    if (!options.mixedPositions) return notice;
    return { ...notice, config: { desktopPosition: positions[(index + noticeIndex) % positions.length] } };
  }));
}
