import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isCancelledBookingStatus,
  shouldShowBookingOptionsMenu,
} from "@/services/bookings/utils/bookingMenuVisibility.js";

const mocks = vi.hoisted(() => ({
  booking: null,
  flowRun: vi.fn(),
  getBookingJoinState: vi.fn(() => ({ canJoin: false, joinUrl: null })),
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
}));

vi.mock("@/utils/toastBus.js", () => ({
  showToast: mocks.showToast,
}));

vi.mock("@/services/events/eventsApiUtils", () => ({
  hktDateTimeToLocalDate: (dateIso, hm) => new Date(`${dateIso}T${hm}:00Z`),
}));

vi.mock("@/services/events/eventsApiUtils.js", () => ({
  hktDateTimeToLocalDate: (dateIso, hm) => new Date(`${dateIso}T${hm}:00Z`),
}));

const HEADER_MENU = "[data-test='chat-booking-request-menu']";
const REVIEW_MENU = "[aria-label='More booking actions']";

async function mountBubble({ status, action, isCreator, startAtIso = "2026-05-01T10:00:00Z" }) {
  mocks.booking = {
    bookingId: "booking_chat",
    status,
    startAtIso,
    endAtIso: new Date(Date.parse(startAtIso) + 30 * 60 * 1000).toISOString(),
  };
  const { default: BookingRequestBubble } = await import("@/components/ui/chat/BookingRequestBubble.vue");
  const wrapper = mount(BookingRequestBubble, {
    props: {
      message: { content: { booking_id: "booking_chat", action } },
      isCreator,
    },
  });
  await flushPromises();
  return wrapper;
}

describe("shouldShowBookingOptionsMenu", () => {
  it("gives the creator the menu only on a confirmed booking", () => {
    expect(shouldShowBookingOptionsMenu({ viewerRole: "creator", status: "confirmed" })).toBe(true);
    expect(shouldShowBookingOptionsMenu({ viewerRole: "creator", status: "accepted" })).toBe(true);
    expect(shouldShowBookingOptionsMenu({ viewerRole: "creator", status: "pending" })).toBe(false);
    expect(shouldShowBookingOptionsMenu({ viewerRole: "creator", status: "pending_hold" })).toBe(false);
    expect(shouldShowBookingOptionsMenu({ viewerRole: "creator", status: "counter_offer" })).toBe(false);
  });

  it("gives the fan the menu while the request awaits review and after it is confirmed", () => {
    expect(shouldShowBookingOptionsMenu({ viewerRole: "fan", status: "pending" })).toBe(true);
    expect(shouldShowBookingOptionsMenu({ viewerRole: "fan", status: "pending_hold" })).toBe(true);
    expect(shouldShowBookingOptionsMenu({ viewerRole: "fan", status: "confirmed" })).toBe(true);
  });

  it("withholds the fan menu while a price adjustment is on the table", () => {
    expect(shouldShowBookingOptionsMenu({
      viewerRole: "fan",
      status: "pending",
      hasPendingPriceAdjustment: true,
    })).toBe(false);
    expect(shouldShowBookingOptionsMenu({
      viewerRole: "fan",
      status: "confirmed",
      hasPendingPriceAdjustment: true,
    })).toBe(false);
  });

  it.each([
    "cancelled",
    "cancelled_user",
    "cancelled_creator",
    "declined",
    "rejected",
  ])("withholds the menu on a %s booking for both sides", (status) => {
    expect(shouldShowBookingOptionsMenu({ viewerRole: "creator", status })).toBe(false);
    expect(shouldShowBookingOptionsMenu({ viewerRole: "fan", status })).toBe(false);
    expect(isCancelledBookingStatus(status)).toBe(true);
  });

  it("withholds the menu once the booking has passed", () => {
    expect(shouldShowBookingOptionsMenu({ viewerRole: "creator", status: "confirmed", isPassed: true })).toBe(false);
    expect(shouldShowBookingOptionsMenu({ viewerRole: "fan", status: "pending", isPassed: true })).toBe(false);
  });

  it("treats missing role and status as no menu", () => {
    expect(shouldShowBookingOptionsMenu()).toBe(false);
    expect(shouldShowBookingOptionsMenu({ viewerRole: "fan", status: "" })).toBe(false);
  });
});

describe("BookingRequestBubble options menu", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T09:00:00Z"));
    mocks.flowRun.mockResolvedValue({ ok: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mocks.booking = null;
  });

  it("gives the creator no overflow control at all while the request is pending", async () => {
    const wrapper = await mountBubble({ status: "pending", action: "pending", isCreator: true });

    expect(wrapper.find(HEADER_MENU).exists()).toBe(false);
    expect(wrapper.find(REVIEW_MENU).exists()).toBe(false);
    expect(wrapper.text()).toContain("Accept");
    expect(wrapper.text()).toContain("Adjust Request");
  });

  it("gives the creator the cancel menu once the booking is confirmed", async () => {
    const wrapper = await mountBubble({ status: "confirmed", action: "pending", isCreator: true });

    await wrapper.get(HEADER_MENU).trigger("click");
    expect(wrapper.text()).toContain("Cancel Call");
  });

  it("keeps the fan menu on a pending request and drops it under a price adjustment", async () => {
    const pending = await mountBubble({ status: "pending", action: "pending", isCreator: false });
    expect(pending.find(HEADER_MENU).exists()).toBe(true);

    const adjusting = await mountBubble({ status: "pending", action: "counter_offer", isCreator: false });
    expect(adjusting.find(HEADER_MENU).exists()).toBe(false);
  });

  it("drops the menu for both sides once the booking is cancelled or has passed", async () => {
    const cancelled = await mountBubble({ status: "cancelled_user", action: "pending", isCreator: false });
    expect(cancelled.find(HEADER_MENU).exists()).toBe(false);

    const passed = await mountBubble({
      status: "confirmed",
      action: "pending",
      isCreator: true,
      startAtIso: "2026-04-30T10:00:00Z",
    });
    expect(passed.find(HEADER_MENU).exists()).toBe(false);
  });
});
