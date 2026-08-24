import { showToast } from "@/utils/toastBus.js";
import { resolveBookingRefundState } from "@/services/bookings/utils/bookingRefundUtils.js";
import { escapeToastHtml, wordpressToastHost } from "@/utils/wordpressToastHost.js";

/**
 * The fan-facing "your session is confirmed / cancelled" dashboard toast.
 *
 * The booking-details embed gets this for free: it posts
 * `FS_EVENTS_BOOKING_DETAILS_UPDATED` and the WordPress host renders the toast from
 * the payload. The chat embed has no such bridge, so it raises the same toast
 * directly through the host's `showToast` global, with the copy and option bag kept
 * in step with `booking-reminders-fan.js`.
 */

const CANCELLED_KEY_PREFIX = {
  full: "fan_booking_toast_cancelled_refunded",
  partial: "fan_booking_toast_cancelled_partially_refunded",
  none: "fan_booking_toast_cancelled",
};

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

/** Matches the host's format: `24-08-2026 03:00 PM-03:05 PM`. */
export function formatBookingDecisionSchedule(startAtIso, endAtIso, locale = "en") {
  const start = new Date(startAtIso || "");
  const end = new Date(endAtIso || "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";

  const pad = (value) => String(value).padStart(2, "0");
  const date = [pad(start.getDate()), pad(start.getMonth() + 1), start.getFullYear()].join("-");
  const formatter = new Intl.DateTimeFormat(locale || "en", { hour: "2-digit", minute: "2-digit", hour12: true });
  const time = (value) => formatter.format(value).replace(/\s+/g, " ").toUpperCase();

  return `${date} ${time(start)}-${time(end)}`;
}

export function showBookingDecisionToast({
  decision,
  booking = null,
  bookingId = "",
  counterpartyName = "",
  counterpartyAvatarUrl = "",
  onDetail = null,
  t,
  locale = "en",
} = {}) {
  const confirmed = decision === "confirmed";
  const translate = typeof t === "function" ? t : (_key, _params) => "";
  const creator = firstText(counterpartyName, translate("common_creator")) || "Creator";
  const schedule = formatBookingDecisionSchedule(
    firstText(booking?.startAtIso, booking?.startIso, booking?.startAt),
    firstText(booking?.endAtIso, booking?.endIso, booking?.endAt),
    locale,
  );

  const prefix = confirmed
    ? "fan_booking_toast_confirmed"
    : CANCELLED_KEY_PREFIX[resolveBookingRefundState(booking || {})] || CANCELLED_KEY_PREFIX.none;
  const title = translate(`${prefix}_title`, { creator });
  const message = translate(`${prefix}_message${schedule ? "" : "_no_date"}`, { creator, schedule });
  if (!title && !message) return false;

  // The host only binds the Detail link when it is given a non-empty href, so both
  // the target and the handler have to be present for the action to appear.
  const detailBookingId = String(bookingId || booking?.bookingId || "").trim();
  const detail = typeof onDetail === "function" && detailBookingId
    ? { label: translate("fan_booking_toast_detail") || "Detail", run: onDetail }
    : null;

  const host = wordpressToastHost();
  if (host) {
    host.showToast(escapeToastHtml(message), confirmed ? "success" : "destructive", -1, {
      position: "top-right",
      new_dashboard: true,
      clear_all: false,
      width: 600,
      wrapper_class: "bb br--col--athens-gray2",
      theme: "light",
      show_close: true,
      close_label: translate("fan_booking_toast_close") || "Close notification",
      title: escapeToastHtml(title),
      title_class: "fs--18 fw6 lh--28",
      content_class: "fs--16 fw4 lh--24",
      icon_url: String(counterpartyAvatarUrl || ""),
      icon_name: counterpartyAvatarUrl ? "" : "profile",
      icon_alt: creator,
      icon_class: "w--64 h--64 br-100",
      icon_wrapper_class: "flex justify-center items-center w--64 h--64 br-100 relative shrink-0",
      small_icon_name: confirmed ? "check" : "x-close",
      small_icon_class: "w--16 h--16",
      small_icon_wrapper_class: "flex justify-center items-center w--32 h--32 br--8 absolute",
      show_cta: false,
      // Detail reopens the booking inside chat rather than launching the
      // booking-details embed the dashboard's own toast opens — the reader is
      // already in the conversation the booking belongs to.
      ...(detail
        ? {
          linkText: detail.label,
          link: `#booking-details-${encodeURIComponent(detailBookingId)}`,
          link_icon_name: "arrow-up-right",
          closeOnLinkClick: false,
          onLinkClick: (event) => {
            event?.preventDefault?.();
            detail.run();
          },
        }
        : { link: "" }),
    });
    return true;
  }

  showToast({
    variant: "booking-decision",
    type: confirmed ? "success" : "error",
    status: confirmed ? "confirmed" : "declined",
    title,
    message,
    avatarUrl: String(counterpartyAvatarUrl || ""),
    avatarAlt: creator,
    closeLabel: translate("fan_booking_toast_close") || "Close notification",
    detailAction: detail,
    persistent: true,
    dedupeKey: `fan-booking-decision-${confirmed ? "confirmed" : "cancelled"}`,
  });
  return true;
}
