const CONFIRMED_STATUSES = ["confirmed", "accepted"];
const PENDING_STATUSES = ["pending", "pending_hold"];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function isCancelledBookingStatus(status) {
  const normalized = normalize(status);
  return normalized.startsWith("cancel")
    || normalized.startsWith("reject")
    || normalized === "declined";
}

/**
 * Visibility rule for the overflow ("3 dots") menu on a booking card — the chat
 * toasts, the call reminder, the dashboard widgets and the booking detail slide-in
 * all share it.
 *
 * Creators only get the menu once the booking is confirmed; while a request is
 * still pending they act on it through Accept / Adjust instead. Fans get it while
 * their request awaits review and after it is confirmed, but never while a price
 * adjustment is on the table — there the only way out is declining the adjustment.
 * Neither side gets it on a booking that has already passed or been cancelled.
 */
export function shouldShowBookingOptionsMenu({
  viewerRole,
  status,
  isPassed = false,
  hasPendingPriceAdjustment = false,
} = {}) {
  if (isPassed || hasPendingPriceAdjustment) return false;

  const normalizedStatus = normalize(status);
  if (isCancelledBookingStatus(normalizedStatus)) return false;
  if (CONFIRMED_STATUSES.includes(normalizedStatus)) return true;

  return normalize(viewerRole) !== "creator" && PENDING_STATUSES.includes(normalizedStatus);
}
