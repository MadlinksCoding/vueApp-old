import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  engine: null,
  callbacks: {},
  route: { path: "/UnifiedBookingForm", query: {} },
  router: { push: vi.fn(), replace: vi.fn() },
}));

function setByPath(target, path, value) {
  const segments = String(path).split(".");
  let cursor = target;
  while (segments.length > 1) {
    const key = segments.shift();
    cursor[key] = cursor[key] || {};
    cursor = cursor[key];
  }
  cursor[segments[0]] = value;
}

function createMockEngine() {
  const state = {
    focus: new Date("2026-05-07T00:00:00"),
    creatorTimezone: "Asia/Hong_Kong",
  };

  return {
    state,
    logs: [],
    initialize: vi.fn(),
    setState: vi.fn((path, value) => setByPath(state, path, value)),
    getState: vi.fn((path) => {
      if (!path) return state;
      return String(path).split(".").reduce((cursor, key) => cursor?.[key], state);
    }),
    addValidator: vi.fn(),
    on: vi.fn((event, callback) => {
      mock.callbacks[event] = callback;
    }),
    callFlow: vi.fn(() => Promise.resolve({
      ok: true,
      data: {
        events: [],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    })),
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function setWindowWidth(width) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

vi.mock("vue-router", () => ({
  useRoute: () => mock.route,
  useRouter: () => mock.router,
}));

vi.mock("@/utils/flowStateEngine.js", () => ({
  createFlowStateEngine: () => mock.engine,
  attachEngineLogging: vi.fn(),
}));

vi.mock("@/composables/useBodyOverflowHidden", () => ({
  useBodyOverflowHidden: vi.fn(),
}));

vi.mock("@/services/events/validators/eventStepValidators.js", () => ({
  step1Validator: vi.fn(),
  step2Validator: vi.fn(),
}));

vi.mock("@/services/events/mappers/mapDraftEventToFanBookingPreview.js", () => ({
  mapDraftEventToFanBookingPreview: vi.fn(() => null),
}));

vi.mock("@/services/bookings/utils/bookingSlotUtils.js", () => ({
  mapAvailabilityToCalendarEvents: vi.fn(() => []),
}));

vi.mock("@/utils/calendarHelpers.js", () => ({
  addDays: (date, days) => {
    const value = new Date(date);
    value.setDate(value.getDate() + days);
    return value;
  },
  startOfWeek: (date) => new Date(date),
}));

vi.mock("@/utils/contextIds.js", () => ({
  resolveCreatorIdFromContext: vi.fn(() => 1407),
}));

vi.mock("@/i18n/bookingTranslations.js", () => ({
  useBookingTranslations: () => ({
    t: (key) => key,
  }),
}));

vi.mock("@/components/dashboard/DashboardWrapperTwoColContainer.vue", () => ({
  default: {
    name: "DashboardWrapperTwoColContainer",
    template: "<div><slot /></div>",
  },
}));

vi.mock("@/components/ui/form/BookingForm/OneOnOneBookinStep1.vue", () => ({
  default: {
    name: "OneOnOneBookinStep1",
    props: ["engine", "embedded", "bookingType"],
    template: "<div data-test='step-1'>Step 1</div>",
  },
}));

vi.mock("@/components/ui/form/BookingForm/OneOnOneBookinStep2.vue", () => ({
  default: {
    name: "OneOnOneBookinStep2",
    props: ["engine", "embedded", "bookingType"],
    template: "<div data-test='step-2'>Step 2</div>",
  },
}));

vi.mock("@/components/ui/form/BookingForm/GroupBookingStep1.vue", () => ({
  default: { name: "GroupBookingStep1", template: "<div />" },
}));

vi.mock("@/components/ui/form/BookingForm/GroupBookingStep2.vue", () => ({
  default: { name: "GroupBookingStep2", template: "<div />" },
}));

vi.mock("@/components/calendar/MainCalendar.vue", () => ({
  default: { name: "MainCalendar", template: "<div data-test='calendar' />" },
}));

vi.mock("@/components/dev/card/notification/NotificationCard.vue", () => ({
  default: { name: "NotificationCard", template: "<div />" },
}));

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue", () => ({
  default: { name: "OneOnOneBookingFlowPopup", template: "<div />" },
}));

vi.mock("@/components/ui/toast/ToastHost.vue", () => ({
  default: { name: "ToastHost", template: "<div />" },
}));

describe("UnifiedBookingForm mobile step scroll", () => {
  let originalScrollTo;

  beforeEach(() => {
    mock.engine = createMockEngine();
    mock.callbacks = {};
    mock.route.query = {};
    mock.router.push.mockReset();
    mock.router.replace.mockReset();
    originalScrollTo = window.scrollTo;
    window.scrollTo = vi.fn();
    setWindowWidth(500);
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    setWindowWidth(1024);
  });

  it("scrolls the form container and page top after mobile step 1 advances to step 2", async () => {
    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    const scrollContainer = wrapper.find(".overflow-y-auto").element;
    scrollContainer.scrollTo = vi.fn();

    await mock.callbacks["step:changed"]({ prev: 1, next: 2 });
    await flushPromises();

    expect(wrapper.find("[data-test='step-2']").exists()).toBe(true);
    expect(scrollContainer.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(wrapper.emitted("scroll-top-request")?.[0]).toEqual([
      { reason: "step-advanced", behavior: "auto" },
    ]);
  });

  it("does not scroll on desktop step changes", async () => {
    setWindowWidth(1024);
    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    const scrollContainer = wrapper.find(".overflow-y-auto").element;
    scrollContainer.scrollTo = vi.fn();

    await mock.callbacks["step:changed"]({ prev: 1, next: 2 });
    await flushPromises();

    expect(scrollContainer.scrollTo).not.toHaveBeenCalled();
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(wrapper.emitted("scroll-top-request")).toBeUndefined();
  });

  it("does not scroll for unrelated mobile step changes", async () => {
    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    const scrollContainer = wrapper.find(".overflow-y-auto").element;
    scrollContainer.scrollTo = vi.fn();

    await mock.callbacks["step:changed"]({ prev: 2, next: 1 });
    await flushPromises();

    expect(scrollContainer.scrollTo).not.toHaveBeenCalled();
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(wrapper.emitted("scroll-top-request")).toBeUndefined();
  });
});
