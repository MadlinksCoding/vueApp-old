import { useBookingActions } from "@/composables/useBookingActions.js";
import { requestBookingChatSync } from "@/embeds/events/bridge.js";

/**
 * Activity-log copy per booking action, keyed the same way `ActivityLogTexts` in
 * ChatWindow reads the `decision` field.
 */
export const BOOKING_CHAT_ACTIVITY_LOGS = {
  approve: { text: "Booking accepted", decision: "accepted" },
  reject: { text: "Booking declined", decision: "declined" },
  cancel: { text: "Call cancelled", decision: "call_cancelled" },
  accept_adjustment: { text: "Counter offer accepted", decision: "counter_offer_accepted" },
  decline_adjustment: { text: "Counter offer declined", decision: "counter_offer_declined" },
  accept_counter: { text: "New time accepted", decision: "more_time_request_accepted" },
  reject_counter: { text: "New time rejected", decision: "more_time_request_rejected" },
  adjust_request: { text: "Counter offer sent", decision: "counter_offer" },
  more_time_request: { text: "More time requested", decision: "more_time_request_sent" },
  reschedule_request: { text: "Reschedule requested", decision: "reschedule_request_sent" },
};

/**
 * Mirrors a booking action onto its linked chat message, then asks the chat embed
 * on the host page to broadcast it and append the activity log.
 *
 * The events surfaces have no chat socket of their own, so the second half has to
 * go through the host relay. Both are best effort — the booking record stays
 * authoritative if the chat is unreachable.
 */
export function useBookingChatSync({ flowOptions } = {}) {
  const bookingActions = useBookingActions(flowOptions ? { flowOptions } : {});

  function buildActivityLog(logKey, bookingId) {
    const log = logKey ? BOOKING_CHAT_ACTIVITY_LOGS[logKey] : null;
    if (!log) return null;
    return { text: log.text, meta: { is_booking_request: true, decision: log.decision, bookingId } };
  }

  function recipientsOf(booking) {
    return [booking?.creatorId, booking?.userId].filter(Boolean).map(String);
  }

  /**
   * Relays a chat message that was already written by someone else (the adjust /
   * more-time / reschedule popups update it themselves), so only the broadcast and
   * the activity log are still missing.
   */
  function broadcastBookingToChat(booking, item, logKey = null) {
    const chatId = booking?.meta?.chatId;
    if (!chatId || !item) return { ok: false };

    const bookingId = booking?.bookingId || booking?.id || null;
    requestBookingChatSync({
      chatId,
      bookingId,
      item,
      recipientIds: recipientsOf(booking),
      activityLog: buildActivityLog(logKey, bookingId),
    });

    return { ok: true };
  }

  async function syncBookingToChat(booking, action, logKey = null) {
    const chatId = booking?.meta?.chatId;
    const messageId = booking?.meta?.bookingMessageId;
    if (!chatId || !messageId || !action) return { ok: false };

    const { ok, item } = await bookingActions.syncBookingMessage({ chatId, messageId, action });

    // Relay even when the message write failed. The chat embed refetches the booking
    // from the id and posts the activity log independently, so bailing out here used
    // to leave the conversation with no sign the action ever happened.
    const bookingId = booking?.bookingId || booking?.id || null;
    requestBookingChatSync({
      chatId,
      bookingId,
      item: ok ? item : null,
      recipientIds: recipientsOf(booking),
      activityLog: buildActivityLog(logKey, bookingId),
    });

    return { ok, item: ok ? item : null };
  }

  return { syncBookingToChat, broadcastBookingToChat };
}

export default useBookingChatSync;
