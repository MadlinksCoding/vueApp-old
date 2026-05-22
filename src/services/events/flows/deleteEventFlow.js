import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { getEventsApiBaseUrl, asFlowError } from "@/services/events/eventsApiUtils.js";

export async function deleteEventFlow({ payload, context, api }) {
  const baseUrl = getEventsApiBaseUrl(context);
  const headers = context.requestHeaders || {};
  const eventId = payload?.eventId ? String(payload.eventId).trim() : "";

  if (!eventId) {
    return fail({
      code: "DELETE_EVENT_MISSING_ID",
      message: "eventId is required to delete an event.",
      details: payload,
    });
  }

  try {
    const response = await api.delete(`${baseUrl}/events/${encodeURIComponent(eventId)}`, {
      headers,
      signal: context.signal,
      timeoutMs: context.requestTimeoutMs,
    });

    const status = getHttpStatus(response, 200);

    if (response?.ok === false) {
      return fail({
        code: "DELETE_EVENT_FAILED",
        message: response?.message || response?.error || "Failed to delete event.",
        details: response,
      });
    }

    return ok(
      {
        eventId: response?.eventId || eventId,
        hardDelete: !!response?.hardDelete,
      },
      {
        flow: "events.deleteEvent",
        status,
      },
    );
  } catch (error) {
    return asFlowError(
      error,
      "DELETE_EVENT_UNEXPECTED",
      "Unexpected error while deleting event.",
    );
  }
}
