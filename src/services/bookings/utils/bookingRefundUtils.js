function finiteNonNegativeOrNull(value) {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

function firstFiniteNonNegative(...values) {
  for (const value of values) {
    const parsed = finiteNonNegativeOrNull(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

export function resolveBookingRefundState(booking = {}) {
  const paymentStatus = String(booking?.paymentStatus || booking?.payment?.status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (["partial_refunded", "partially_refunded"].includes(paymentStatus)) return "partial";
  if (paymentStatus === "refunded") return "full";

  const cancellation = booking?.cancellation && typeof booking.cancellation === "object"
    ? booking.cancellation
    : {};
  const settlement = booking?.paymentSettlement
    || booking?.payment?.settlement
    || booking?.settlement
    || {};
  const refundedTokens = firstFiniteNonNegative(
    cancellation.refundedTokens,
    settlement.releasedTotal,
  );

  if (!(refundedTokens > 0)) return "none";

  const retainedTokens = firstFiniteNonNegative(
    cancellation.retainedTokens,
    settlement.capturedTotal,
  );
  const originalTokens = firstFiniteNonNegative(
    cancellation.originalTokens,
    booking?.payment?.total,
    booking?.paymentTotal,
  );

  if ((retainedTokens !== null && retainedTokens > 0)
    || (originalTokens !== null && originalTokens > refundedTokens)) {
    return "partial";
  }

  return "full";
}
