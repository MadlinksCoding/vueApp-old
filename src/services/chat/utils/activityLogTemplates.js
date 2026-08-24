/**
 * Activity-log copy for booking actions, as rendered in a chat conversation.
 *
 * Most entries are keyed by the reader's role — `creator` / `audience` — because
 * only one side can take the action, so the reader's role also tells you whether
 * they were the actor. An entry that either side can trigger is keyed `self` /
 * `other` instead and resolved from the log's sender.
 *
 * Tokens: `@{creator}` / `@{audience}` both name the other participant,
 * `@{actor}` names whoever sent the log, `@{current_user}` names the reader.
 */
export const ACTIVITY_LOG_TEXTS = {
  'accepted': {
    'creator': "You have just confirmed @{audience}'s booking",
    'audience': "@{creator} has just confirmed your booking",
  },
  'counter_offer_accepted': {
    'audience': "You have just confirmed @{creator}'s adjustment",
    'creator': "@{audience} has just confirmed your adjustment",
  },
  'counter_offer_declined': {
    'audience': "You have just declined @{creator}'s adjustment",
    'creator': "@{audience} has just declined your adjustment",
  },
  'declined': {
    'creator': "You have just declined @{audience}'s booking",
    'audience': "@{creator} has just declined your booking",
  },
  'counter_offer': {
    'creator': "You have adjust the cost of the booking",
    'audience': "@{creator} has adjust the cost of the booking",
  },
  'more_time_request_accepted': {
    'audience': "You have accepted @{creator}'s more time request",
    'creator': "@{audience} has accepted your more time request",
  },
  'more_time_request_rejected': {
    'audience': "You have rejected @{creator}'s more time request",
    'creator': "@{audience} has rejected your more time request",
  },
  'reschedule_request_accepted': {
    'audience': "You have accepted @{creator}'s reschedule request",
    'creator': "@{audience} has accepted your reschedule request",
  },
  'reschedule_request_rejected': {
    'audience': "You have rejected @{creator}'s reschedule request",
    'creator': "@{audience} has rejected your reschedule request",
  },
  'more_time_request_sent': {
    'creator': "You have requested more time",
    'audience': "@{creator} has requested more time",
  },
  'reschedule_request_sent': {
    'creator': "You have requested a reschedule",
    'audience': "@{creator} has requested a reschedule",
  },
  // Either side can cancel a call, so this entry is keyed by who sent the log
  // rather than by who is reading it — every other decision here has one possible
  // actor, which is what their creator/audience keys assume.
  'call_cancelled': {
    'self': "You have cancelled the call",
    'other': "@{actor} has cancelled the call",
  },
  'send_live_call_request': {
    'creator': "@{audience} has just sent you a live call request.",
    'audience': "You have just sent a live call request to @{creator}.",
  },
};

// `meta.decision` as written by the chat and events surfaces, mapped to the copy above.
const DECISION_TEMPLATE_KEYS = {
  approve: "accepted",
  reject: "declined",
  accepted: "accepted",
  declined: "declined",
  counter_offer: "counter_offer",
  counter_offer_declined: "counter_offer_declined",
  counter_offer_accepted: "counter_offer_accepted",
  more_time_request_accepted: "more_time_request_accepted",
  more_time_request_rejected: "more_time_request_rejected",
  reschedule_request_accepted: "reschedule_request_accepted",
  reschedule_request_rejected: "reschedule_request_rejected",
  more_time_request_sent: "more_time_request_sent",
  reschedule_request_sent: "reschedule_request_sent",
  call_cancelled: "call_cancelled",
};

/**
 * The template for one activity log, or null when there is none and the stored text
 * should stand as written.
 */
export function resolveActivityLogTemplate({
  decision = "",
  rawText = "",
  isBookingRequest = false,
  isCreator = false,
  isOwnLog = false,
} = {}) {
  const entry = isBookingRequest
    ? ACTIVITY_LOG_TEXTS[DECISION_TEMPLATE_KEYS[decision]]
    : ACTIVITY_LOG_TEXTS[rawText];
  if (!entry) return null;

  // A `self` key marks copy that depends on who acted rather than who is reading.
  if (entry.self) return entry[isOwnLog ? "self" : "other"] || null;
  return entry[isCreator ? "creator" : "audience"] || null;
}
