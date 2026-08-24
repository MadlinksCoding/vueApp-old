import { describe, expect, it } from "vitest";
import {
  ACTIVITY_LOG_TEXTS,
  resolveActivityLogTemplate,
} from "@/services/chat/utils/activityLogTemplates.js";

function template(overrides = {}) {
  return resolveActivityLogTemplate({ isBookingRequest: true, ...overrides });
}

describe("resolveActivityLogTemplate", () => {
  it("phrases a cancellation from whoever sent the log, not whoever is reading", () => {
    // Both sides can cancel, so the reader's role cannot stand in for the actor.
    expect(template({ decision: "call_cancelled", isCreator: false, isOwnLog: true }))
      .toBe("You have cancelled the call");
    expect(template({ decision: "call_cancelled", isCreator: true, isOwnLog: true }))
      .toBe("You have cancelled the call");
    expect(template({ decision: "call_cancelled", isCreator: false, isOwnLog: false }))
      .toBe("@{actor} has cancelled the call");
    expect(template({ decision: "call_cancelled", isCreator: true, isOwnLog: false }))
      .toBe("@{actor} has cancelled the call");
  });

  it.each([
    ["approve", true, "You have just confirmed @{audience}'s booking"],
    ["approve", false, "@{creator} has just confirmed your booking"],
    ["reject", true, "You have just declined @{audience}'s booking"],
    ["reject", false, "@{creator} has just declined your booking"],
    ["counter_offer", true, "You have adjust the cost of the booking"],
    ["counter_offer", false, "@{creator} has adjust the cost of the booking"],
    ["counter_offer_declined", false, "You have just declined @{creator}'s adjustment"],
    ["counter_offer_declined", true, "@{audience} has just declined your adjustment"],
  ])("keeps %s keyed by the reader's role (creator: %s)", (decision, isCreator, expected) => {
    // Only one side can take these, so role and actor are the same thing.
    expect(template({ decision, isCreator, isOwnLog: true })).toBe(expected);
    expect(template({ decision, isCreator, isOwnLog: false })).toBe(expected);
  });

  it("maps the aliases the two surfaces write for the same decision", () => {
    expect(template({ decision: "approve", isCreator: true }))
      .toBe(template({ decision: "accepted", isCreator: true }));
    expect(template({ decision: "reject", isCreator: true }))
      .toBe(template({ decision: "declined", isCreator: true }));
  });

  it("resolves non-booking logs from their stored text", () => {
    expect(resolveActivityLogTemplate({ rawText: "send_live_call_request", isCreator: false }))
      .toBe("You have just sent a live call request to @{creator}.");
    expect(resolveActivityLogTemplate({ rawText: "send_live_call_request", isCreator: true }))
      .toBe("@{audience} has just sent you a live call request.");
  });

  it("returns null when there is no template, so the stored text stands", () => {
    expect(resolveActivityLogTemplate()).toBeNull();
    expect(template({ decision: "something_new" })).toBeNull();
    expect(resolveActivityLogTemplate({ rawText: "Call cancelled" })).toBeNull();
    // A booking decision is never read off the raw text.
    expect(template({ rawText: "send_live_call_request" })).toBeNull();
  });

  it("gives every entry both of the keys its shape implies", () => {
    for (const [key, entry] of Object.entries(ACTIVITY_LOG_TEXTS)) {
      const expected = entry.self ? ["self", "other"] : ["creator", "audience"];
      expect(Object.keys(entry).sort(), `${key} is missing a variant`).toEqual([...expected].sort());
    }
  });
});
