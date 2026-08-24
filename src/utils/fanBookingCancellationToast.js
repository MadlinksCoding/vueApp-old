import { resolveBookingRefundState } from "@/services/bookings/utils/bookingRefundUtils.js";
import { showToast } from "@/utils/toastBus.js";

function asDate(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function formatSchedule(event = {}, locale = "en") {
  const raw = event?.raw && typeof event.raw === "object" ? event.raw : event;
  const start = asDate(event?.start || raw?.startAtIso || raw?.startIso);
  const end = asDate(event?.end || raw?.endAtIso || raw?.endIso);
  if (!start || !end) return "";

  const date = [
    String(start.getDate()).padStart(2, "0"),
    String(start.getMonth() + 1).padStart(2, "0"),
    start.getFullYear(),
  ].join("-");
  const time = (value) => new Intl.DateTimeFormat(locale || undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(value);
  return `${date} ${time(start)}-${time(end)}`;
}

export function showFanBookingCancellationToast({ booking = null, event = null, t, locale = "en" } = {}) {
  const source = booking && typeof booking === "object"
    ? booking
    : (event?.raw && typeof event.raw === "object" ? event.raw : event || {});
  const creator = firstText(
    source?.creatorUsername,
    source?.creatorDisplayName,
    source?.creatorName,
    source?.eventSnapshot?.creatorUsername,
    source?.eventSnapshot?.creatorDisplayName,
  ) || (typeof t === "function" ? t("common_creator") : "Creator");
  const refundState = resolveBookingRefundState(source);
  const schedule = formatSchedule(event || source, typeof locale === "string" ? locale : locale?.value);
  const titleKey = refundState === "partial"
    ? "fan_booking_toast_cancelled_partially_refunded_title"
    : refundState === "full"
      ? "fan_booking_toast_cancelled_refunded_title"
      : "fan_booking_toast_cancelled_title";
  const messageKey = refundState === "partial"
    ? (schedule ? "fan_booking_toast_cancelled_partially_refunded_message" : "fan_booking_toast_cancelled_partially_refunded_message_no_date")
    : refundState === "full"
      ? (schedule ? "fan_booking_toast_cancelled_refunded_message" : "fan_booking_toast_cancelled_refunded_message_no_date")
      : (schedule ? "fan_booking_toast_cancelled_message" : "fan_booking_toast_cancelled_message_no_date");

  showToast({
    type: "success",
    title: typeof t === "function" ? t(titleKey, { creator }) : `Your session with ${creator} has been cancelled`,
    message: typeof t === "function" ? t(messageKey, { schedule }) : "Your session has been cancelled.",
    persistent: true,
    dedupeKey: `fan-booking-cancelled-${String(source?.bookingId || event?.bookingId || "")}`,
  });
}
