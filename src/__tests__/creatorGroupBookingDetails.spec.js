import { mount, flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BookingDetailsPopup from "@/components/ui/popup/BookingDetailsPopup.vue";
import FlowHandler from "@/services/flow-system/FlowHandler.js";

vi.mock("@/services/flow-system/FlowHandler.js", () => ({ default: { run: vi.fn() } }));
vi.mock("@/services/users/userProfileApi.js", () => ({ fetchUserProfileData: vi.fn(async () => null) }));
const Popup = { props: ["modelValue"], template: `<div v-if="modelValue"><slot /></div>` };
const start = "2030-01-15T18:00:00Z", end = "2030-01-15T19:00:00Z";
const summary = (extra = {}) => ({ eventId: "group", groupSlotId: "slot", participantCount: 3, totalTokens: 345,
  refundParticipantCount: 3, totalRefundTokens: 345, status: "confirmed", canCancel: true, ...extra });
let wrappers;
function render(props = {}) {
  const b = { bookingId: "b1", eventId: "group", creatorId: 1407, userId: 99, fanUsername: "ava", creatorUsername: "host",
    status: "confirmed", startAtIso: start, endAtIso: end, eventSnapshot: { type: "group-event", title: "Friday group" }, payment: { total: 115 } };
  const w = mount(BookingDetailsPopup, { props: { userRole: "creator", presentation: "side-panel", booking: b,
    event: { bookingId: "b1", eventId: "group", title: "Friday group", type: "group-event", start, end, status: "confirmed", raw: b },
    comparisonTime: "2030-01-15T17:00:00Z", ...props }, global: { stubs: { PopupHandler: Popup } } });
  wrappers.push(w); return w;
}
beforeEach(() => { wrappers = []; vi.clearAllMocks(); FlowHandler.run.mockResolvedValue({ ok: true, data: { summary: summary() } }); });
afterEach(() => { wrappers.forEach(w => w.unmount()); vi.useRealTimers(); });

describe("creator group booking details", () => {
  it.each([[1, "fan"], [3, "fans"]])("keeps the existing hero and information with %i %s in the creator group notice", async (count, label) => {
    FlowHandler.run.mockResolvedValue({ ok: true, data: { summary: summary({ participantCount: count }) } });
    const w = render(); await flushPromises();
    expect(w.find("[data-test=event-details-fan-hero]").exists()).toBe(true);
    expect(w.find("[data-test=booking-details-information]").exists()).toBe(true);
    expect(w.get("[data-test=booking-details-confirmed-heading]").text()).toBe(`Your event with ${count} ${label} has been confirmed`);
    expect(w.text()).not.toContain("Your event with @ava has been confirmed");
    expect(w.find("[data-test=group-event-summary]").exists()).toBe(false);
  });
  it.each(["2030-01-15T19:00:00Z", "2030-01-16T12:00:00Z"])("omits so far and cancellation menus after the end (%s)", async comparisonTime => {
    const w = render({ comparisonTime }); await flushPromises();
    expect(w.get("[data-test=booking-details-confirmed-heading]").text()).toBe("3 fans has participated in your event");
    expect(w.find("[data-test=booking-details-group-menu]").exists()).toBe(false);
    expect(w.find("[data-test=event-details-fan-menu]").exists()).toBe(false);
  });
  it("uses both existing three-dot menus for the same aggregate cancellation", async () => {
    const w = render(); await flushPromises();
    await w.get("[data-test=booking-details-group-menu]").trigger("click");
    expect(w.get("[data-test=booking-details-group-cancel]").text()).toBe("Cancel Event");
    await w.get("[data-test=booking-details-group-cancel]").trigger("click"); await flushPromises();
    expect(w.get("[data-test=booking-adjustment-decision-heading]").text()).toBe("Are you sure you want to cancel this event? Total 345 Tokens will be refunded to 3 participants.");
    expect(w.text()).toContain("Total 345 Tokens will be refunded to 3 participants.");
    expect(w.text()).toContain("Total Tokens Refunded");
    expect(w.text()).not.toContain("Session Cost Refund");
    await w.get("[data-test=booking-adjustment-decision-close]").trigger("click");
    await w.get("[data-test=event-details-fan-menu]").trigger("click");
    expect(w.get("[data-test=event-details-fan-cancel]").text()).toBe("Cancel Event");
    await w.get("[data-test=event-details-fan-cancel]").trigger("click"); await flushPromises();
    expect(w.text()).toContain("Total 345 Tokens will be refunded to 3 participants.");
  });
  it("refreshes the same popup with a skeleton and polls background refunds", async () => {
    vi.useFakeTimers(); const w = render(); await flushPromises();
    await w.get("[data-test=event-details-fan-menu]").trigger("click");
    await w.get("[data-test=event-details-fan-cancel]").trigger("click"); await flushPromises();
    const queued = summary({ status: "cancelled", canCancel: false, cancellation: { status: "queued", refundedTokens: 0, refundedCount: 0 } });
    let finish;
    FlowHandler.run.mockImplementation(id => id === "bookings.cancelGroupSlot"
      ? Promise.resolve({ ok: true, data: { summary: queued } }) : new Promise(resolve => { finish = resolve; }));
    await w.get("[data-test=booking-adjustment-decision-primary]").trigger("click"); await flushPromises();
    expect(w.find("[data-test=booking-details-group-skeleton]").exists()).toBe(true);
    finish({ ok: true, data: { summary: queued } }); await flushPromises();
    expect(w.get("[data-test=booking-details-cancelled-heading]").text()).toBe("You have cancelled the event. All participants will be fully refunded");
    expect(w.find("[data-test=booking-details-cancelled-avatar-fallback]").exists()).toBe(true);
    expect(w.find("[data-test=booking-details-cancelled-refund]").exists()).toBe(false);
    FlowHandler.run.mockResolvedValue({ ok: true, data: { summary: summary({ ...queued, cancellation: { status: "completed", refundedCount: 3, refundedTokens: 345 } }) } });
    await vi.advanceTimersByTimeAsync(5000); await flushPromises();
    expect(w.text()).toContain("345 Tokens have been refunded to 3 participants.");
    expect(w.find("[data-test=booking-details-group-menu]").exists()).toBe(false);
    const calls = FlowHandler.run.mock.calls.length;
    await vi.advanceTimersByTimeAsync(15000); expect(FlowHandler.run.mock.calls.length).toBe(calls);
  });
  it("fails closed when the full refund summary cannot be loaded", async () => {
    FlowHandler.run.mockResolvedValue({ ok: false }); const w = render(); await flushPromises();
    await w.get("[data-test=event-details-fan-menu]").trigger("click");
    await w.get("[data-test=event-details-fan-cancel]").trigger("click"); await flushPromises();
    await w.get("[data-test=booking-adjustment-decision-primary]").trigger('click'); await flushPromises();
    expect(w.text()).toContain("Could not load the participant count");
    expect(FlowHandler.run.mock.calls.some(([id]) => id === "bookings.cancelGroupSlot")).toBe(false);
  });
  it("keeps fan group notices and uses the individual withdrawal label", async () => {
    const w = render({ userRole: "fan" }); await flushPromises();
    expect(w.get("[data-test=booking-details-confirmed-heading]").text()).toContain("Your event with @host has been confirmed");
    expect(w.find("[data-test=booking-details-group-menu]").exists()).toBe(false);
    expect(FlowHandler.run.mock.calls.some(([id]) => id === "bookings.fetchGroupSlotSummary")).toBe(false);
    await w.get("[data-test=event-details-fan-menu]").trigger("click");
    expect(w.get("[data-test=event-details-fan-cancel]").text()).toBe("Withdraw Event");
  });
  it("uses the existing compact popup notice and menus for creator groups", async () => {
    const w = render({ layoutVariant: 'compact' }); await flushPromises();
    expect(w.get('[data-test=booking-details-confirmed-heading]').text()).toBe('Your event with 3 fans has been confirmed');
    expect(w.find('[data-test=booking-details-information]').exists()).toBe(true);
    await w.get('[data-test=booking-details-group-menu]').trigger('click');
    await w.get('[data-test=booking-details-group-cancel]').trigger('click'); await flushPromises();
    expect(w.text()).toContain('Total 345 Tokens will be refunded to 3 participants.');
  });
  it("keeps an active group active when only its first fan cancelled", async () => {
    const w = render({ booking: { bookingId: 'b1', status: 'cancelled_user', eventSnapshot: { type: 'group-event' } } }); await flushPromises();
    expect(w.get('[data-test=booking-details-confirmed-heading]').text()).toBe('Your event with 3 fans has been confirmed');
    expect(w.find('[data-test=booking-details-group-menu]').exists()).toBe(true);
  });
  it("keeps one-on-one creator notices unchanged", async () => {
    const w = render({ event: { type: "private-event", start, end }, booking: { bookingId: "private", status: "confirmed", fanUsername: "ava", eventSnapshot: { type: "private-event" } } }); await flushPromises();
    expect(w.get("[data-test=booking-details-confirmed-heading]").text()).toContain("Your event with @ava has been confirmed");
    expect(FlowHandler.run.mock.calls.some(([id]) => id === "bookings.fetchGroupSlotSummary")).toBe(false);
  });
});
