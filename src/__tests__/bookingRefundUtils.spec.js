import { describe, expect, it } from "vitest";
import { resolveBookingRefundState } from "@/services/bookings/utils/bookingRefundUtils.js";

describe("resolveBookingRefundState", () => {
  it.each([
    [{ paymentStatus: "refunded" }, "full"],
    [{ paymentStatus: "partial_refunded" }, "partial"],
    [{ paymentSettlement: { releasedTotal: 900, capturedTotal: 100 } }, "partial"],
    [{ cancellation: { refundedTokens: 900, retainedTokens: 100 } }, "partial"],
    [{ cancellation: { refundedTokens: 900, originalTokens: 1000 } }, "partial"],
    [{ paymentSettlement: { releasedTotal: 1000, capturedTotal: 0 } }, "full"],
    [{ cancellation: { refundedTokens: 1000 } }, "full"],
    [{ paymentStatus: "captured", paymentSettlement: { releasedTotal: 0 } }, "none"],
    [{}, "none"],
  ])("classifies %o as %s", (booking, expected) => {
    expect(resolveBookingRefundState(booking)).toBe(expected);
  });
});
