import FlowHandler from "@/services/flow-system/FlowHandler.js";

/**
 * The booking write operations shared by the chat embed and the events (booking)
 * embed. Everything host-specific — socket broadcasts, chat activity logs, embed
 * bridge notifications, toasts — stays with the caller; this only talks to the
 * flow registry and reports a uniform `{ ok, item, error }`.
 */

function readError(result) {
  return result?.meta?.uiErrors?.[0]
    || result?.error?.message
    || (typeof result?.error === "string" ? result.error : "")
    || "";
}

function settle(result) {
  return {
    ok: Boolean(result?.ok),
    item: result?.data?.item || null,
    error: result?.ok ? "" : readError(result),
    result,
  };
}

function failure(error) {
  return { ok: false, item: null, error: error || "", result: null };
}

export function useBookingActions({ flowOptions = () => ({}) } = {}) {
  const options = () => flowOptions() || {};

  function run(flowId, payload) {
    return FlowHandler.run(flowId, payload, options());
  }

  /** Creator approves or rejects a pending booking. */
  async function reviewBooking({ bookingId, decision, actor = "creator", reason, args, event } = {}) {
    if (!bookingId || !decision) return failure("");
    return settle(await run("bookings.reviewPendingBooking", {
      bookingId,
      decision,
      actor,
      ...(reason ? { reason } : {}),
      ...(args ? { args } : {}),
      ...(event ? { event } : {}),
    }));
  }

  /** Plain cancellation (not a negotiation decline — see `rejectCounterOffer`). */
  async function cancelBooking({ bookingId, actor = "fan", intent = "normal", reason, args } = {}) {
    if (!bookingId) return failure("");
    return settle(await run("bookings.cancelBooking", {
      bookingId,
      actor,
      intent,
      ...(reason ? { reason } : {}),
      ...(args ? { args } : {}),
    }));
  }

  /**
   * Fan accepts a creator's price adjustment: apply the renegotiated terms, then
   * approve the booking. Both calls must succeed for the booking to be confirmed.
   */
  async function applyPriceAdjustment({
    bookingId,
    proposedStartAtIso,
    proposedDurationMinutes,
    proposedTokens,
    remarks,
    negotiationId = null,
  } = {}) {
    if (!bookingId) return failure("");

    const renegotiated = await run("bookings.renegotiateBooking", {
      bookingId,
      startAtIso: proposedStartAtIso || undefined,
      durationMinutes: proposedDurationMinutes ?? undefined,
      costTokens: proposedTokens ?? undefined,
      personalRequestText: remarks || undefined,
      actor: "user",
      args: {
        negotiation: { type: "adjust", phase: "apply", negotiationId },
      },
      meta: { currentCounterOffer: "" },
    });
    if (!renegotiated?.ok) return settle(renegotiated);

    return settle(await run("bookings.reviewPendingBooking", {
      bookingId,
      decision: "approve",
      actor: "fan",
      reason: "adjustment_accepted_by_fan",
      args: {
        negotiation: { status: "accepted", type: "adjust", negotiationId },
      },
    }));
  }

  /** Fan accepts a creator's `moretime` / `reschedule` proposal. */
  async function acceptCounterOffer({ bookingId, offerType, proposedSlotDate, negotiationId = null } = {}) {
    if (!bookingId || !proposedSlotDate) return failure("");

    const flowId = offerType === "reschedule"
      ? "bookings.rescheduleBooking"
      : "bookings.renegotiateBooking";

    return settle(await run(flowId, {
      bookingId,
      startAtIso: proposedSlotDate,
      actor: "user",
      args: {
        negotiation: { status: "accepted", type: offerType, negotiationId },
      },
    }));
  }

  /** Fan rejects any counter offer — the booking is cancelled as a declined renegotiation. */
  async function rejectCounterOffer({ bookingId, offerType, negotiationId = null, reason } = {}) {
    if (!bookingId) return failure("");
    return settle(await run("bookings.cancelBooking", {
      bookingId,
      actor: "user",
      intent: "decline_renegotiation",
      ...(reason ? { reason } : {}),
      args: {
        negotiation: { status: "declined", type: offerType, negotiationId },
      },
    }));
  }

  /**
   * Mirrors the resulting state onto the linked chat message. Best effort — the
   * booking record stays authoritative if this fails.
   */
  async function syncBookingMessage({ chatId, messageId, action, contentType = "booking_request" } = {}) {
    if (!chatId || !messageId || !action) return failure("");
    try {
      const result = contentType === "booking_request"
        ? await run("chat.updateBookingRequestMessage", { chatId, messageId, action })
        : await run("chat.updateMessage", { chatId, messageId, updates: { action } });
      return settle(result);
    } catch (error) {
      return failure(error?.message || "");
    }
  }

  return {
    reviewBooking,
    cancelBooking,
    applyPriceAdjustment,
    acceptCounterOffer,
    rejectCounterOffer,
    syncBookingMessage,
  };
}

export default useBookingActions;
