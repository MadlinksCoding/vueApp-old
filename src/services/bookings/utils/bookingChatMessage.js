function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

/**
 * Rebuilds the chat `booking_request` message from a booking.
 *
 * `BookingFlowStep3` stores `meta.chatId` + `meta.bookingMessageId` on the booking
 * right after the request message is sent, so any surface holding a booking can
 * drive the chat-side popups (`AdjustBookingPopup`, `MoreTimeRequestPopup`,
 * `RescheduleRequestPopup`, `CancelCallConfirmPopup`) without the real message.
 *
 * Returns `null` when the booking has no linked chat message.
 */
export function buildBookingChatMessage(booking) {
  if (!booking || typeof booking !== "object") return null;

  const meta = booking.meta && typeof booking.meta === "object" ? booking.meta : {};
  const chatId = firstText(meta.chatId);
  const messageId = meta.bookingMessageId ?? null;
  if (!chatId || messageId === null || messageId === "") return null;

  const snapshot = booking.eventSnapshot && typeof booking.eventSnapshot === "object" ? booking.eventSnapshot : {};
  const current = booking.eventCurrent && typeof booking.eventCurrent === "object" ? booking.eventCurrent : {};
  const startAt = firstText(booking.startAtIso, booking.startIso, booking.startAt);
  const endAt = firstText(booking.endAtIso, booking.endIso, booking.endAt);

  return {
    message_id: messageId,
    chat_id: chatId,
    content_type: "booking_request",
    content: {
      booking_id: booking.bookingId || booking.id || null,
      event_id: booking.eventId || booking.event_id || null,
      event_title: firstText(booking.eventTitle, snapshot.title, current.title),
      slot_date: startAt,
      start_at: startAt,
      end_at: endAt,
    },
  };
}

/**
 * Returns the real chat message when a chat embed is mounted on the host page and
 * still holds it, otherwise the rebuilt one.
 *
 * The synthetic message carries the ids but not the negotiation state
 * (`content.action`, `content.meta`), which the booking detail popup reads to
 * decide which actions to offer.
 */
export async function resolveBookingChatMessage(booking) {
  const fallback = buildBookingChatMessage(booking);
  if (!fallback) return null;

  try {
    // Reading `window.parent` throws on a cross-origin host.
    const chatEmbed = window.parent?.chatEmbed;
    if (typeof chatEmbed?.getMessage !== "function") return fallback;

    const result = await chatEmbed.getMessage({
      chatId: fallback.chat_id,
      messageId: fallback.message_id,
    });
    console.error("resolveBookingChatMessage: got message from chatEmbed:", result?.item);
    return result?.item || fallback;
  } catch (_error) {
    // No chat embed, cross-origin host, or the request timed out.
    return fallback;
  }
}
