import { fail, ok } from '@/services/flow-system/flowTypes.js';
import { getBookingsApiBaseUrl, asFlowError } from '@/services/bookings/bookingsApiUtils.js';

async function runGroupSlot({ payload, context, api }, cancel) {
  const identity = Object.fromEntries(['bookingId', 'eventId', 'startIso']
    .filter(key => payload?.[key]).map(key => [key, payload[key]]));
  if (!identity.bookingId && !(identity.eventId && identity.startIso)) return fail({ code: 'GROUP_SLOT_CONTEXT_REQUIRED', message: 'Event date and time are required.' });
  try {
    const base = `${getBookingsApiBaseUrl(context)}/bookings/group-slots`;
    const options = { headers: context.requestHeaders || {}, signal: context.signal, timeoutMs: context.requestTimeoutMs };
    const response = cancel
      ? await api.post(`${base}/cancel`, identity, options)
      : await api.get(`${base}/summary?${new URLSearchParams(identity)}`, options);
    if (response?.ok !== true || !response.summary) return fail({ code: 'GROUP_SLOT_FAILED', message: response?.message || response?.error || 'Could not load the group event.' });
    return ok({ summary: response.summary }, { status: cancel ? 202 : 200 });
  } catch (error) { return asFlowError(error, 'GROUP_SLOT_FAILED', 'Could not update the group event.'); }
}

export const fetchGroupSlotSummaryFlow = args => runGroupSlot(args, false);
export const cancelGroupSlotFlow = args => runGroupSlot(args, true);
