import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ run: vi.fn() }));

vi.mock("@/services/flow-system/FlowHandler.js", () => ({
  default: { run: mocks.run },
}));

import { isHeldPaymentBalanceFailure, useBookingActions } from "@/composables/useBookingActions.js";

describe("useBookingActions structured failures", () => {
  beforeEach(() => mocks.run.mockReset());

  it("exposes the HTTP status and backend error needed for a safe hold retry", async () => {
    mocks.run.mockResolvedValue({
      ok: false,
      error: {
        code: "HTTP_402",
        message: "token_hold_adjustment_failed",
        details: {
          error: "token_hold_adjustment_failed",
          statusCode: 402,
          message: "Insufficient tokens to adjust hold",
        },
      },
      meta: {
        status: 402,
        uiErrors: ["Could not update held payment for this booking."],
      },
    });

    const actions = useBookingActions();
    const outcome = await actions.applyPriceAdjustment({
      bookingId: "booking_1",
      proposedTokens: 110,
    });

    expect(outcome).toEqual(expect.objectContaining({
      ok: false,
      error: "Could not update held payment for this booking.",
      code: "HTTP_402",
      statusCode: 402,
      backendError: "token_hold_adjustment_failed",
    }));
    expect(isHeldPaymentBalanceFailure(outcome)).toBe(true);
  });

  it("does not classify an unrelated HTTP 402 as a held-payment race", async () => {
    mocks.run.mockResolvedValue({
      ok: false,
      error: {
        code: "HTTP_402",
        message: "Payment required",
        details: { error: "subscription_payment_required" },
      },
      meta: { status: 402 },
    });

    const outcome = await useBookingActions().applyPriceAdjustment({
      bookingId: "booking_1",
      proposedTokens: 110,
    });

    expect(outcome.statusCode).toBe(402);
    expect(isHeldPaymentBalanceFailure(outcome)).toBe(false);
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });
});
