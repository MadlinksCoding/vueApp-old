import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  engine: null,
  callbacks: {},
  routeLeaveGuard: null,
  route: { path: "/UnifiedBookingForm", query: {} },
  router: { push: vi.fn(), replace: vi.fn() },
  mapAvailabilityToCalendarEvents: vi.fn(() => []),
  mapBookedSlotsToCalendarEvents: vi.fn(() => []),
  getBookingJoinState: vi.fn(() => ({ canJoin: true, joinUrl: "https://example.com/private-call" })),
  buildScheduledGroupMeetingUrl: vi.fn(() => "https://example.com/group-call"),
  showToast: vi.fn(),
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
  onBeforeRouteLeave: (guard) => {
    mock.routeLeaveGuard = guard;
  },
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
  mapBookedSlotsToCalendarEvents: mock.mapBookedSlotsToCalendarEvents,
}));

vi.mock("@/utils/calendarHelpers.js", () => ({
  hhmm: (date) => new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
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

vi.mock("@/utils/toastBus.js", () => ({
  showToast: mock.showToast,
}));

vi.mock("@/utils/bookingJoinUtils.js", () => ({
  getBookingJoinState: mock.getBookingJoinState,
  buildScheduledGroupMeetingUrl: mock.buildScheduledGroupMeetingUrl,
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
    template: "<div data-test='step-1'>Step 1<input data-test='step-1-input' /></div>",
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
    props: ["events", "variant", "dayColumnMode", "rowHeightPx", "focusDate"],
    emits: ["approve-booking", "reject-booking", "cancel-booking", "join-call", "refresh-events"],
    methods: {
      noop() {},
      scrollToCurrentTime() {
        return Promise.resolve(true);
      },
    },
    template: `
      <div data-test="calendar">
        <button data-test="calendar-approve" @click="$emit('approve-booking', { bookingId: 'booking_action' })">approve</button>
        <button data-test="calendar-reject" @click="$emit('reject-booking', { bookingId: 'booking_action' })">reject</button>
        <button data-test="calendar-cancel" @click="$emit('cancel-booking', { bookingId: 'booking_action', event: { title: 'Action event', start: '2026-05-07T10:00:00', end: '2026-05-07T11:00:00' } })">cancel</button>
        <button data-test="calendar-join" @click="$emit('join-call', { event: { bookingId: 'booking_action', eventId: 'evt_action', status: 'confirmed', start: '2026-05-07T10:00:00', end: '2026-05-07T11:00:00', eventType: '1on1-call' } })">join</button>
        <button data-test="calendar-refresh" @click="$emit('refresh-events')">refresh</button>
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
          <slot
            v-else-if="event.slot === 'event'"
            name="event"
            :event="event"
            style="top:0;height:32px;left:2px;right:2px;"
            :onClick="noop"
          />
          <slot
            v-else-if="event.slot === 'alt'"
            name="event-alt"
            :event="event"
            style="top:0;height:32px;left:2px;right:2px;"
            :onClick="noop"
          />
          <slot
            v-else
            name="event-custom2"
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
  default: {
    name: "OneOnOneBookingFlowPopup",
    props: ["modelValue", "previewEvent", "previewBookedSlots", "previewStartStep", "previewReadOnly"],
    emits: ["update:modelValue", "edit-schedule"],
    template: "<div data-test='booking-flow-popup' :data-open='modelValue ? `true` : `false`' />",
  },
}));

vi.mock("@/components/ui/toast/ToastHost.vue", () => ({
  default: { name: "ToastHost", template: "<div />" },
}));

vi.mock("@/components/ui/popup/PopupHandler.vue", () => ({
  default: {
    name: "PopupHandler",
    props: ["modelValue", "config"],
    emits: ["update:modelValue"],
    template: "<div v-if='modelValue' data-test='popup-handler'><slot /></div>",
  },
}));

describe("UnifiedBookingForm mobile step scroll", () => {
  let originalScrollTo;

  beforeEach(() => {
    mock.engine = createMockEngine();
    mock.callbacks = {};
    mock.routeLeaveGuard = null;
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
    mock.mapBookedSlotsToCalendarEvents.mockReset();
    mock.mapBookedSlotsToCalendarEvents.mockImplementation((slots = []) => slots.map((slot, index) => ({
      id: `booking_${slot.bookingId || index}`,
      bookingId: slot.bookingId || null,
      eventId: slot.eventId,
      title: slot.eventTitle || "Booked Slot",
      start: slot.startIso || "2030-01-15T10:00:00",
      end: slot.endIso || slot.endAtIso || "2030-01-15T11:00:00",
      status: slot.status,
      slot: ["confirmed", "completed"].includes(slot.status) ? "event" : "custom",
      raw: slot,
    })));
    mock.getBookingJoinState.mockReset();
    mock.getBookingJoinState.mockReturnValue({
      canJoin: true,
      joinUrl: "https://example.com/private-call",
    });
    mock.buildScheduledGroupMeetingUrl.mockReset();
    mock.buildScheduledGroupMeetingUrl.mockReturnValue("https://example.com/group-call");
    mock.showToast.mockReset();
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

  it("hides an availability title when the same event has a booking in its first slot", async () => {
    mock.engine.callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_overlap",
          title: "Overlapping Schedule",
          type: "1on1-call",
          eventCallType: "video",
          eventColorSkin: "#5549FF",
        }],
        bookedSlots: [{
          bookingId: "booking_overlap",
          eventId: "evt_overlap",
          eventTitle: "First Booking",
          status: "confirmed",
          startIso: "2030-01-15T10:00:00",
          endIso: "2030-01-15T10:30:00",
        }],
        bookedSlotsIndex: {},
      },
    });
    mock.mapAvailabilityToCalendarEvents.mockReturnValueOnce([{
      id: "availability_evt_overlap",
      eventId: "evt_overlap",
      title: "Overlapping Schedule",
      start: "2030-01-15T10:00:00",
      end: "2030-01-15T12:00:00",
      isAvailabilityBlock: true,
      raw: { eventId: "evt_overlap" },
    }]);

    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    const calendarEvents = wrapper.getComponent({ name: "MainCalendar" }).props("events");
    expect(calendarEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        eventId: "evt_overlap",
        slot: "availability",
        hideAvailabilityTitle: true,
      }),
    ]));
    const availabilityBlock = wrapper.get("[data-test='calendar-existing-availability-block']");
    expect(availabilityBlock.find("[data-test='calendar-availability-title']").exists()).toBe(false);
    expect(wrapper.get("[data-test='calendar-week-booking-block']").exists()).toBe(true);
  });

  it("configures the form calendar as a 120px theme2 event-column week", async () => {
    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    const calendar = wrapper.getComponent({ name: "MainCalendar" });
    expect(calendar.props("variant")).toBe("theme2");
    expect(calendar.props("dayColumnMode")).toBe("events");
    expect(calendar.props("rowHeightPx")).toBe(120);
  });

  it("decorates completed bookings and groups every draft window under one event id", async () => {
    mock.engine.state.eventTitle = "Draft Schedule";
    mock.engine.state.repeatRule = "daily";
    mock.engine.state.dateFrom = "2026-05-07";
    mock.engine.state.selectedStartTime = "10:00";
    mock.engine.state.selectedEndTime = "11:00";
    mock.engine.callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_completed",
          title: "Completed Strategy Call",
          type: "1on1-call",
          eventCallType: "audio",
          eventColorSkin: "#22C55E",
          createdAt: "2026-01-02T03:04:05Z",
        }],
        bookedSlots: [{
          bookingId: "booking_completed",
          eventId: "evt_completed",
          status: "completed",
          startIso: "2026-05-07T08:00:00",
          endIso: "2026-05-07T09:00:00",
        }],
        bookedSlotsIndex: {},
      },
    });

    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    const events = wrapper.getComponent({ name: "MainCalendar" }).props("events");
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        bookingId: "booking_completed",
        eventId: "evt_completed",
        title: "Completed Strategy Call",
        status: "completed",
        eventCallType: "audio",
        eventColorSkin: "#22C55E",
        createdAt: "2026-01-02T03:04:05Z",
        isExistingSchedule: true,
      }),
    ]));
    const draftIds = events
      .filter((event) => event.isDraftPreview)
      .map((event) => event.eventId);
    expect(draftIds.length).toBeGreaterThan(1);
    expect(new Set(draftIds)).toEqual(new Set(["draft_new_event"]));
    expect(mock.mapBookedSlotsToCalendarEvents).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ status: "completed" })]),
      expect.objectContaining({ includeStatuses: expect.arrayContaining(["completed"]) }),
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
        expect.objectContaining({
          eventId: "evt_edit",
          slot: "event",
          isExistingSchedule: true,
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

  it("wires booking review, cancellation, refresh, and new-tab joining through the form engine", async () => {
    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    await wrapper.get("[data-test='calendar-approve']").trigger("click");
    await flushPromises();
    await wrapper.get("[data-test='calendar-reject']").trigger("click");
    await flushPromises();

    expect(mock.engine.callFlow).toHaveBeenCalledWith(
      "bookings.reviewPendingBooking",
      expect.objectContaining({ bookingId: "booking_action", decision: "approve", actor: "creator" }),
      expect.any(Object),
    );
    expect(mock.engine.callFlow).toHaveBeenCalledWith(
      "bookings.reviewPendingBooking",
      expect.objectContaining({ bookingId: "booking_action", decision: "reject", actor: "creator" }),
      expect.any(Object),
    );

    await wrapper.get("[data-test='calendar-cancel']").trigger("click");
    await wrapper.get("[data-test='booking-form-cancel-confirm']").trigger("click");
    await flushPromises();
    expect(mock.engine.callFlow).toHaveBeenCalledWith(
      "bookings.cancelBooking",
      expect.objectContaining({ bookingId: "booking_action", actor: "creator" }),
      expect.any(Object),
    );

    await wrapper.get("[data-test='calendar-join']").trigger("click");
    expect(mock.getBookingJoinState).toHaveBeenCalled();
    expect(wrapper.emitted("open-url")?.at(-1)).toEqual([{
      url: "https://example.com/private-call",
      target: "_blank",
    }]);

    const fetchCountBeforeRefresh = mock.engine.callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchCreatorBookingContext",
    ).length;
    await wrapper.get("[data-test='calendar-refresh']").trigger("click");
    await flushPromises();
    const fetchCountAfterRefresh = mock.engine.callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchCreatorBookingContext",
    ).length;
    expect(fetchCountAfterRefresh).toBeGreaterThan(fetchCountBeforeRefresh);
  });

  it("opens saved availability actions, emits confirmed edit navigation, and deletes through the flow engine", async () => {
    mock.engine.callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_schedule",
          title: "Creator Schedule",
          type: "1on1-call",
          eventColorSkin: "#22C55E",
        }],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });
    mock.mapAvailabilityToCalendarEvents.mockReturnValue([{ 
      id: "availability_evt_schedule",
      eventId: "evt_schedule",
      title: "Creator Schedule",
      start: "2030-01-15T10:00:00",
      end: "2030-01-15T11:00:00",
      slot: "availability",
      isAvailabilityBlock: true,
      raw: { eventId: "evt_schedule" },
    }]);

    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    await wrapper.get("[data-test='calendar-existing-availability-block']").trigger("click");
    let menuButtons = wrapper.get("[data-test='booking-schedule-menu']").findAll("button");
    await menuButtons[1].trigger("click");
    await flushPromises();
    const openSchedulePreview = wrapper.findAllComponents({ name: "OneOnOneBookingFlowPopup" })
      .find((popup) => popup.props("modelValue") === true);
    expect(openSchedulePreview?.props("previewEvent")).toEqual(expect.objectContaining({
      eventId: "evt_schedule",
    }));

    await wrapper.get("[data-test='calendar-existing-availability-block']").trigger("click");
    menuButtons = wrapper.get("[data-test='booking-schedule-menu']").findAll("button");
    await menuButtons[0].trigger("click");
    await flushPromises();
    expect(wrapper.emitted("edit-event")?.at(-1)).toEqual([expect.objectContaining({
      eventId: "evt_schedule",
      type: "private",
    })]);

    await wrapper.get("[data-test='calendar-existing-availability-block']").trigger("click");
    menuButtons = wrapper.get("[data-test='booking-schedule-menu']").findAll("button");
    await menuButtons.at(-1).trigger("click");
    await wrapper.get("[data-test='booking-form-delete-confirm']").trigger("click");
    await flushPromises();

    expect(mock.engine.callFlow).toHaveBeenCalledWith(
      "events.deleteEvent",
      { eventId: "evt_schedule" },
      expect.any(Object),
    );
  });

  it("warns before leaving after the form is edited", async () => {
    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    await wrapper.get("[data-test='step-1-input']").trigger("input");

    const leavePromise = mock.routeLeaveGuard();
    await flushPromises();

    expect(wrapper.find("[data-test='unsaved-leave-dialog']").exists()).toBe(true);

    await wrapper.get("[data-test='unsaved-leave-stay']").trigger("click");
    await expect(leavePromise).resolves.toBe(false);
  });

  it("emits back after confirming the unsaved changes warning", async () => {
    const { default: UnifiedBookingForm } = await import("@/components/ui/form/BookingForm/UnifiedBookingForm.vue");
    const wrapper = mount(UnifiedBookingForm);
    await flushPromises();

    await wrapper.get("[data-test='step-1-input']").trigger("input");
    await wrapper.get("[data-test='booking-form-close']").trigger("click");
    await flushPromises();

    expect(wrapper.find("[data-test='unsaved-leave-dialog']").exists()).toBe(true);

    await wrapper.get("[data-test='unsaved-leave-confirm']").trigger("click");
    await flushPromises();

    expect(wrapper.emitted("back")).toHaveLength(1);
  });
});
