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

/** Convenience accessor for the chat id a booking is linked to (empty when unlinked). */
export function bookingChatId(booking) {
  return firstText(booking?.meta?.chatId);
}
