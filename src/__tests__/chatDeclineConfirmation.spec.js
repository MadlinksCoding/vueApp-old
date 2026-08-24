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

  it("retains open creator details and always raises the review toast", () => {
    const chatWindow = source("src/components/ui/chat/ChatWindow.vue");
    const body = chatWindow.slice(
      chatWindow.indexOf("async function performBookingDecision"),
      chatWindow.indexOf("function onDirectAccept"),
    );

    expect(body).toContain("showBookingPopup.value && activeBookingRole.value === 'creator'");
    expect(body).toContain("if (!retainOpen) showBookingPopup.value = false");
    // The dashboard toast is the only feedback a creator acting from a bubble gets,
    // so it must not be gated on the compact detail session.
    expect(body).toContain("showCreatorBookingReviewToast({");
    expect(body).not.toContain("showReviewToast");
  });

  it("never re-broadcasts the pre-action booking message", () => {
    const chatWindow = source("src/components/ui/chat/ChatWindow.vue");

    expect(chatWindow).toContain("function bookingMessageWithAction(message, action)");
    // `|| message` would push the stale action back over the socket, leaving the
    // other side on the pending bubble until it refetched the booking.
    expect(chatWindow).not.toMatch(/broadcastBookingUpdate\([^)]*\|\|\s*message\)/);
    for (const action of ["newAction", "'accepted'", "'cancelled'", "'declined'"]) {
      expect(chatWindow).toContain(`bookingMessageWithAction(message, ${action})`);
    }
  });

  it("refreshes the cached booking after every write, even without a returned item", () => {
    const chatWindow = source("src/components/ui/chat/ChatWindow.vue");
    const helper = chatWindow.slice(
      chatWindow.indexOf("async function refreshCachedBooking"),
      chatWindow.indexOf("// The booking-details embed gets the dashboard toast"),
    );

    expect(helper).toContain("bookings.fetchBooking");
    expect(helper).toContain("chatStore.setBooking(bookingId, fetched)");
    expect(chatWindow.match(/await refreshCachedBooking\(bookingId, /g) || []).toHaveLength(4);
  });

  it("opens cancelled creator details after a direct chat-menu cancellation", () => {
    const chatWindow = source("src/components/ui/chat/ChatWindow.vue");
    const cancellation = chatWindow.slice(
      chatWindow.indexOf("async function confirmBookingCancellation"),
      chatWindow.indexOf("// A fan declining a price adjustment"),
    );

    expect(cancellation).toContain("const openCreatorDetails = isCreatorAccount.value && !showBookingPopup.value");
    expect(cancellation).toContain("pendingDirectCreatorCancellationDetails.value = { booking: updatedBooking }");
    expect(chatWindow).toContain('@closed="handleBookingDecisionClosed"');
    expect(chatWindow).toContain("compactBookingDetailsSession.value = false");
    expect(chatWindow).toContain("showBookingPopup.value = true");
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
