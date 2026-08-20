import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// ChatWindow has no mount harness, so these assert the wiring at the source level —
// the same approach chatProductRecommendation.spec.js and negotiationWebhookPayload.spec.js use.
function source(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("chat decline confirmation", () => {
  it("routes both booking bubbles through the reject confirmation", () => {
    const chatWindow = source("src/components/ui/chat/ChatWindow.vue");

    const declineBindings = chatWindow.match(/@decline="[^"]+"/g) || [];
    expect(declineBindings).toHaveLength(2);
    expect(declineBindings.every((binding) => binding.includes("openBookingDecision('reject'"))).toBe(true);
    // Declining must never fire the API straight from the bubble again.
    expect(chatWindow).not.toContain('@decline="onDirectDecline');
  });

  it("keeps the detail popup on its own internal confirmation", () => {
    const chatWindow = source("src/components/ui/chat/ChatWindow.vue");

    // BookingDetailsPopup confirms before emitting, so routing it through
    // openBookingDecision would ask the creator twice.
    expect(chatWindow).toContain('@reject-booking="onDirectDecline"');
  });

  it("dispatches a confirmed reject to the decline handler", () => {
    const chatWindow = source("src/components/ui/chat/ChatWindow.vue");

    // Without this branch a confirmed reject falls through to onConfirmCounter,
    // which would accept the counter offer instead of declining the booking.
    expect(chatWindow).toContain("if (payload.mode === 'reject') return onDirectDecline(merged)");

    const dispatch = chatWindow.slice(chatWindow.indexOf("function confirmBookingDecision"));
    expect(dispatch.indexOf("payload.mode === 'reject'")).toBeLessThan(dispatch.indexOf("return onConfirmCounter(merged)"));
  });

  it("force-closes the decision popup once the decision resolves", () => {
    const chatWindow = source("src/components/ui/chat/ChatWindow.vue");

    // reset() early-returns while `processing` is true, so the close has to be forced.
    const body = chatWindow.slice(
      chatWindow.indexOf("async function performBookingDecision"),
      chatWindow.indexOf("function onDirectAccept"),
    );
    expect(body).toContain("closeBookingDecision({ force: true })");
  });

  it("skips the adjustment price lookup for cancel and reject", () => {
    const chatWindow = source("src/components/ui/chat/ChatWindow.vue");

    expect(chatWindow).toContain("const fallback = ['cancel', 'reject'].includes(mode) ? {} : adjustmentFromBooking(bookingId)");
  });

  it("supports reject in the shared decision composable", () => {
    const composable = source("src/composables/useBookingAdjustmentDecision.js");

    expect(composable).toContain('nextMode === "reject" ? "reject"');
    // A creator declining never spends tokens, so no balance lookup should gate the button.
    expect(composable).toContain('mode.value === "cancel" || mode.value === "reject"');
  });
});
