import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  flowRun: vi.fn(),
  notifyReady: vi.fn(),
  notifyUpdated: vi.fn(),
  requestClose: vi.fn(),
  requestOpenUrl: vi.fn(),
  bootstrap: {
    bookingId: "booking_123",
    creatorId: 1407,
    fanId: null,
    userRole: "creator",
    apiBaseUrl: "https://api.example.test",
  },
}));

vi.mock("@/services/flow-system/FlowHandler.js", () => ({
  default: { run: mocks.flowRun },
}));

vi.mock("@/embeds/events/bootstrap.js", () => ({
  useEventsEmbedBootstrap: () => mocks.bootstrap,
}));

vi.mock("@/embeds/events/bridge.js", () => ({
  notifyBookingDetailsReady: mocks.notifyReady,
  notifyBookingDetailsUpdated: mocks.notifyUpdated,
  requestBookingDetailsClose: mocks.requestClose,
  requestEventsEmbedOpenUrl: mocks.requestOpenUrl,
}));

vi.mock("@/i18n/bookingTranslations.js", () => ({
  useBookingTranslations: () => ({ t: (key) => key }),
}));

vi.mock("@/utils/toastBus.js", () => ({ showToast: vi.fn() }));

const CalendarDetailsStub = {
  name: "CalendarEventDetailsPopup",
  props: ["event", "booking", "userRole", "canReviewPending", "presentation"],
  emits: ["approve-booking", "reject-booking", "cancel-booking", "close", "join-call", "open-chat", "adjust-booking"],
  template: "<div data-test='calendar-details-stub' />",
};

describe("EventsEmbedBookingDetailsPage", () => {
  beforeEach(() => {
    mocks.flowRun.mockReset();
    mocks.notifyReady.mockReset();
    mocks.notifyUpdated.mockReset();
    mocks.requestClose.mockReset();
    mocks.bootstrap.userRole = "creator";
    mocks.bootstrap.creatorId = 1407;
    mocks.bootstrap.fanId = null;
    mocks.flowRun.mockResolvedValue({
      ok: true,
      data: {
        item: {
          bookingId: "booking_123",
          eventId: "event_123",
          eventTitle: "Validation call",
          eventType: "private-event",
          eventCallType: "video",
          status: "pending",
          startAtIso: "2026-08-14T10:00:00Z",
          endAtIso: "2026-08-14T10:10:00Z",
        },
      },
    });
  });

  it("fetches the exact booking and renders it in side-panel mode", async () => {
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, {
      global: {
        stubs: { CalendarEventDetailsPopup: CalendarDetailsStub, ToastHost: true },
      },
    });
    await flushPromises();

    expect(mocks.flowRun).toHaveBeenCalledWith(
      "bookings.fetchBooking",
      { bookingId: "booking_123" },
      expect.objectContaining({ apiBaseUrl: "https://api.example.test" }),
    );
    const details = wrapper.getComponent(CalendarDetailsStub);
    expect(details.props("presentation")).toBe("side-panel");
    expect(details.props("event")).toEqual(expect.objectContaining({
      bookingId: "booking_123",
      eventId: "event_123",
      start: "2026-08-14T10:00:00Z",
    }));
    expect(mocks.notifyReady).toHaveBeenCalledWith({ bookingId: "booking_123", ok: true });
  });

  it("runs creator approval and notifies the host only on success", async () => {
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, {
      global: {
        stubs: { CalendarEventDetailsPopup: CalendarDetailsStub, ToastHost: true },
      },
    });
    await flushPromises();
    mocks.flowRun.mockResolvedValueOnce({ ok: true, data: { item: { status: "confirmed" } } });

    wrapper.getComponent(CalendarDetailsStub).vm.$emit("approve-booking", { bookingId: "booking_123" });
    await flushPromises();

    expect(mocks.flowRun).toHaveBeenLastCalledWith(
      "bookings.reviewPendingBooking",
      expect.objectContaining({ bookingId: "booking_123", decision: "approve", actor: "creator" }),
      expect.any(Object),
    );
    expect(mocks.notifyUpdated).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking_123",
      action: "approve",
    }));
  });

  it("renders an error state and leaves the panel open when fetch fails", async () => {
    mocks.flowRun.mockResolvedValueOnce({ ok: false, error: { message: "Not found" } });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, {
      global: {
        stubs: { CalendarEventDetailsPopup: CalendarDetailsStub, ToastHost: true },
      },
    });
    await flushPromises();

    expect(wrapper.get("[data-test='booking-details-error']").text()).toContain("Not found");
    expect(mocks.notifyReady).toHaveBeenCalledWith({ bookingId: "booking_123", ok: false });
    expect(mocks.requestClose).not.toHaveBeenCalled();
  });
});
