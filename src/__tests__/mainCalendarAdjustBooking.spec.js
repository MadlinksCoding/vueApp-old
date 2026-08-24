import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  flowRun: vi.fn(),
  requestSync: vi.fn(),
  showToast: vi.fn(),
  resolveUserId: vi.fn(() => "2615"),
}));

vi.mock("@/services/flow-system/FlowHandler", () => ({
  default: { run: mocks.flowRun },
}));

vi.mock("@/embeds/events/bridge.js", () => ({ requestBookingChatSync: mocks.requestSync }));

vi.mock("@/utils/toastBus.js", () => ({ showToast: mocks.showToast }));

vi.mock("@/utils/resolveUserId", () => ({ resolveUserId: mocks.resolveUserId }));

vi.mock("@/i18n/bookingTranslations.js", () => ({
  useBookingTranslations: () => ({ t: (key) => key, locale: { value: "en" } }),
}));

// The calendar pulls in a lot of chrome that is irrelevant here.
vi.mock("@/components/calendar/MiniCalendar.vue", () => ({ default: { name: "MiniCalendar", template: "<div />" } }));
vi.mock("@/components/calendar/EventDropdownContent.vue", () => ({ default: { name: "EventDropdownContent", template: "<div />" } }));
vi.mock("@/components/calendar/EventsWidget.vue", () => ({ default: { name: "EventsWidget", template: "<div />" } }));
vi.mock("@/components/calendar/NewEventsPopup.vue", () => ({ default: { name: "NewEventsPopup", template: "<div />" } }));
vi.mock("@/components/calendar/CalendarMobilePopupContent.vue", () => ({ default: { name: "CalendarMobilePopupContent", template: "<div />" } }));
vi.mock("@/components/calendar/MobileDateSelector.vue", () => ({ default: { name: "MobileDateSelector", template: "<div />" } }));
vi.mock("@/components/dev/button/ButtonComponent.vue", () => ({ default: { name: "ButtonComponent", template: "<button />" } }));
vi.mock("@/components/ui/form/checkbox/CheckboxGroup.vue", () => ({ default: { name: "CheckboxGroup", template: "<div />" } }));
vi.mock("@/components/ui/popup/PopupHandler.vue", () => ({
  default: { name: "PopupHandler", props: ["modelValue"], template: "<div><slot /></div>" },
}));

const DetailsStub = {
  name: "BookingDetailsPopup",
  props: ["event", "booking", "refreshing"],
  emits: ["adjust-booking", "accept-adjustment", "decline-adjustment", "cancel-booking"],
  template: "<div data-test='details-stub' />",
};

const AdjustStub = {
  name: "AdjustBookingPopup",
  props: ["message", "chatId"],
  emits: ["close", "submitted"],
  template: "<div data-test='adjust-stub' />",
};

vi.mock("@/components/ui/popup/BookingDetailsPopup.vue", () => ({ default: DetailsStub }));
vi.mock("@/components/ui/chat/AdjustBookingPopup.vue", () => ({ default: AdjustStub }));

const baseDate = new Date(2026, 7, 20);

const theme = {
  mini: {},
  main: {
    wrapper: "", title: "", xHeader: "", axisXLabel: "", axisXDay: "",
    axisXToday: "", axisYRow: "", colBase: "", gridRow: "", eventBase: "",
  },
  month: { cellBase: "", outside: "", today: "" },
};

function booking(meta) {
  return {
    bookingId: "booking_1",
    eventId: "event_1",
    eventTitle: "NHS Test",
    startAtIso: "2026-08-20T19:05:00Z",
    endAtIso: "2026-08-20T19:10:00Z",
    creatorId: 1407,
    userId: 2615,
    meta,
  };
}

async function mountCalendar() {
  const { default: MainCalendar } = await import("@/components/calendar/MainCalendar.vue");
  return mount(MainCalendar, {
    props: {
      focusDate: baseDate,
      events: [],
      theme,
      variant: "default",
      timeStart: "00:00",
      timeEnd: "24:00",
      slotMinutes: 60,
      userRole: "creator",
      canReviewPending: true,
    },
  });
}

async function requestAdjust(wrapper, value) {
  // The detail panel only renders once a booking is selected.
  wrapper.vm.eventDetailsPopupOpen = true;
  await wrapper.vm.$nextTick();

  wrapper.getComponent(DetailsStub).vm.$emit("adjust-booking", {
    bookingId: value.bookingId,
    eventId: value.eventId,
    event: { raw: value },
    booking: value,
  });
  await wrapper.vm.$nextTick();
}

