import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { asFlowError, getBookingsApiBaseUrl } from "@/services/bookings/bookingsApiUtils.js";

export async function checkBookingAdjustmentAvailabilityFlow({ payload, context, api }) {
  const baseUrl = getBookingsApiBaseUrl(context);
  const bookingId = String(payload?.bookingId || "").trim();
  const startAtIso = String(payload?.startAtIso || "").trim();
  const durationMinutes = Number(payload?.durationMinutes);

  if (!bookingId || !startAtIso || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return fail({
      code: "BOOKING_AVAILABILITY_INVALID_REQUEST",
      message: "A booking id, start time, and positive duration are required.",
      details: payload,
    });
  }

  try {
    const response = await api.post(
      `${baseUrl}/bookings/${encodeURIComponent(bookingId)}/availability-check`,
      { startAtIso, durationMinutes },
      {
        headers: context.requestHeaders || {},
        signal: context.signal,
        timeoutMs: context.requestTimeoutMs,
      },
    );
    const status = getHttpStatus(response, 200);

    if (response?.ok === false) {
      return fail({
        code: "BOOKING_AVAILABILITY_CHECK_FAILED",
        message: response?.message || response?.error || "Could not verify booking availability.",
        details: response,
      }, { flow: "bookings.checkAdjustmentAvailability", status });
    }

    return ok({
      available: response?.available === true,
      reason: response?.reason || null,
    }, { flow: "bookings.checkAdjustmentAvailability", status });
  } catch (error) {
    return asFlowError(
      error,
      "BOOKING_AVAILABILITY_CHECK_UNEXPECTED",
      "Unexpected error while checking booking availability.",
    );
  }
}
