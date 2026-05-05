import { describe, expect, it, vi } from "vitest";
import { mapCancelBookingToRequest } from "@/services/bookings/mappers/cancelBookingMapper.js";
import { cancelBookingFlow } from "@/services/bookings/flows/cancelBookingFlow.js";

describe("cancel booking mapper", () => {
  it("passes explicit refund:false through to the cancellation request", () => {
    const mapped = mapCancelBookingToRequest({
      bookingId: "booking_123",
      actor: "fan",
      reason: "fan_manual_cancel_before_buffer",
      refund: false,
      waiveFees: true,
      args: { source: "unit_test" },
    });

    expect(mapped).toEqual({
      bookingId: "booking_123",
      actor: "fan",
      reason: "fan_manual_cancel_before_buffer",
      refund: false,
      waiveFees: true,
      args: { source: "unit_test" },
    });
  });

  it("omits refund when the caller does not provide an explicit boolean", () => {
    const mapped = mapCancelBookingToRequest({
      event: { raw: { bookingId: "booking_from_raw" } },
      refund: null,
    });

    expect(mapped.bookingId).toBe("booking_from_raw");
    expect(Object.prototype.hasOwnProperty.call(mapped, "refund")).toBe(false);
  });
});

describe("cancel booking flow", () => {
  it("posts explicit refund and keeps args for backend cancellation policy", async () => {
    const api = {
      post: vi.fn().mockResolvedValue({
        ok: true,
        item: { bookingId: "booking_123", status: "cancelled_user" },
      }),
    };

    const result = await cancelBookingFlow({
      payload: {
        bookingId: "booking_123",
        actor: "fan",
        reason: "fan_manual_cancel_before_buffer",
        refund: false,
        waiveFees: true,
        args: { source: "flow_test" },
      },
      context: {
        apiBaseUrl: "https://bookings.example.test",
        requestHeaders: { Authorization: "Bearer test" },
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(api.post).toHaveBeenCalledWith(
      "https://bookings.example.test/bookings/booking_123/cancel",
      {
        actor: "fan",
        reason: "fan_manual_cancel_before_buffer",
        refund: false,
        waiveFees: true,
        args: { source: "flow_test" },
      },
      expect.objectContaining({
        headers: { Authorization: "Bearer test" },
      }),
    );
  });
});
