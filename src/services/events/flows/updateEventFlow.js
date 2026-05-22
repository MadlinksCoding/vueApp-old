import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { getEventsApiBaseUrl, asFlowError } from "@/services/events/eventsApiUtils.js";
import { mapSingleEventFromResponse } from "@/services/events/mappers/fetchCreatorEventsMapper.js";

export async function updateEventFlow({ payload, context, api }) {
  const baseUrl = getEventsApiBaseUrl(context);
  const headers = context.requestHeaders || {};
  const eventId = payload?.eventId ? String(payload.eventId).trim() : "";

  if (!eventId) {
    return fail({
      code: "UPDATE_EVENT_MISSING_ID",
      message: "eventId is required to update an event.",
      details: payload,
    });
  }

  const {
    eventId: _eventId,
    idempotencyKey: _idempotencyKey,
    ...patch
  } = payload || {};

  try {
    const response = await api.patch(`${baseUrl}/events/${encodeURIComponent(eventId)}`, patch, {
      headers,
      signal: context.signal,
      timeoutMs: context.requestTimeoutMs,
    });

    const status = getHttpStatus(response, 200);

    if (response?.ok === false) {
      return fail({
        code: "UPDATE_EVENT_FAILED",
        message: response?.message || response?.error || "Failed to update event.",
        details: response,
      });
    }

    const rawItem = response?.item || response?.updatedFields || null;
    const mappedItem = rawItem ? mapSingleEventFromResponse({ eventId, ...rawItem }) : null;

    return ok(
      {
        eventId: response?.eventId || eventId,
        item: mappedItem,
        rawItem,
      },
      {
        flow: "events.updateEvent",
        status,
      },
    );
  } catch (error) {
    return asFlowError(
      error,
      "UPDATE_EVENT_UNEXPECTED",
      "Unexpected error while updating event.",
    );
  }
}
