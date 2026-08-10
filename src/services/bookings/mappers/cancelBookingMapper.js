export function mapCancelBookingToRequest(input = {}) {
  const bookingId = input?.bookingId
    || input?.event?.bookingId
    || input?.event?.raw?.bookingId
    || null;

  const mapped = {
    bookingId,
    actor: input?.actor || "creator",
    reason: input?.reason || "",
    waiveFees: !!input?.waiveFees,
    args: input?.args && typeof input.args === "object" ? input.args : {},
  };

	if (input?.intent) mapped.intent = input.intent;

  if (typeof input?.refund === "boolean") {
    mapped.refund = input.refund;
  }

  return mapped;
}
