import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  booking: null,
  flowRun: vi.fn(),
  getBookingJoinState: vi.fn(),
  getCalendarEventJoinState: vi.fn(),
  openScheduledMeetingOverlay: vi.fn(() => false),
  showToast: vi.fn(),
  setBooking: vi.fn(),
}));

vi.mock("@/services/flow-system/FlowHandler", () => ({
  default: { run: mocks.flowRun },
}));

vi.mock("@/stores/useChatStore", () => ({
  useChatStore: () => ({
    getBookingById: () => mocks.booking,
    setBooking: mocks.setBooking,
  }),
}));

vi.mock("@/utils/bookingJoinUtils.js", () => ({
  getBookingJoinState: mocks.getBookingJoinState,
  openScheduledMeetingOverlay: mocks.openScheduledMeetingOverlay,
  getCalendarEventJoinState: mocks.getCalendarEventJoinState,
  getCalendarEventApprovalState: () => ({ isPending: false, approvalWindowClosed: false, canReview: false }),
}));

vi.mock("@/utils/toastBus.js", () => ({
  showToast: mocks.showToast,
}));

vi.mock("@/services/events/eventsApiUtils", () => ({
  hktDateTimeToLocalDate: (dateIso, hm) => new Date(`${dateIso}T${hm}:00Z`),
  localDateTimeToHkt: vi.fn(),
}));

vi.mock("@/services/events/eventsApiUtils.js", () => ({
  hktDateTimeToLocalDate: (dateIso, hm) => new Date(`${dateIso}T${hm}:00Z`),
  localDateTimeToHkt: vi.fn(),
}));

function installJoinStateResolver() {
  mocks.getBookingJoinState.mockImplementation(({
    bookingId,
    startAt,
    endAt,
    status,
    now = new Date(),
  }) => {
    const nowMs = new Date(now).getTime();
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    const joinUrl = bookingId ? `https://example.com/scheduled-meeting/?booking_id=${bookingId}` : null;
    return {
      canJoin: Boolean(
        joinUrl
        && status === "confirmed"
        && nowMs >= startMs - (5 * 60 * 1000)
        && nowMs < endMs
      ),
      joinUrl,
    };
  });
}

describe("chat Join Call controls", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T09:54:59Z"));
    mocks.booking = {
      bookingId: "booking_chat",
      eventId: "evt_chat",
      eventTitle: "Chat Call",
      startIso: "2026-05-01T10:00:00Z",
      startAtIso: "2026-05-01T10:00:00Z",
      endIso: "2026-05-01T10:30:00Z",
      endAtIso: "2026-05-01T10:30:00Z",
      status: "confirmed",
      extensions: [],
    };
    mocks.flowRun.mockReset();
    mocks.flowRun.mockResolvedValue({ ok: true, data: { item: mocks.booking } });
    mocks.getBookingJoinState.mockReset();
    mocks.openScheduledMeetingOverlay.mockReset();
    mocks.openScheduledMeetingOverlay.mockReturnValue(false);
    mocks.showToast.mockReset();
    mocks.setBooking.mockReset();
    vi.spyOn(window, "open").mockImplementation(() => null);
    installJoinStateResolver();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("reactively opens and closes the booking-request Join Call window", async () => {
    const { default: BookingRequestBubble } = await import("@/components/ui/chat/BookingRequestBubble.vue");
    const wrapper = mount(BookingRequestBubble, {
      props: {
        message: {
          content: { booking_id: "booking_chat", action: "accepted" },
        },
      },
    });
    await flushPromises();

    expect(wrapper.find("[data-test='chat-booking-request-join-call']").exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect(wrapper.find("[data-test='chat-booking-request-join-call']").exists()).toBe(true);

    await wrapper.get("[data-test='chat-booking-request-join-call']").trigger("click");
    expect(window.open).toHaveBeenCalledWith(
      "https://example.com/scheduled-meeting/?booking_id=booking_chat",
      "_top",
    );

    vi.setSystemTime(new Date("2026-05-01T10:30:00Z"));
    await vi.advanceTimersByTimeAsync(1000);
    expect(wrapper.find("[data-test='chat-booking-request-join-call']").exists()).toBe(false);
  });

  it("uses a fresh click-time state in the booking detail popup", async () => {
    vi.setSystemTime(new Date("2026-05-01T09:55:00Z"));
    mocks.getCalendarEventJoinState.mockImplementation((_event, { now = new Date() } = {}) => ({
      canJoin: new Date(now).getTime() >= Date.parse("2026-05-01T09:55:00Z"),
      joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_chat",
      effectiveEndDate: "2026-05-01T10:30:00Z",
    }));

    const { default: BookingDetailsPopup } = await import("@/components/ui/popup/BookingDetailsPopup.vue");
    const wrapper = mount(BookingDetailsPopup, {
      props: {
        presentation: "side-panel",
        booking: mocks.booking,
        event: {
          bookingId: mocks.booking.bookingId,
          start: mocks.booking.startAtIso,
          end: mocks.booking.endAtIso,
          status: mocks.booking.status,
          raw: mocks.booking,
        },
      },
    });
    await flushPromises();

    await wrapper.get("[data-test='event-details-fan-join']").trigger("click");
    const clickNow = mocks.getCalendarEventJoinState.mock.calls.at(-1)?.[1]?.now;
    expect(clickNow.getTime()).toBe(Date.parse("2026-05-01T09:55:00Z"));
    expect(wrapper.emitted("join-call")?.[0]?.[0]).toEqual(expect.objectContaining({
      bookingId: "booking_chat",
      joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_chat",
    }));
    expect(mocks.showToast).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it("rejects programmatic live-call clicks before the join window", async () => {
    vi.setSystemTime(new Date("2026-05-01T09:54:00Z"));
    const { default: LiveCallRequest } = await import("@/components/ui/chat/LiveCallRequest.vue");
    const wrapper = mount(LiveCallRequest, {
      props: {
        message: {
          content: {
            booking_id: "booking_chat",
            event_name: "Chat Call",
            session_link: "https://example.com/scheduled-meeting/?booking_id=booking_chat",
            start_at: "2026-05-01T10:00:00",
            end_at: "2026-05-01T10:30:00",
          },
        },
        booking: mocks.booking,
      },
    });
    await flushPromises();

    await wrapper.get("[data-test='chat-live-call-join-call']").trigger("click");
    expect(window.open).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60 * 1000);
    await wrapper.get("[data-test='chat-live-call-join-call']").trigger("click");
    expect(window.open).toHaveBeenCalledWith(
      "https://example.com/scheduled-meeting/?booking_id=booking_chat",
      "_top",
    );
  });
});
