import { describe, expect, it } from "vitest";
import { isPendingPriceAdjustment } from "@/services/bookings/utils/bookingNegotiationUtils.js";

function bookingWithNegotiation({
  currentCounterOffer = "adjust",
  type = "adjust",
  status = "sent",
  originalTokens = 100,
  proposedTokens = 125,
} = {}) {
  return {
    meta: {
      currentCounterOffer,
      negotiation: {
        type,
        status,
        original: { totalTokens: originalTokens },
        proposed: { totalTokens: proposedTokens },
      },
    },
  };
}

describe("isPendingPriceAdjustment", () => {
  it("detects an active sent Adjust negotiation with a changed price through calendar wrappers", () => {
    expect(isPendingPriceAdjustment({
      sourceEvent: { raw: bookingWithNegotiation() },
    })).toBe(true);
  });

  it("falls through wrapper metadata that does not contain negotiation state", () => {
    expect(isPendingPriceAdjustment([
      { meta: { chatId: "chat_123" } },
      { raw: bookingWithNegotiation() },
    ])).toBe(true);
  });

  it("resolves the booked-slot boolean through dashboard calendar wrappers", () => {
    expect(isPendingPriceAdjustment({
      sourceEvent: { raw: { pendingPriceAdjustment: true } },
    })).toBe(true);
  });

  it("treats an explicit false projection as authoritative", () => {
    expect(isPendingPriceAdjustment({
      raw: {
        ...bookingWithNegotiation(),
        pendingPriceAdjustment: false,
      },
    })).toBe(false);
  });

  it("prefers current fetched metadata over a stale projected fallback", () => {
    expect(isPendingPriceAdjustment([
      bookingWithNegotiation({ status: "accepted" }),
      { raw: { pendingPriceAdjustment: true } },
    ])).toBe(false);
  });

  it.each([
    ["unchanged price", { proposedTokens: 100 }],
    ["accepted negotiation", { status: "accepted" }],
    ["declined negotiation", { status: "declined" }],
    ["non-Adjust negotiation", { currentCounterOffer: "reschedule", type: "reschedule" }],
    ["missing proposed price", { proposedTokens: null }],
    ["missing original price", { originalTokens: null }],
  ])("returns false for %s", (_label, overrides) => {
    expect(isPendingPriceAdjustment(bookingWithNegotiation(overrides))).toBe(false);
  });

  it("supports legacy Adjust metadata while the counteroffer is active", () => {
    expect(isPendingPriceAdjustment({
      raw: {
        meta: {
          currentCounterOffer: "adjust",
          adjust: { prevTotalTokens: "100", proposedTokens: "120" },
        },
      },
    })).toBe(true);
  });
});
