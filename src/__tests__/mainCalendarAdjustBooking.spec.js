import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  flowRun: vi.fn(),
  sendChatMessage: vi.fn(),
  showToast: vi.fn(),
  resolveUserId: vi.fn(() => "2615"),
}));

vi.mock("@/services/flow-system/FlowHandler", () => ({
  default: { run: mocks.flowRun },
}));

vi.mock("@/composables/useChatSocket", () => ({
  useChatSocket: () => ({ sendChatMessage: mocks.sendChatMessage }),
}));

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
  props: ["event"],
  emits: ["adjust-booking"],
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
    mocks.sendChatMessage.mockReset();
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

  it("broadcasts the counter offer with a resolved sender id", async () => {
    const wrapper = await mountCalendar();
    const value = booking({ chatId: "chat_1", bookingMessageId: "message_1" });
    await requestAdjust(wrapper, value);

    const item = { message_id: "message_1", content: { booking_id: "booking_1" } };
    mocks.flowRun.mockResolvedValueOnce({ ok: true, data: { item: { message_id: "log_1" } } });
    wrapper.getComponent(AdjustStub).vm.$emit("submitted", { item, booking: value });
    await wrapper.vm.$nextTick();
    await Promise.resolve();

    expect(mocks.flowRun).toHaveBeenCalledWith("chat.sendChatActivityLog", expect.objectContaining({
      chatId: "chat_1",
      senderId: "2615",
      text: "Counter offer sent",
    }));
    expect(mocks.sendChatMessage).toHaveBeenCalledWith(item, [1407, 2615]);

    wrapper.unmount();
  });
});