describe("MainCalendar adjust request", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mocks.flowRun.mockReset();
    mocks.flowRun.mockResolvedValue({ ok: true, data: { item: {} } });
    mocks.requestSync.mockReset();
    mocks.showToast.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rebuilds the linked chat message so the adjust popup can submit", async () => {
    const wrapper = await mountCalendar();
    await requestAdjust(wrapper, booking({ chatId: "chat_1", bookingMessageId: "message_1" }));

    const adjust = wrapper.getComponent(AdjustStub);
    expect(adjust.props("chatId")).toBe("chat_1");
    expect(adjust.props("message")).toEqual(expect.objectContaining({
      message_id: "message_1",
      chat_id: "chat_1",
      content_type: "booking_request",
    }));
    // This is the field AdjustBookingPopup reads to call bookings.updateMeta.
    expect(adjust.props("message").content.booking_id).toBe("booking_1");

    wrapper.unmount();
  });

  it.each([
    ["no chat id", { bookingMessageId: "message_1" }],
    ["no booking message id", { chatId: "chat_1" }],
    ["no meta at all", {}],
  ])("refuses to open the adjust popup when the booking has %s", async (_label, meta) => {
    const wrapper = await mountCalendar();
    await requestAdjust(wrapper, booking(meta));

    expect(wrapper.findComponent(AdjustStub).exists()).toBe(false);
    expect(mocks.showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      message: "dashboard_booking_adjust_unavailable",
    }));

    wrapper.unmount();
  });

  it.each([
    ["accept-adjustment", "accept-adjustment"],
    ["decline-adjustment", "decline-adjustment"],
  ])("attaches the selected booking when forwarding %s", async (_label, eventName) => {
    const wrapper = await mountCalendar();
    const value = booking({ chatId: "chat_1", bookingMessageId: "message_1" });

    wrapper.vm.eventDetailsPopupOpen = true;
    wrapper.vm.selectedEvent = { bookingId: value.bookingId, raw: value };
    await wrapper.vm.$nextTick();

    // The popup only emits the proposal figures, so the host would have no booking
    // to act on unless the calendar attaches it.
    wrapper.getComponent(DetailsStub).vm.$emit(eventName, { negotiationId: "neg_1", proposedTokens: 10 });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted(eventName)?.[0]?.[0]).toEqual(expect.objectContaining({
      negotiationId: "neg_1",
      proposedTokens: 10,
      booking: expect.objectContaining({ bookingId: "booking_1" }),
    }));

    wrapper.unmount();
  });

  it("relays the counter offer through the host instead of its own socket", async () => {
    const wrapper = await mountCalendar();
    const value = booking({ chatId: "chat_1", bookingMessageId: "message_1" });
    await requestAdjust(wrapper, value);

    const item = { message_id: "message_1", content: { booking_id: "booking_1" } };
    wrapper.getComponent(AdjustStub).vm.$emit("submitted", { item, booking: value });
    await wrapper.vm.$nextTick();
    await Promise.resolve();

    // This surface has no chat socket, so the broadcast and activity log go to the
    // chat embed via the host relay.
    expect(mocks.requestSync).toHaveBeenCalledWith(expect.objectContaining({
      chatId: "chat_1",
      bookingId: "booking_1",
      item,
      recipientIds: ["1407", "2615"],
      activityLog: expect.objectContaining({
        text: "Counter offer sent",
        meta: expect.objectContaining({ decision: "counter_offer" }),
      }),
    }));

    wrapper.unmount();
  });

  it("keeps creator details open while forwarding ordinary cancellation intent", async () => {
    const wrapper = await mountCalendar();
    const value = booking({ chatId: "chat_1", bookingMessageId: "message_1" });
    wrapper.vm.selectedEvent = { bookingId: value.bookingId, raw: value };
    wrapper.vm.eventDetailsPopupOpen = true;
    await wrapper.vm.$nextTick();

    wrapper.getComponent(DetailsStub).vm.$emit("cancel-booking", {
      bookingId: value.bookingId,
      event: wrapper.vm.selectedEvent,
      origin: "booking-details",
      retainDetailsOnSuccess: true,
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.eventDetailsPopupOpen).toBe(true);
    expect(wrapper.emitted("cancel-booking")?.[0]?.[0]).toEqual(expect.objectContaining({
      bookingId: "booking_1",
      origin: "booking-details",
      retainDetailsOnSuccess: true,
    }));
    wrapper.unmount();
  });

  it("applies a cancelled booking snapshot and fallback-loading state in place", async () => {
    const wrapper = await mountCalendar();
    const value = booking({ chatId: "chat_1", bookingMessageId: "message_1" });
    wrapper.vm.selectedEvent = { bookingId: value.bookingId, raw: value };
    wrapper.vm.eventDetailsPopupOpen = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.setBookingDetailsRefreshing(true)).toBe(true);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent(DetailsStub).props("refreshing")).toBe(true);

    const cancelled = { ...value, status: "cancelled_creator", cancellation: { actor: "creator" } };
    expect(wrapper.vm.applyBookingCancellationResult({ ...wrapper.vm.selectedEvent, status: cancelled.status, raw: cancelled })).toBe(true);
    wrapper.vm.setBookingDetailsRefreshing(false);
    await wrapper.vm.$nextTick();

    expect(wrapper.getComponent(DetailsStub).props("booking")).toEqual(expect.objectContaining({
      status: "cancelled_creator",
      cancellation: { actor: "creator" },
    }));
    expect(wrapper.vm.eventDetailsPopupOpen).toBe(true);
    wrapper.unmount();
  });

  it("opens hero details with an authoritative cancellation snapshot", async () => {
    const wrapper = await mountCalendar();
    const value = booking({ chatId: "chat_1", bookingMessageId: "message_1" });
    const cancelled = {
      ...value,
      status: "cancelled_creator",
      cancellation: { actor: "creator", refundedTokens: 25 },
    };
    const event = { bookingId: value.bookingId, status: cancelled.status, raw: cancelled };

    wrapper.vm.openEventDetails(event, cancelled);
    await wrapper.vm.$nextTick();

    expect(wrapper.getComponent(DetailsStub).props("booking")).toEqual(cancelled);
    expect(wrapper.vm.eventDetailsPopupOpen).toBe(true);
    wrapper.unmount();
  });
});
