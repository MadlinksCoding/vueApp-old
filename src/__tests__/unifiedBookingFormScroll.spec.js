import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  engine: null,
  callbacks: {},
  route: { path: "/UnifiedBookingForm", query: {} },
  router: { push: vi.fn(), replace: vi.fn() },
  mapAvailabilityToCalendarEvents: vi.fn(() => []),
  mapEventToBookingFormState: vi.fn(() => ({
    eventType: "1on1-call",
    eventTitle: "Edited Preview",
    repeatRule: "doesNotRepeat",
    eventColorSkin: "#FF00AA",
  })),
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

vi.mock("@/services/events/mappers/eventFormStateMapper.js", () => ({
  mapEventToBookingFormState: mock.mapEventToBookingFormState,
}));

vi.mock("@/services/bookings/utils/bookingSlotUtils.js", () => ({
  mapAvailabilityToCalendarEvents: mock.mapAvailabilityToCalendarEvents,
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
    props: ["engine", "embedded", "bookingType", "scheduleLocked", "pricingLocked"],
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
  default: {
    name: "MainCalendar",
    props: ["events"],
    methods: {
      noop() {},
    },
    template: `
      <div data-test="calendar">
        <template v-for="event in events || []" :key="event.id || event.eventId || event.title">
          <slot
            v-if="event.slot === 'availability'"
            name="event-availability"
            :event="event"
            style="top:0;height:32px;left:2px;right:2px;"
          />
          <slot
            v-else-if="event.slot === 'custom'"
            name="event-custom"
            :event="event"
            style="top:0;height:32px;left:2px;right:2px;"
            :onClick="noop"
          />
        </template>
      </div>
    `,
  },
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
    mock.mapEventToBookingFormState.mockClear();
    mock.mapEventToBookingFormState.mockReturnValue({
      eventType: "1on1-call",
      eventTitle: "Edited Preview",
      repeatRule: "doesNotRepeat",
      eventColorSkin: "#FF00AA",
    });
    mock.mapAvailabilityToCalendarEvents.mockReset();
    mock.mapAvailabilityToCalendarEvents.mockReturnValue([]);
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

  it("renders fetched availability blocks with the real event title", async () => {
    mock.engine.callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [
          {
            id: "evt_real_title",
            eventId: "evt_real_title",
            title: "Untitled Event",
            status: "active",
            eventColorSkin: "#22C55E",
            eventCallType: "video",
            raw: {
              eventName: "Creator Strategy Call",
            },
          },
        ],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });
    mock.mapAvailabilityToCalendarEvents.mockReturnValueOnce([
      {
        id: "availability_evt_real_title",
        eventId: "evt_real_title",
        title: "",
        start: "2030-01-15T10:00:00",
        end: "2030-01-15T11:00:00",
        isAvailabilityBlock: true,
        raw: { eventId: "evt_real_title" },
      },
    ]);

    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    expect(wrapper.get("[data-test='calendar-availability-title']").text()).toBe("Creator Strategy Call");
    expect(wrapper.getComponent({ name: "MainCalendar" }).props("events")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: "evt_real_title",
          slot: "availability",
          title: "Creator Strategy Call",
        }),
      ]),
    );
  });

  it("skips only the edited persisted event while keeping other events and the draft preview", async () => {
    mock.route.query = { mode: "edit", eventId: "evt_edit" };
    mock.engine.state.selectedStartTime = "10:00";
    mock.engine.state.selectedEndTime = "11:00";
    mock.engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "events.fetchEvent") {
        return {
          ok: true,
          data: {
            item: {
              eventId: "evt_edit",
              title: "Existing Edited Event",
              type: "1on1-call",
            },
          },
        };
      }

      return {
        ok: true,
        data: {
          events: [
            {
              raw: { eventId: "evt_edit" },
              title: "Existing Edited Event",
              status: "active",
              eventColorSkin: "#FF00AA",
            },
            {
              eventId: "evt_other",
              title: "Other Creator Event",
              status: "active",
              eventColorSkin: "#22C55E",
            },
          ],
          bookedSlots: [
            {
              eventId: "evt_edit",
              status: "confirmed",
              endAtIso: "2999-01-01T00:00:00.000Z",
            },
          ],
          bookedSlotsIndex: {},
        },
      };
    });
    mock.mapAvailabilityToCalendarEvents.mockImplementation((events = []) => events.map((event) => {
      const eventId = event.eventId || event.id || event.raw?.eventId || event.raw?.id;
      return {
        id: `availability_${eventId}`,
        eventId,
        title: "",
        start: "2030-01-15T10:00:00",
        end: "2030-01-15T11:00:00",
        isAvailabilityBlock: true,
        raw: { eventId },
      };
    }));

    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    const calendarEvents = wrapper.getComponent({ name: "MainCalendar" }).props("events");
    expect(mock.mapAvailabilityToCalendarEvents).toHaveBeenCalledWith(
      [expect.objectContaining({ eventId: "evt_other" })],
      expect.objectContaining({ bookedSlotsIndex: {} }),
    );
    expect(calendarEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: "evt_other",
          slot: "availability",
          title: "Other Creator Event",
        }),
        expect.objectContaining({
          slot: "custom",
          isDraftPreview: true,
        }),
      ]),
    );
    expect(calendarEvents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: "evt_edit",
          slot: "availability",
        }),
      ]),
    );
  });

  it("passes schedule and pricing locks to step 1 for edit-mode group events with active booked slots", async () => {
    mock.route.query = { mode: "edit", eventId: "evt_group_locked", type: "group" };
    mock.mapEventToBookingFormState.mockReturnValue({
      eventType: "group-event",
      eventId: "evt_group_locked",
      eventTitle: "Locked Group",
      repeatRule: "weekly",
      eventColorSkin: "#22C55E",
    });
    mock.engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "events.fetchEvent") {
        return {
          ok: true,
          data: {
            item: {
              eventId: "evt_group_locked",
              title: "Locked Group",
              type: "group-event",
            },
          },
        };
      }

      return {
        ok: true,
        data: {
          events: [],
          bookedSlots: [
            {
              eventId: "evt_group_locked",
              status: "confirmed",
              endAtIso: "2999-01-01T00:00:00.000Z",
            },
          ],
          bookedSlotsIndex: {},
        },
      };
    });

    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    const step1 = wrapper.getComponent({ name: "OneOnOneBookinStep1" });
    expect(step1.props("bookingType")).toBe("group");
    expect(step1.props("scheduleLocked")).toBe(true);
    expect(step1.props("pricingLocked")).toBe(true);
    expect(mock.engine.state.isGroupScheduleLocked).toBe(true);
    expect(mock.engine.state.isGroupPricingLocked).toBe(true);
  });

  it("shows all persisted events in create mode", async () => {
    mock.engine.callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [
          {
            raw: { eventId: "evt_edit" },
            title: "Existing Event",
            status: "active",
            eventColorSkin: "#FF00AA",
          },
          {
            eventId: "evt_other",
            title: "Other Creator Event",
            status: "active",
            eventColorSkin: "#22C55E",
          },
        ],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });
    mock.mapAvailabilityToCalendarEvents.mockImplementation((events = []) => events.map((event) => {
      const eventId = event.eventId || event.id || event.raw?.eventId || event.raw?.id;
      return {
        id: `availability_${eventId}`,
        eventId,
        title: "",
        start: "2030-01-15T10:00:00",
        end: "2030-01-15T11:00:00",
        isAvailabilityBlock: true,
        raw: { eventId },
      };
    }));

    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    const calendarEvents = wrapper.getComponent({ name: "MainCalendar" }).props("events");
    expect(mock.mapAvailabilityToCalendarEvents).toHaveBeenCalledWith(
      [
        expect.objectContaining({ raw: expect.objectContaining({ eventId: "evt_edit" }) }),
        expect.objectContaining({ eventId: "evt_other" }),
      ],
      expect.objectContaining({ bookedSlotsIndex: {} }),
    );
    expect(calendarEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: "evt_edit",
          slot: "availability",
          title: "Existing Event",
        }),
        expect.objectContaining({
          eventId: "evt_other",
          slot: "availability",
          title: "Other Creator Event",
        }),
      ]),
    );
  });
});
