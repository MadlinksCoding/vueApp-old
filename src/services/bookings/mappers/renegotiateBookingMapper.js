function resolveBookingId(input = {}) {
  return input?.bookingId
    || input?.event?.bookingId
    || input?.event?.raw?.bookingId
    || input?.booking?.bookingId
    || input?.booking?.raw?.bookingId
    || null;
}

export function mapRenegotiateBookingToRequest(input = {}) {
  return {
    bookingId: resolveBookingId(input),
    actionType: "renegotiate",
    ...(input?.personalRequestText !== undefined ? { personalRequestText: input.personalRequestText } : {}),
    ...(input?.sessionDurationMinutes !== undefined ? { sessionDurationMinutes: input.sessionDurationMinutes } : {}),
    ...(input?.costTokens !== undefined ? { costTokens: input.costTokens } : {}),
    ...(input?.startAtIso !== undefined ? { startAtIso: input.startAtIso } : {}),
    actor: input?.actor || "system",
    args: input?.args && typeof input.args === "object" ? input.args : {},
  };
}
