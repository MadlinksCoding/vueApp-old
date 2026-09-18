import { describe, expect, it } from "vitest";
import {
  getPendingCounterOffer,
  isPendingCounterOffer,
  isPendingPriceAdjustment,
} from "@/services/bookings/utils/bookingNegotiationUtils.js";

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

describe("isPendingCounterOffer", () => {
  it.each(["adjust", "reschedule", "more_time"])(
    "detects an active creator-sent %s offer through calendar wrappers",
    (type) => {
      expect(isPendingCounterOffer({
        sourceEvent: {
          raw: bookingWithNegotiation({ currentCounterOffer: type, type }),
        },
      })).toBe(true);
    },
  );

  it("resolves the booked-slot boolean and treats explicit false as authoritative", () => {
    expect(isPendingCounterOffer({
      sourceEvent: { raw: { pendingCounterOffer: true } },
    })).toBe(true);
    expect(isPendingCounterOffer({
      raw: {
        ...bookingWithNegotiation(),
        pendingCounterOffer: false,
      },
    })).toBe(false);
  });

  it("supports the older pending price adjustment projection", () => {
    expect(isPendingCounterOffer({ raw: { pendingPriceAdjustment: true } })).toBe(true);
    expect(isPendingCounterOffer({ raw: { pendingPriceAdjustment: false } })).toBe(false);
  });

  it("treats an equal-price Adjust as an active counteroffer", () => {
    expect(isPendingCounterOffer(bookingWithNegotiation({ proposedTokens: 100 }))).toBe(true);
  });

  it.each([
    ["accepted", { status: "accepted" }],
    ["declined", { status: "declined" }],
    ["mismatched", { currentCounterOffer: "adjust", type: "reschedule" }],
    ["fan-authored", {}],
  ])("returns false for %s canonical offers", (label, overrides) => {
    const booking = bookingWithNegotiation(overrides);
    if (label === "fan-authored") booking.meta.negotiation.actor = "fan";
    expect(isPendingCounterOffer(booking)).toBe(false);
  });

  it("supports legacy active markers and rejects a missing marker", () => {
    expect(isPendingCounterOffer({ meta: { currentCounterOffer: "more_time" } })).toBe(true);
    expect(isPendingCounterOffer({
      meta: { negotiation: bookingWithNegotiation().meta.negotiation },
    })).toBe(false);
  });
});

describe("getPendingCounterOffer", () => {
  it("keeps an equal-price canonical Adjust actionable when its start changes", () => {
    const value = bookingWithNegotiation({ proposedTokens: 100 });
    value.startAtIso = "2027-04-25T14:15:00Z";
    value.meta.negotiation.actor = "creator";
    value.meta.negotiation.original = {
      totalTokens: 100,
      startAtIso: "2027-04-25T14:15:00Z",
      durationMinutes: 30,
    };
    value.meta.negotiation.proposed = {
      totalTokens: 100,
      startAtIso: "2027-04-26T15:15:00Z",
      durationMinutes: 30,
    };

    expect(getPendingCounterOffer(value)).toEqual(expect.objectContaining({
      type: "adjust",
      proposed: expect.objectContaining({
        proposedSlotDate: "2027-04-26T15:15:00Z",
        proposedTokens: 100,
      }),
    }));
  });

  it("keeps a duration-only Adjust actionable", () => {
    const value = bookingWithNegotiation({ proposedTokens: 100 });
    value.meta.negotiation.original.durationMinutes = 30;
    value.meta.negotiation.proposed.durationMinutes = 45;

    expect(getPendingCounterOffer(value).type).toBe("adjust");
  });

  it("supports legacy schedule metadata even when the projected price flag is false", () => {
    const value = {
      startAtIso: "2027-04-25T14:15:00Z",
      pendingPriceAdjustment: false,
      meta: {
        currentCounterOffer: "adjust",
        adjust: {
          prevTotalTokens: 100,
          proposedTokens: 100,
          proposedSlotDate: "2027-04-25T16:15:00Z",
        },
      },
    };

    expect(getPendingCounterOffer(value).type).toBe("adjust");
  });

  it.each([
    ["a genuine no-op", {}],
    ["an invalid proposed schedule", { proposedStart: "not-a-date" }],
    ["a terminal proposal", { status: "accepted", proposedStart: "2027-04-26T15:15:00Z" }],
  ])("rejects %s Adjust proposal", (_label, options) => {
    const value = bookingWithNegotiation({ proposedTokens: 100, status: options.status || "sent" });
    value.meta.negotiation.original.startAtIso = "2027-04-25T14:15:00Z";
    if (options.proposedStart) value.meta.negotiation.proposed.startAtIso = options.proposedStart;
    expect(getPendingCounterOffer(value).type).toBeNull();
  });
});
