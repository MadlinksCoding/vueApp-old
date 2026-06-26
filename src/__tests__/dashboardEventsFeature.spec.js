import { mount } from "@vue/test-utils";
import { reactive } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

let engine;
const callFlow = vi.fn();
const showToast = vi.fn();
const getBookingJoinState = vi.fn();
const mainCalendarResetScrollToTop = vi.fn();

function setByPath(target, path, value) {
  const segments = String(path).split(".");
  let cursor = target;

  while (segments.length > 1) {
    const key = segments.shift();
    if (!cursor[key] || typeof cursor[key] !== "object") {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }

  cursor[segments[0]] = value;
}

function createMockEngine() {
  return {
    state: reactive({
      events: {
        cachedResponse: null,
        list: [],
        bookedList: [],
        creatorEvents: [],
        bookedSlotsRaw: [],
        bookedSlotsIndex: {},
        meta: {},
        loading: false,
        error: null,
      },
    }),
    initialize: vi.fn(),
    setState: vi.fn((path, value) => {
      setByPath(engine.state, path, value);
    }),
    getState: vi.fn(),
    callFlow,
  };
}

vi.mock("@/utils/flowStateEngine.js", () => ({
  createFlowStateEngine: () => engine,
}));

vi.mock("@/utils/toastBus.js", () => ({
  showToast,
}));

vi.mock("@/utils/bookingJoinUtils.js", () => ({
  getBookingJoinState,
  buildScheduledGroupMeetingUrl: vi.fn(({ eventId, startIso }) => (
    `https://example.com/scheduled-meeting/?event_id=${encodeURIComponent(eventId)}&start_iso=${encodeURIComponent(startIso)}`
  )),
}));

vi.mock("@/components/calendar/MainCalendar.vue", () => ({
  default: {
    name: "MainCalendar",
    props: ["events", "eventsData", "bookingScheduleEvents", "bookingScheduleBookedSlotsIndex", "showBookingScheduleList"],
    emits: ["create-event", "month-event-click", "edit-schedule-event", "delete-schedule-event", "view-schedule-card"],
    data() {
      return {
        monthExpandedDay: new Date("2026-03-23T00:00:00"),
        monthExpandedEvents: [
          {
            id: "expanded-pending",
            eventId: "evt_expanded",
            title: "Expanded Pending Event",
            start: "2026-03-23T10:00:00",
            end: "2026-03-23T10:30:00",
            status: "pending",
            type: "1on1-call",
            eventCallType: "video",
            raw: {
              bookingId: "booking_expanded",
              creatorName: "Expanded Creator",
              eventCallType: "video",
            },
          },
        ],
        monthBookedEvent: {
          id: "month-booked",
          eventId: "evt_month_booked",
          title: "Month Booked Slot",
          start: "2026-03-23T12:00:00",
          end: "2026-03-23T12:30:00",
          status: "confirmed",
          type: "1on1-call",
          eventCallType: "video",
          isAvailabilityBlock: false,
        },
        monthPastBookedEvent: {
          id: "month-past-booked",
          eventId: "evt_month_past_booked",
          title: "Month Past Booked Slot",
          start: "2026-03-23T07:30:00",
          end: "2026-03-23T08:30:00",
          status: "confirmed",
          type: "1on1-call",
          eventCallType: "video",
          isAvailabilityBlock: false,
        },
        monthPendingEvent: {
          id: "month-pending",
          eventId: "evt_month_pending",
          title: "Month Pending Slot",
          start: "2026-03-23T13:00:00",
          end: "2026-03-23T13:30:00",
          status: "pending",
          type: "1on1-call",
          eventCallType: "video",
          color: "#E11D48",
          isAvailabilityBlock: false,
        },
        monthDeclinedEvent: {
          id: "month-declined",
          eventId: "evt_month_declined",
          title: "Month Cancelled Slot",
          start: "2026-03-23T14:00:00",
          end: "2026-03-23T14:30:00",
          status: "cancelled_creator",
          type: "1on1-call",
          eventCallType: "video",
          isAvailabilityBlock: false,
        },
        monthAvailabilityEvent: {
          id: "month-availability",
          eventId: "evt_month_availability",
          title: "Month Availability Window",
          start: "2026-03-23T09:00:00",
          end: "2026-03-23T10:00:00",
          status: "available",
          slot: "availability",
          color: "#0EA5E9",
          eventColorSkin: "#0EA5E9",
          isAvailabilityBlock: true,
          raw: {
            eventColorSkin: "#0EA5E9",
          },
        },
      };
    },
    methods: {
      handleMonthEventClick(event) {
        this.$emit("month-event-click", event);
      },
      emitScheduleEdit() {
        const event = this.bookingScheduleEvents?.[0];
        this.$emit("edit-schedule-event", event
          ? {
              ...event,
              type: String(event?.type || event?.eventType || event?.raw?.type || "").toLowerCase() === "group-event"
                ? "group"
                : event?.type,
            }
          : event);
      },
      emitScheduleDelete() {
        this.$emit("delete-schedule-event", this.bookingScheduleEvents?.[0]);
      },
      emitScheduleViewCard() {
        this.$emit("view-schedule-card", this.bookingScheduleEvents?.[0]);
      },
      resetScrollToTop: mainCalendarResetScrollToTop,
    },
    computed: {
      dynamicBookedEvents() {
        return (this.events || []).filter((event) => event?.slot !== "availability");
      },
      dynamicAvailabilityEvents() {
        return (this.events || []).filter((event) => event?.slot === "availability");
      },
    },
    template: `
      <div class='main-calendar-stub'>
        <button data-test="main-calendar-create-group" @click="$emit('create-event', { type: 'group' })">group</button>
        <button data-test="main-calendar-schedule-edit" @click="emitScheduleEdit">edit schedule</button>
        <button data-test="main-calendar-schedule-delete" @click="emitScheduleDelete">delete schedule</button>
        <button data-test="main-calendar-schedule-view-card" @click="emitScheduleViewCard">view schedule card</button>
        <slot />
        <slot
          name="event"
          :event="monthBookedEvent"
          :style="undefined"
          :onClick="handleMonthEventClick"
          view="month"
        />
        <slot
          name="event"
          :event="monthPastBookedEvent"
          :style="undefined"
          :onClick="handleMonthEventClick"
          view="month"
        />
        <slot
          name="event"
          :event="monthPendingEvent"
          :style="undefined"
          :onClick="handleMonthEventClick"
          view="month"
        />
        <slot
          name="event-alt"
          :event="monthDeclinedEvent"
          :style="undefined"
          :onClick="handleMonthEventClick"
          view="month"
        />
        <slot
          name="event-availability"
          :event="monthAvailabilityEvent"
          :style="undefined"
          :onClick="handleMonthEventClick"
          view="month"
        />
        <slot
          v-for="event in dynamicBookedEvents"
          :key="'dynamic-booked-' + (event.id || event.eventId || event.title)"
          name="event"
          :event="event"
          :style="undefined"
          :onClick="handleMonthEventClick"
          view="month"
        />
        <slot
          v-for="event in dynamicAvailabilityEvents"
          :key="'dynamic-availability-' + (event.id || event.eventId || event.start)"
          name="event-availability"
          :event="event"
          :style="undefined"
          :onClick="handleMonthEventClick"
          view="month"
        />
        <slot
          name="month-expanded"
          :events="monthExpandedEvents"
          :day="monthExpandedDay"
          :onClick="handleMonthEventClick"
        />
      </div>
    `,
  },
}));

vi.mock("@/components/calendar/MiniCalendar.vue", () => ({
  default: {
    name: "MiniCalendar",
    template: "<div class='mini-calendar-stub' />",
  },
}));

vi.mock("@/components/dev/button/ButtonComponent.vue", () => ({
  default: {
    name: "ButtonComponent",
    props: ["text"],
    emits: ["click"],
    template: "<button data-test='new-events' @click=\"$emit('click')\">{{ text }}</button>",
  },
}));

vi.mock("@/components/calendar/CreateEventPopup.vue", () => ({
  default: {
    name: "CreateEventPopup",
    emits: ["create-private", "create-group"],
    template: `
      <div>
        <button data-test="create-private" @click="$emit('create-private')">private</button>
        <button data-test="create-group" @click="$emit('create-group')">group</button>
      </div>
    `,
  },
}));

vi.mock("@/components/calendar/NewEventsPopup.vue", () => ({
  default: {
    name: "NewEventsPopup",
    template: "<div />",
  },
}));

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue", () => ({
  default: {
    name: "OneOnOneBookingFlowPopup",
    props: {
      modelValue: { type: Boolean, default: false },
      creatorId: { type: [Number, String], default: null },
      fanId: { type: [Number, String], default: null },
      apiBaseUrl: { type: String, default: "" },
      previewMode: { type: Boolean, default: false },
      previewReadOnly: { type: Boolean, default: false },
      previewEvent: { type: Object, default: null },
      previewBookedSlots: { type: Array, default: () => [] },
      previewStartStep: { type: Number, default: 1 },
      step1PrimaryAction: { type: String, default: "book" },
    },
    emits: ["update:modelValue", "edit-schedule"],
    template: `
      <div v-if="modelValue" data-test="schedule-card-preview-popup">
        <button
          data-test="schedule-card-preview-edit"
          @click="$emit('edit-schedule', previewEvent)"
        >
          edit preview
        </button>
      </div>
    `,
  },
}));

vi.mock("@/components/ui/popup/PopupHandler.vue", () => ({
  default: {
    name: "PopupHandler",
    template: "<div><slot /></div>",
  },
}));

vi.mock("@/components/ui/toast/ToastHost.vue", () => ({
  default: {
    name: "ToastHost",
    template: "<div />",
  },
}));

vi.mock("@/components/calendar/EventsWidget.vue", () => ({
  default: {
    name: "EventsWidget",
    props: ["sections"],
    emits: ["join-click", "reply-click", "event-click", "menu-action"],
    methods: {
      isoHoursFromNow(hours) {
        return new Date(Date.now() + (hours * 60 * 60 * 1000)).toISOString();
      },
      emitCancelPrivate(rawOverrides = {}, eventOverrides = {}) {
        const start = eventOverrides.start || this.isoHoursFromNow(eventOverrides.startOffsetHours ?? 1);
        const end = eventOverrides.end || this.isoHoursFromNow(eventOverrides.endOffsetHours ?? 2);
        this.$emit('menu-action', {
          action: 'cancel_call',
          event: {
            sourceEvent: {
              bookingId: eventOverrides.bookingId || 'booking_private_1',
              eventId: eventOverrides.eventId || 'evt_private',
              title: eventOverrides.title || 'Private Booking',
              start,
              end,
              status: eventOverrides.status || 'confirmed',
              type: '1on1-call',
              raw: {
                bookingId: eventOverrides.bookingId || 'booking_private_1',
                ...rawOverrides,
              },
            },
          },
        });
      },
    },
    computed: {
      shouldRenderActionMocks() {
        const titles = (this.sections || []).map((section) => section.title);
        return titles.includes("TODAY") || titles.includes("WEEK") || titles.includes("PENDING EVENTS");
      },
    },
    template: `
      <div>
        <template v-for="section in sections || []" :key="section.title">
          <div data-test="widget-section-title">{{ section.title }}</div>
          <button
            v-for="event in section.items || []"
            :key="event.title"
            data-test="widget-section-event"
            @click="$emit('event-click', event)"
          >
            {{ event.title }} {{ event.time }} {{ event.showReply ? 'reply' : '' }}
          </button>
        </template>
        <template v-if="shouldRenderActionMocks">
          <button
            data-test="widget-join"
            @click="$emit('join-click', { sourceEvent: { bookingId: 77, start: '2026-03-23T10:00:00Z', end: '2026-03-23T10:30:00Z', status: 'confirmed', raw: { enableCallReminderMinutesBefore: true, callReminderMinutesBefore: 15, extensions: [{ status: 'held', endAtIso: '2026-03-23T10:45:00Z' }] } } })"
          >
            Join
          </button>
          <button
            data-test="widget-cancel-group"
            @click="$emit('menu-action', { action: 'cancel_call', event: { sourceEvent: { bookingId: 'booking_group_1', eventId: 'evt_group', start: '2026-03-23T10:00:00Z', end: '2026-03-23T11:00:00Z', status: 'confirmed', type: 'group-event', raw: { bookingId: 'booking_group_1', bookingIds: ['booking_group_1', 'booking_group_2'], isGroupedGroupSlot: true } } } })"
          >
            Cancel Group
          </button>
          <button
            data-test="widget-cancel-private"
            @click="emitCancelPrivate()"
          >
            Cancel Private
          </button>
          <button
            data-test="widget-cancel-booking-fee"
            @click="emitCancelPrivate({ payment: { currency: 'TOKENS', lines: [{ code: 'booking_fee', label: 'Booking Fee', amount: 5 }], total: 5 } })"
          >
            Cancel Booking Fee
          </button>
          <button
            data-test="widget-cancel-cancellation-fee"
            @click="emitCancelPrivate({ eventCurrent: { enableCancellationFee: true, cancellationFeeTokens: 13, allowAdvanceCancelToAvoidMinCharge: true, advanceCancelWindowQuantity: 1, advanceCancelWindowUnit: 'day' } }, { startOffsetHours: 1, endOffsetHours: 2 })"
          >
            Cancel Cancellation Fee
          </button>
          <button
            data-test="widget-cancel-both-fees"
            @click="emitCancelPrivate({ payment: { currency: 'TOKENS', lines: [{ code: 'booking_fee', label: 'Booking Fee', amount: 5 }], total: 5 }, eventCurrent: { enableCancellationFee: true, cancellationFeeTokens: 21, allowAdvanceCancelToAvoidMinCharge: true, advanceCancelWindowQuantity: 1, advanceCancelWindowUnit: 'day' } }, { startOffsetHours: 1, endOffsetHours: 2 })"
          >
            Cancel Both Fees
          </button>
          <button
            data-test="widget-cancel-inside-advance-window"
            @click="emitCancelPrivate({ eventCurrent: { enableCancellationFee: true, cancellationFeeTokens: 34, allowAdvanceCancelToAvoidMinCharge: true, advanceCancelWindowQuantity: 1, advanceCancelWindowUnit: 'day' } }, { startOffsetHours: 72, endOffsetHours: 73 })"
          >
            Cancel Inside Advance Window
          </button>
        </template>
      </div>
    `,
  },
}));

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

async function mountDashboardEventsFeature(props = {}, translations = {}) {
  const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");
  const wrapper = mount(DashboardEventsFeature, {
    props,
    global: {
      provide: {
        [bookingTranslationSymbol]: createBookingTranslator({ translations }),
      },
    },
  });
  await flushPromises();
  return wrapper;
}

function setWindowWidth(width) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

function setWindowHeight(height) {
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height,
  });
}

function setNavigatorTouchPoints(value) {
  Object.defineProperty(window.navigator, "maxTouchPoints", {
    configurable: true,
    value,
  });
}

function isoTodayAt(hour, minute = 0) {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

function isoCurrentWeekNotToday(hour, minute = 0) {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  value.setDate(value.getDate() + 1);
  return value.toISOString();
}

function isoDaysFromToday(days, hour, minute = 0) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

describe("DashboardEventsFeature", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-23T09:00:00"));

    callFlow.mockReset();
    showToast.mockReset();
    getBookingJoinState.mockReset();
    mainCalendarResetScrollToTop.mockReset();

    callFlow.mockResolvedValue({
      ok: true,
      data: {
        events: [],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });

    getBookingJoinState.mockReturnValue({
      canJoin: true,
      joinUrl: "https://example.com/join/77",
    });

    engine = createMockEngine();
    setWindowWidth(1024);
    setWindowHeight(768);
    setNavigatorTouchPoints(0);
    window.localStorage.clear();
  });

  afterEach(() => {
    setWindowWidth(1024);
    setWindowHeight(768);
    setNavigatorTouchPoints(0);
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("loads booking context from the creatorId prop", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    mount(DashboardEventsFeature, {
      props: {
        creatorId: 99,
        userRole: "creator",
      },
    });

    await flushPromises();

    expect(callFlow).toHaveBeenCalledWith(
      "bookings.fetchDashboardBookingContext",
      expect.objectContaining({ creatorId: 99 }),
      expect.objectContaining({
        context: expect.objectContaining({ creatorId: 99 }),
      }),
    );
  });

  it("resets embedded mobile dashboard and calendar scroll through the exposed method", async () => {
    setWindowWidth(500);
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 99,
        userRole: "creator",
        embedded: true,
      },
    });
    await flushPromises();

    wrapper.element.scrollTo = vi.fn();

    expect(wrapper.vm.resetEmbeddedMobileScrollToTop()).toBe(true);
    expect(wrapper.element.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(mainCalendarResetScrollToTop).toHaveBeenCalledTimes(1);
  });

  it("does not reset dashboard calendar scroll outside embedded mobile", async () => {
    setWindowWidth(1024);
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 99,
        userRole: "creator",
        embedded: true,
      },
    });
    await flushPromises();

    wrapper.element.scrollTo = vi.fn();

    expect(wrapper.vm.resetEmbeddedMobileScrollToTop()).toBe(false);
    expect(wrapper.element.scrollTo).not.toHaveBeenCalled();
    expect(mainCalendarResetScrollToTop).not.toHaveBeenCalled();
  });

  it("keeps the main calendar root from owning mobile scroll in embedded mode", async () => {
    setWindowWidth(500);
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const embeddedWrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 99,
        userRole: "creator",
        embedded: true,
      },
    });
    await flushPromises();

    const embeddedClasses = embeddedWrapper.getComponent({ name: "MainCalendar" }).attributes("class").split(/\s+/);
    expect(embeddedClasses).not.toContain("overflow-y-auto");
    expect(embeddedClasses).toContain("lg:overflow-y-auto");

    const standardWrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 99,
        userRole: "creator",
        embedded: false,
      },
    });
    await flushPromises();

    const standardClasses = standardWrapper.getComponent({ name: "MainCalendar" }).attributes("class").split(/\s+/);
    expect(standardClasses).toContain("overflow-y-auto");
  });

  it("loads agent dashboard context as creator context", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    mount(DashboardEventsFeature, {
      props: {
        creatorId: 793,
        userRole: "agent",
      },
    });

    await flushPromises();

    expect(callFlow).toHaveBeenCalledWith(
      "bookings.fetchDashboardBookingContext",
      expect.objectContaining({
        creatorId: 793,
        fanId: null,
        userRole: "creator",
      }),
      expect.objectContaining({
        context: expect.objectContaining({ creatorId: 793 }),
      }),
    );
  });

  it("loads fan dashboard context from fanId without requiring creatorId", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    mount(DashboardEventsFeature, {
      props: {
        creatorId: null,
        userRole: "fan",
        fanId: 2615,
      },
    });

    await flushPromises();

    expect(callFlow).toHaveBeenCalledWith(
      "bookings.fetchDashboardBookingContext",
      expect.objectContaining({
        creatorId: null,
        fanId: 2615,
        userRole: "fan",
      }),
      expect.any(Object),
    );
  });

  it("loads audience dashboard context as fan context", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    mount(DashboardEventsFeature, {
      props: {
        creatorId: null,
        userRole: "audience",
        fanId: 2615,
      },
    });

    await flushPromises();

    expect(callFlow).toHaveBeenCalledWith(
      "bookings.fetchDashboardBookingContext",
      expect.objectContaining({
        creatorId: null,
        fanId: 2615,
        userRole: "fan",
      }),
      expect.any(Object),
    );
  });

  it("emits create-event when private creation is selected", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 88,
        userRole: "creator",
      },
    });

    await wrapper.get("[data-test='new-events']").trigger("click");
    await wrapper.get("[data-test='create-private']").trigger("click");

    expect(wrapper.emitted("create-event")).toEqual([
      [{ type: "private" }],
    ]);
  });

  it("forwards main calendar create events through the dashboard create flow", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 88,
        userRole: "creator",
      },
    });

    await wrapper.get("[data-test='main-calendar-create-group']").trigger("click");

    expect(wrapper.emitted("create-event")).toEqual([
      [{ type: "group" }],
    ]);
  });

  it("renders dashboard labels from scoped translation overrides", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 88,
        userRole: "creator",
      },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator({
            translations: { dashboard_new_events: "Eventos nuevos" },
          }),
        },
      },
    });

    expect(wrapper.get("[data-test='new-events']").text()).toBe("Eventos nuevos");
  });

  it("passes computed event sections into the main calendar", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await flushPromises();

    const sections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    expect(sections).toEqual([
      expect.objectContaining({ title: "TODAY", items: [] }),
      expect.objectContaining({ title: "WEEK", items: [] }),
      expect.objectContaining({ title: "PENDING EVENTS", items: [] }),
    ]);
  });

  it("renders expanded month events through widget items and opens the source event", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await flushPromises();

    const expandedButton = wrapper.findAll("[data-test='widget-section-event']")
      .find((button) => button.text().includes("Expanded Pending Event"));

    expect(expandedButton.exists()).toBe(true);
    expect(expandedButton.text()).toContain("10:00am-10:30am");
    expect(expandedButton.text()).toContain("reply");

    await expandedButton.trigger("click");

    expect(wrapper.getComponent({ name: "MainCalendar" }).emitted("month-event-click")).toEqual([
      [expect.objectContaining({
        id: "expanded-pending",
        title: "Expanded Pending Event",
      })],
    ]);
  });

  it("renders visible desktop month markers for bookings and availability", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await flushPromises();

    const bookingMarkers = wrapper.findAll("[data-test='dashboard-month-booking-marker']");
    const bookingMarker = bookingMarkers.find((marker) => marker.text().includes("Month Booked Slot"));
    const pastBookingMarker = bookingMarkers.find((marker) => marker.text().includes("Month Past Booked Slot"));
    const pendingMarker = bookingMarkers.find((marker) => marker.text().includes("Month Pending Slot"));
    const declinedMarker = bookingMarkers.find((marker) => marker.text().includes("Month Cancelled Slot"));

    expect(bookingMarker).toBeTruthy();
    expect(pastBookingMarker).toBeTruthy();
    expect(pendingMarker).toBeTruthy();
    expect(declinedMarker).toBeTruthy();

    expect(bookingMarker.text()).toContain("Month Booked Slot");
    expect(bookingMarker.text()).toContain("12:00pm - 12:30pm");
    expect(bookingMarker.classes()).toContain("static");
    expect(bookingMarker.classes()).toContain("hidden");
    expect(bookingMarker.classes()).toContain("lg:block");
    expect(bookingMarker.classes()).toContain("cursor-pointer");
    expect(bookingMarker.classes()).toContain("rounded-[0.25rem]");
    expect(bookingMarker.element.style.backgroundColor).toBe("rgb(85, 73, 255)");
    expect(bookingMarker.element.style.borderTopWidth).toBe("1px");
    expect(bookingMarker.element.style.color).toBe("rgb(255, 255, 255)");
    const bookingIcon = bookingMarker.get("[data-test='dashboard-calendar-booking-icon']");
    expect(bookingIcon.attributes("data-booking-icon-type")).toBe("private");
    expect(bookingIcon.get("path").attributes("stroke")).toBe("currentColor");
    expect(bookingMarker.get("[data-test='dashboard-calendar-booking-status-icon']").attributes("data-booking-status-icon")).toBe("confirmed");

    bookingMarker.element.getBoundingClientRect = vi.fn(() => ({
      left: 120,
      right: 260,
      top: 120,
      bottom: 180,
      width: 140,
      height: 60,
      x: 120,
      y: 120,
      toJSON: () => ({}),
    }));
    await bookingMarker.trigger("mouseenter");
    const bottomTooltip = wrapper.get("[data-test='dashboard-booking-tooltip']");
    expect(bottomTooltip.text()).toContain("Month Booked Slot");
    expect(bottomTooltip.text()).toContain("12:00pm - 12:30pm");
    expect(bottomTooltip.attributes("data-placement")).toBe("bottom");
    expect(bottomTooltip.get("[data-test='dashboard-booking-tooltip-status-icon']").attributes("data-booking-tooltip-status-icon")).toBe("confirmed");

    await bookingMarker.trigger("mouseleave");
    expect(wrapper.find("[data-test='dashboard-booking-tooltip']").exists()).toBe(false);

    setWindowHeight(220);
    bookingMarker.element.getBoundingClientRect = vi.fn(() => ({
      left: 120,
      right: 260,
      top: 150,
      bottom: 210,
      width: 140,
      height: 60,
      x: 120,
      y: 150,
      toJSON: () => ({}),
    }));
    await bookingMarker.trigger("mouseenter");
    const topTooltip = wrapper.get("[data-test='dashboard-booking-tooltip']");
    expect(topTooltip.attributes("data-placement")).toBe("top");
    await bookingMarker.trigger("mouseleave");

    expect(pastBookingMarker.text()).toContain("Month Past Booked Slot");
    expect(pastBookingMarker.text()).toContain("7:30am - 8:30am");
    expect(pastBookingMarker.element.style.backgroundColor).toBe("rgb(217, 220, 230)");
    expect(pastBookingMarker.element.style.borderTopColor).toBe("rgb(200, 205, 216)");
    expect(pastBookingMarker.element.style.borderTopWidth).toBe("1px");
    expect(pastBookingMarker.classes()).toContain("cursor-pointer");
    expect(pastBookingMarker.classes()).toContain("rounded-[0.25rem]");
    expect(pastBookingMarker.element.style.boxShadow).toBe("none");
    expect(pastBookingMarker.element.style.color).toBe("rgb(152, 162, 179)");

    await pastBookingMarker.trigger("click");
    expect(wrapper.getComponent({ name: "MainCalendar" }).emitted("month-event-click")).toEqual([
      [expect.objectContaining({
        id: "month-past-booked",
        title: "Month Past Booked Slot",
      })],
    ]);

    expect(pendingMarker.element.style.backgroundColor).toBe("transparent");
    expect(pendingMarker.element.style.borderTopColor).toBe("rgb(225, 29, 72)");
    expect(pendingMarker.element.style.borderTopWidth).toBe("1px");
    expect(pendingMarker.classes()).toContain("cursor-pointer");
    expect(pendingMarker.classes()).toContain("overflow-hidden");
    expect(pendingMarker.classes()).toContain("rounded-[0.25rem]");
    expect(pendingMarker.element.style.color).toBe("rgb(225, 29, 72)");
    expect(pendingMarker.text()).toContain("1:00pm - 1:30pm");
    expect(pendingMarker.get("[data-test='dashboard-calendar-booking-status-icon']").attributes("data-booking-status-icon")).toBe("pending");

    pendingMarker.element.getBoundingClientRect = vi.fn(() => ({
      left: 120,
      right: 260,
      top: 120,
      bottom: 180,
      width: 140,
      height: 60,
      x: 120,
      y: 120,
      toJSON: () => ({}),
    }));
    await pendingMarker.trigger("mouseenter");
    const pendingTooltip = wrapper.get("[data-test='dashboard-booking-tooltip']");
    expect(pendingTooltip.text()).toContain("Month Pending Slot");
    expect(pendingTooltip.get("[data-test='dashboard-booking-tooltip-status-icon']").attributes("data-booking-tooltip-status-icon")).toBe("pending");
    await pendingMarker.trigger("mouseleave");

    expect(wrapper.text()).toContain("Month Cancelled Slot");
    expect(wrapper.text()).toContain("2:00pm - 2:30pm");
    const statusIconStates = wrapper.findAll("[data-test='dashboard-calendar-booking-status-icon']")
      .map((icon) => icon.attributes("data-booking-status-icon"));
    expect(statusIconStates).toEqual(expect.arrayContaining(["confirmed", "pending", "declined"]));

    declinedMarker.element.getBoundingClientRect = vi.fn(() => ({
      left: 120,
      right: 260,
      top: 120,
      bottom: 180,
      width: 140,
      height: 60,
      x: 120,
      y: 120,
      toJSON: () => ({}),
    }));
    await declinedMarker.trigger("mouseenter");
    const declinedTooltip = wrapper.get("[data-test='dashboard-booking-tooltip']");
    expect(declinedTooltip.text()).toContain("Month Cancelled Slot");
    expect(declinedTooltip.get("[data-test='dashboard-booking-tooltip-status-icon']").attributes("data-booking-tooltip-status-icon")).toBe("declined");
    await declinedMarker.trigger("mouseleave");

    const availabilityMarker = wrapper.get("[data-test='dashboard-month-availability-marker']");
    expect(availabilityMarker.classes()).toContain("static");
    expect(availabilityMarker.classes()).toContain("hidden");
    expect(availabilityMarker.classes()).toContain("lg:block");
    expect(availabilityMarker.classes().some((className) => className.startsWith("rounded"))).toBe(false);
    expect(availabilityMarker.text()).toContain("Month Availability Window");
    const availabilityTitle = availabilityMarker.get("[data-test='dashboard-calendar-availability-title']");
    const availabilityIcon = availabilityTitle.get("[data-test='dashboard-calendar-availability-icon']");
    expect(availabilityIcon.get("path").attributes("stroke")).toBe("currentColor");
    expect(availabilityTitle.text()).toContain("Month Availability Window");
    expect(availabilityMarker.element.style.backgroundColor).toBe("rgba(14, 165, 233, 0.08)");
    expect(availabilityMarker.element.style.borderTopColor).toBe("rgb(14, 165, 233)");
    expect(availabilityMarker.element.style.borderTopWidth).toBe("1px");
    expect(availabilityMarker.element.style.borderRadius).toBe("0px");
    expect(availabilityMarker.element.style.color).toBe("rgb(14, 165, 233)");
    expect(availabilityMarker.element.style.backgroundImage).toBe("");
    expect(availabilityMarker.attributes("style")).not.toContain("repeating-linear-gradient");
    expect(availabilityMarker.attributes("style")).not.toContain("rgba(102, 112, 133");
  });

  it.each([
    { label: "same-event booking at availability start", bookingMinute: 0, bookingEventId: "evt_overlap_window", shouldHideTitle: true },
    { label: "same-event booking exactly fifteen minutes after availability start", bookingMinute: 15, bookingEventId: "evt_overlap_window", shouldHideTitle: true },
    { label: "same-event booking sixteen minutes after availability start", bookingMinute: 16, bookingEventId: "evt_overlap_window", shouldHideTitle: false },
    { label: "different-event booking at availability start", bookingMinute: 0, bookingEventId: "evt_different_window", shouldHideTitle: false },
  ])("controls availability title visibility for $label", async ({ bookingMinute, bookingEventId, shouldHideTitle }) => {
    const eventTitle = "Overlap Window";
    const bookingStartIso = new Date(Date.UTC(2026, 2, 22, 17, bookingMinute, 0)).toISOString();
    const bookingEndIso = new Date(Date.UTC(2026, 2, 22, 17, bookingMinute + 5, 0)).toISOString();

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_overlap_window",
          title: eventTitle,
          status: "active",
          type: "1on1-call",
          eventCallType: "video",
          eventColorSkin: "#5549FF",
          raw: {
            repeatRule: "doesNotRepeat",
            dates: [{
              date: "2026-03-23",
              times: [{ startTime: "01:00", endTime: "03:00" }],
            }],
          },
        }],
        bookedSlots: [{
          bookingId: `booking_${bookingEventId}_${bookingMinute}`,
          eventId: bookingEventId,
          eventTitle: "Early Booking",
          eventType: "1on1-call",
          eventCallType: "video",
          startIso: bookingStartIso,
          endIso: bookingEndIso,
          status: "confirmed",
        }],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    const calendarEvents = wrapper.getComponent({ name: "MainCalendar" }).props("events");
    const availabilityEvent = calendarEvents.find((event) => (
      event.eventId === "evt_overlap_window" && event.slot === "availability"
    ));
    const bookedEvent = calendarEvents.find((event) => (
      event.bookingId === `booking_${bookingEventId}_${bookingMinute}`
    ));

    expect(bookedEvent).toEqual(expect.objectContaining({
      title: "Early Booking",
      start: bookingStartIso,
    }));
    expect(availabilityEvent).toEqual(expect.objectContaining({
      title: eventTitle,
      hideAvailabilityTitle: shouldHideTitle,
    }));

    const bookedMarker = wrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Early Booking"));
    expect(bookedMarker).toBeTruthy();

    const availabilityMarker = wrapper.findAll("[data-test='dashboard-month-availability-marker']")
      .find((marker) => marker.attributes("aria-label")?.includes(eventTitle));
    expect(availabilityMarker).toBeTruthy();
    expect(availabilityMarker.find("[data-test='dashboard-calendar-availability-title']").exists()).toBe(!shouldHideTitle);
  });

  it("does not show the main calendar booking tooltip on touch-capable devices", async () => {
    setNavigatorTouchPoints(1);
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await flushPromises();

    const bookingMarker = wrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Month Booked Slot"));

    expect(bookingMarker).toBeTruthy();
    bookingMarker.element.getBoundingClientRect = vi.fn(() => ({
      left: 120,
      right: 260,
      top: 120,
      bottom: 180,
      width: 140,
      height: 60,
      x: 120,
      y: 120,
      toJSON: () => ({}),
    }));

    await bookingMarker.trigger("mouseenter");
    expect(wrapper.find("[data-test='dashboard-booking-tooltip']").exists()).toBe(false);

    await bookingMarker.trigger("focusin");
    expect(wrapper.find("[data-test='dashboard-booking-tooltip']").exists()).toBe(false);
  });

  it("ignores stored event type colors and uses current event color skins for booked slots", async () => {
    window.localStorage.setItem("calendar:eventTypeColors", JSON.stringify({
      video: "#FF3B30",
      audio: "#06B6D4",
      groupCall: "#E11D48",
    }));

    const startIso = isoTodayAt(10);
    const endIso = isoTodayAt(10, 30);

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_private_color",
          type: "1on1-call",
          eventCallType: "video",
          eventColorSkin: "#28C76F",
        }],
        bookedSlots: [{
          bookingId: "booking_private_color",
          eventId: "evt_private_color",
          userId: 2615,
          creatorId: 77,
          startIso,
          endIso,
          status: "confirmed",
          eventTitle: "Private Color Skin",
          eventType: "1on1-call",
          eventCallType: "video",
          eventSnapshot: {
            eventColorSkin: "#FF3B30",
          },
        }],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    const calendarEvents = wrapper.getComponent({ name: "MainCalendar" }).props("events");
    const booking = calendarEvents.find((event) => event.bookingId === "booking_private_color");
    expect(booking).toEqual(expect.objectContaining({
      eventColorSkin: "#28C76F",
    }));
    expect(booking.color).toBeUndefined();

    const groupBookingMarker = wrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Group Color Skin"));
    expect(groupBookingMarker).toBeTruthy();
    const groupBookingIcon = groupBookingMarker.get("[data-test='dashboard-calendar-booking-icon']");
    expect(groupBookingIcon.attributes("data-booking-icon-type")).toBe("group");
    expect(groupBookingIcon.get("path").attributes("stroke")).toBe("currentColor");

    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    const todayItem = widgetSections
      .find((section) => section.title === "TODAY")
      .items.find((item) => item.title === "Private Color Skin");
    expect(todayItem.accentColor).toBe("#28C76F");
  });

  it("shows confirmed widget status as minutes remaining in the event color skin inside five minutes", async () => {
    const startIso = isoTodayAt(9, 5);
    const endIso = isoTodayAt(9, 30);

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_private_starting_soon",
          type: "1on1-call",
          eventCallType: "video",
          eventColorSkin: "#28C76F",
        }],
        bookedSlots: [{
          bookingId: "booking_private_starting_soon",
          eventId: "evt_private_starting_soon",
          userId: 2615,
          creatorId: 77,
          startIso,
          endIso,
          status: "confirmed",
          eventTitle: "Private Starting Soon",
          eventType: "1on1-call",
          eventCallType: "video",
        }],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    const todayItem = widgetSections
      .find((section) => section.title === "TODAY")
      .items.find((item) => item.title === "Private Starting Soon");

    expect(todayItem).toEqual(expect.objectContaining({
      statusText: "in 5 mins",
      statusColor: "#28C76F",
      accentColor: "#28C76F",
    }));
  });

  it("shows confirmed widget status as live now while the call is ongoing", async () => {
    const startIso = isoTodayAt(8, 55);
    const endIso = isoTodayAt(9, 30);

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_private_live_now",
          type: "1on1-call",
          eventCallType: "video",
          eventColorSkin: "#28C76F",
        }],
        bookedSlots: [{
          bookingId: "booking_private_live_now",
          eventId: "evt_private_live_now",
          userId: 2615,
          creatorId: 77,
          startIso,
          endIso,
          status: "confirmed",
          eventTitle: "Private Live Now",
          eventType: "1on1-call",
          eventCallType: "video",
        }],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    const todayItem = widgetSections
      .find((section) => section.title === "TODAY")
      .items.find((item) => item.title === "Private Live Now");

    expect(todayItem).toEqual(expect.objectContaining({
      statusText: "live now",
      statusColor: null,
      accentColor: "#28C76F",
    }));
  });

  it("preserves group event color skins instead of forcing the old group color", async () => {
    window.localStorage.setItem("calendar:eventTypeColors", JSON.stringify({
      video: "#5549FF",
      audio: "#06B6D4",
      groupCall: "#E11D48",
    }));

    const startIso = isoTodayAt(11);
    const endIso = isoTodayAt(12);

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_group_color",
          type: "group-event",
          eventCallType: "video",
          eventColorSkin: "#28C76F",
        }],
        bookedSlots: [{
          bookingId: "booking_group_color",
          eventId: "evt_group_color",
          userId: 2615,
          userDisplayName: "Ava",
          creatorId: 77,
          startIso,
          endIso,
          status: "confirmed",
          eventTitle: "Group Color Skin",
          eventType: "group-event",
          eventCallType: "video",
          eventSnapshot: {
            eventColorSkin: "#E11D48",
          },
        }],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    const calendarEvents = wrapper.getComponent({ name: "MainCalendar" }).props("events");
    const booking = calendarEvents.find((event) => event.eventId === "evt_group_color" && !event.isAvailabilityBlock);
    expect(booking).toEqual(expect.objectContaining({
      eventColorSkin: "#28C76F",
      type: "group-event",
    }));
    expect(booking.color).toBeUndefined();

    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    const todayItem = widgetSections
      .find((section) => section.title === "TODAY")
      .items.find((item) => item.title === "Group Color Skin");
    expect(todayItem).toEqual(expect.objectContaining({
      accentColor: "#28C76F",
      isGroup: true,
    }));
  });

  it("emits open-url for join actions in embedded mode", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
        embedded: true,
      },
    });

    await wrapper.get("[data-test='widget-join']").trigger("click");

    expect(wrapper.emitted("open-url")).toEqual([
      [{
        url: "https://example.com/join/77",
        target: "_self",
      }],
    ]);
    expect(getBookingJoinState).toHaveBeenCalledWith(expect.objectContaining({
      enableCallReminderMinutesBefore: true,
      callReminderMinutesBefore: 15,
      extensions: [{ status: "held", endAtIso: "2026-03-23T10:45:00Z" }],
    }));
  });

  it("shows current unavailable copy when a confirmed booking cannot be joined", async () => {
    getBookingJoinState.mockReturnValue({
      canJoin: false,
      joinUrl: "https://example.com/join/77",
    });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await wrapper.get("[data-test='widget-join']").trigger("click");

    expect(showToast).toHaveBeenCalledWith({
      type: "error",
      title: "Join Unavailable",
      message: "You can join only during the confirmed booking's join window and before it ends.",
    });
    expect(wrapper.emitted("open-url")).toBeUndefined();
  });

  it("passes booked group sessions into the widget today section with join metadata", async () => {
    const startIso = isoTodayAt(10);
    const endIso = isoTodayAt(13);
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_group",
          type: "group-event",
          eventCallType: "video",
          eventColorSkin: "#E11D48",
        }],
        bookedSlots: [
          {
            bookingId: "booking_group_1",
            eventId: "evt_group",
            userId: 2615,
            userDisplayName: "Ava",
            userAvatarUrl: "https://example.test/ava.png",
            creatorId: 77,
            startIso,
            endIso,
            status: "confirmed",
            eventTitle: "Group Hang",
            eventType: "group-event",
            eventCallType: "video",
          },
          {
            bookingId: "booking_group_2",
            eventId: "evt_group",
            userId: 2616,
            userDisplayName: "Ben",
            creatorId: 77,
            startIso,
            endIso,
            status: "confirmed",
            eventTitle: "Group Hang",
            eventType: "group-event",
            eventCallType: "video",
          },
        ],
        bookedSlotsIndex: {},
      },
    });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await flushPromises();

    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    const [groupItem] = widgetSections.find((section) => section.title === "TODAY").items;

    expect(groupItem).toEqual(expect.objectContaining({
      title: "Group Hang",
      isGroup: true,
      groupText: "Group event (2)",
      participantCount: 2,
      showJoin: true,
      joinUrl: expect.stringContaining("event_id=evt_group"),
      sourceEvent: expect.objectContaining({
        bookingId: "booking_group_1",
        raw: expect.objectContaining({
          participantCount: 2,
          bookingIds: ["booking_group_1", "booking_group_2"],
        }),
      }),
    }));
    expect(groupItem.avatars).toEqual([
      expect.objectContaining({ name: "Ava", src: "https://example.test/ava.png" }),
      expect.objectContaining({ name: "Ben" }),
    ]);
  });

  it("shows extended private booking end times in the calendar and widget sections", async () => {
    const startIso = isoTodayAt(10);
    const endIso = isoTodayAt(10, 30);
    const capturedEndIso = isoTodayAt(10, 38);
    const heldEndIso = isoTodayAt(10, 43);

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_private_extended",
          type: "1on1-call",
          eventCallType: "video",
          eventColorSkin: "#5549FF",
        }],
        bookedSlots: [{
          bookingId: "booking_private_extended",
          eventId: "evt_private_extended",
          userId: 2615,
          creatorId: 77,
          startIso,
          endIso,
          status: "confirmed",
          eventTitle: "Extended Private Call",
          eventType: "1on1-call",
          eventCallType: "video",
          extensions: [
            { status: "captured", endAtIso: capturedEndIso, durationMinutes: 8 },
            { status: "held", endAtIso: heldEndIso, durationMinutes: 5 },
          ],
        }],
        bookedSlotsIndex: {},
      },
    });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await flushPromises();

    const calendarEvents = wrapper.getComponent({ name: "MainCalendar" }).props("events");
    expect(calendarEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        bookingId: "booking_private_extended",
        start: startIso,
        end: heldEndIso,
      }),
    ]));

    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    const [privateItem] = widgetSections.find((section) => section.title === "TODAY").items;

    expect(privateItem).toEqual(expect.objectContaining({
      title: "Extended Private Call",
      time: "10:00am-10:43am",
      sourceEvent: expect.objectContaining({
        bookingId: "booking_private_extended",
        end: heldEndIso,
      }),
    }));
  });

  it("emits edit requests from the creator booking schedule list", async () => {
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_schedule_edit",
          title: "High School simulator",
          status: "active",
          type: "1on1-call",
          eventColorSkin: "#5549FF",
        }],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    await wrapper.get("button[aria-label='Open options for High School simulator']").trigger("click");
    const editButton = wrapper
      .find("[data-test='booking-schedule-menu']")
      .findAll("button")
      .find((button) => button.text() === "Edit");
    await editButton.trigger("click");

    expect(wrapper.emitted("edit-event")?.[0]?.[0]).toEqual(expect.objectContaining({
      eventId: "evt_schedule_edit",
      type: "private",
    }));
  });

  it("opens a selected schedule card preview and reuses the edit flow from the preview CTA", async () => {
    const selectedSlot = {
      bookingId: "booking_selected_schedule",
      eventId: "evt_schedule_preview",
      startIso: "2026-03-23T10:00:00",
      endIso: "2026-03-23T10:30:00",
      status: "confirmed",
    };
    const otherSlot = {
      bookingId: "booking_other_schedule",
      eventId: "evt_other_schedule",
      startIso: "2026-03-23T11:00:00",
      endIso: "2026-03-23T11:30:00",
      status: "confirmed",
    };

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_schedule_preview",
          title: "Preview schedule card",
          status: "active",
          type: "1on1-call",
          eventColorSkin: "#5549FF",
        }],
        bookedSlots: [selectedSlot, otherSlot],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
      apiBaseUrl: "https://api.example.test",
    });

    await wrapper.get("button[aria-label='Open options for Preview schedule card']").trigger("click");
    const viewCardButton = wrapper
      .find("[data-test='booking-schedule-menu']")
      .findAll("button")
      .find((button) => button.text() === "View schedule card");
    await viewCardButton.trigger("click");
    await flushPromises();

    const previewPopup = wrapper.getComponent({ name: "OneOnOneBookingFlowPopup" });
    expect(previewPopup.props()).toEqual(expect.objectContaining({
      modelValue: true,
      creatorId: 77,
      apiBaseUrl: "https://api.example.test",
      previewMode: true,
      previewReadOnly: true,
      previewStartStep: 1,
      step1PrimaryAction: "edit-schedule",
    }));
    expect(previewPopup.props("previewEvent")).toEqual(expect.objectContaining({
      eventId: "evt_schedule_preview",
      title: "Preview schedule card",
      type: "private",
    }));
    expect(previewPopup.props("previewBookedSlots")).toEqual([selectedSlot]);

    await wrapper.get("[data-test='schedule-card-preview-edit']").trigger("click");
    await flushPromises();

    expect(wrapper.emitted("edit-event")?.[0]?.[0]).toEqual(expect.objectContaining({
      eventId: "evt_schedule_preview",
      type: "private",
      event: expect.objectContaining({
        eventId: "evt_schedule_preview",
        title: "Preview schedule card",
      }),
    }));
    expect(previewPopup.props("modelValue")).toBe(false);
  });

  it("opens the booking schedule menu from availability blocks and routes actions through the matched schedule event", async () => {
    const selectedSlot = {
      bookingId: "booking_availability_selected",
      eventId: "evt_month_availability",
      startIso: "2026-03-23T10:00:00",
      endIso: "2026-03-23T10:30:00",
      status: "confirmed",
    };
    const otherSlot = {
      bookingId: "booking_availability_other",
      eventId: "evt_other_schedule",
      startIso: "2026-03-23T11:00:00",
      endIso: "2026-03-23T11:30:00",
      status: "confirmed",
    };

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_month_availability",
          title: "Matched availability schedule",
          status: "active",
          type: "group-event",
          eventColorSkin: "#0EA5E9",
        }],
        bookedSlots: [selectedSlot, otherSlot],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
      apiBaseUrl: "https://api.example.test",
    }, {
      dashboard_delete_booking_schedule_title: "Delete schedule '{title}'?",
    });

    const availabilityMarker = wrapper.get("[data-test='dashboard-month-availability-marker']");
    availabilityMarker.element.getBoundingClientRect = vi.fn(() => ({
      left: 120,
      right: 260,
      top: 120,
      bottom: 180,
      width: 140,
      height: 60,
      x: 120,
      y: 120,
      toJSON: () => ({}),
    }));

    await availabilityMarker.trigger("click", { clientX: 148, clientY: 156 });

    const scheduleMenu = wrapper.get("[data-test='booking-schedule-menu']");
    expect(scheduleMenu.element.style.left).toBe("148px");
    expect(scheduleMenu.element.style.top).toBe("156px");

    let menuButtons = scheduleMenu.findAll("button");
    expect(menuButtons.map((button) => button.text())).toEqual([
      "Edit",
      "View schedule card",
      "View in profile",
      "Share booking page",
      "Delete",
    ]);

    await menuButtons.find((button) => button.text() === "Edit").trigger("click");
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(false);
    expect(wrapper.emitted("edit-event")?.[0]?.[0]).toEqual(expect.objectContaining({
      eventId: "evt_month_availability",
      type: "group",
      event: expect.objectContaining({
        eventId: "evt_month_availability",
        title: "Matched availability schedule",
      }),
    }));

    await availabilityMarker.trigger("click");
    menuButtons = wrapper.get("[data-test='booking-schedule-menu']").findAll("button");
    await menuButtons.find((button) => button.text() === "View schedule card").trigger("click");
    await flushPromises();

    const previewPopup = wrapper.getComponent({ name: "OneOnOneBookingFlowPopup" });
    expect(previewPopup.props()).toEqual(expect.objectContaining({
      modelValue: true,
      creatorId: 77,
      apiBaseUrl: "https://api.example.test",
      previewMode: true,
      previewReadOnly: true,
      previewStartStep: 1,
      step1PrimaryAction: "edit-schedule",
    }));
    expect(previewPopup.props("previewEvent")).toEqual(expect.objectContaining({
      eventId: "evt_month_availability",
      title: "Matched availability schedule",
      type: "group",
    }));
    expect(previewPopup.props("previewBookedSlots")).toEqual([selectedSlot]);
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(false);

    await availabilityMarker.trigger("click");
    menuButtons = wrapper.get("[data-test='booking-schedule-menu']").findAll("button");
    await menuButtons.find((button) => button.text() === "Delete").trigger("click");

    expect(wrapper.text()).toContain("Delete schedule 'Matched availability schedule'?");
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(false);
  });

  it("closes the availability schedule menu on outside click and falls back to the availability payload safely", async () => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    const availabilityMarker = wrapper.get("[data-test='dashboard-month-availability-marker']");
    availabilityMarker.element.getBoundingClientRect = vi.fn(() => ({
      left: 120,
      right: 260,
      top: 120,
      bottom: 180,
      width: 140,
      height: 60,
      x: 120,
      y: 120,
      toJSON: () => ({}),
    }));

    await availabilityMarker.trigger("click");
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(true);

    document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushPromises();
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(false);

    await availabilityMarker.trigger("click");
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flushPromises();
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(false);

    await availabilityMarker.trigger("click");
    const editButton = wrapper
      .get("[data-test='booking-schedule-menu']")
      .findAll("button")
      .find((button) => button.text() === "Edit");
    await editButton.trigger("click");

    expect(wrapper.emitted("edit-event")?.[0]?.[0]).toEqual(expect.objectContaining({
      eventId: "evt_month_availability",
      type: "private",
      event: expect.objectContaining({
        eventId: "evt_month_availability",
        title: "Month Availability Window",
      }),
    }));
  });

  it("passes creator booking schedule data to the main calendar mobile popup path", async () => {
    const bookedSlotsIndex = {
      evt_mobile_schedule: {
        "2026-03-23": [{ startAtIso: "2026-03-23T10:00:00Z" }],
      },
    };
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_mobile_schedule",
          title: "Mobile schedule event",
          status: "active",
          type: "1on1-call",
          eventColorSkin: "#5549FF",
        }],
        bookedSlots: [],
        bookedSlotsIndex,
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    expect(mainCalendar.props("bookingScheduleEvents")).toEqual([
      expect.objectContaining({
        eventId: "evt_mobile_schedule",
        title: "Mobile schedule event",
      }),
    ]);
    expect(mainCalendar.props("bookingScheduleBookedSlotsIndex")).toEqual(bookedSlotsIndex);
    expect(mainCalendar.props("showBookingScheduleList")).toBe(true);
  });

  it("does not expose the mobile booking schedule list for fans", async () => {
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_fan_hidden_schedule",
          title: "Fan hidden schedule",
          status: "active",
          type: "1on1-call",
          eventColorSkin: "#5549FF",
        }],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      fanId: 101,
      userRole: "fan",
    });

    expect(wrapper.getComponent({ name: "MainCalendar" }).props("showBookingScheduleList")).toBe(false);
  });

  it("does not expose the mobile booking schedule list while dashboard events are loading", async () => {
    let resolveFlow;
    callFlow.mockReturnValueOnce(new Promise((resolve) => {
      resolveFlow = resolve;
    }));

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    expect(wrapper.getComponent({ name: "MainCalendar" }).props("showBookingScheduleList")).toBe(false);

    resolveFlow({
      ok: true,
      data: {
        events: [],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });
    await flushPromises();
  });

  it("reuses the edit event flow for mobile booking schedule edits", async () => {
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_mobile_schedule_edit",
          title: "Mobile schedule edit",
          status: "active",
          type: "group-event",
          eventColorSkin: "#5549FF",
        }],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    await wrapper.get("[data-test='main-calendar-schedule-edit']").trigger("click");

    expect(wrapper.emitted("edit-event")?.[0]?.[0]).toEqual(expect.objectContaining({
      eventId: "evt_mobile_schedule_edit",
      type: "group",
    }));
  });

  it("opens the existing delete confirmation for mobile booking schedule deletes", async () => {
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_mobile_schedule_delete",
          title: "Mobile schedule delete",
          status: "active",
          type: "1on1-call",
          eventColorSkin: "#5549FF",
        }],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    }, {
      dashboard_delete_booking_schedule_title: "Delete schedule '{title}'?",
    });

    await wrapper.get("[data-test='main-calendar-schedule-delete']").trigger("click");

    expect(wrapper.text()).toContain("Delete schedule 'Mobile schedule delete'?");
  });

  it("confirms schedule deletion through events.deleteEvent and refreshes context", async () => {
    callFlow
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [{
            eventId: "evt_schedule_delete",
            title: "Maid cafe simulator",
            status: "active",
            type: "group-event",
            eventColorSkin: "#E11D48",
          }],
          bookedSlots: [],
          bookedSlotsIndex: {},
        },
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [],
          bookedSlotsIndex: {},
        },
      });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    }, {
      dashboard_delete_booking_schedule_title: "Eliminar agenda '{title}'?",
      dashboard_delete_booking_schedule_body: "Las reservas confirmadas no se cancelaran.",
      dashboard_delete_booking_schedule_action: "Eliminar agenda",
    });

    await wrapper.get("button[aria-label='Open options for Maid cafe simulator']").trigger("click");
    const deleteMenuButton = wrapper
      .find("[data-test='booking-schedule-menu']")
      .findAll("button")
      .find((button) => button.text() === "Delete");
    await deleteMenuButton.trigger("click");

    expect(wrapper.text()).toContain("Eliminar agenda 'Maid cafe simulator'?");
    expect(wrapper.text()).toContain("Las reservas confirmadas no se cancelaran.");

    const confirmButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "Eliminar agenda");
    await confirmButton.trigger("click");
    await flushPromises();

    expect(callFlow).toHaveBeenCalledWith(
      "events.deleteEvent",
      { eventId: "evt_schedule_delete" },
      expect.objectContaining({
        context: expect.objectContaining({
          creatorId: 77,
        }),
      }),
    );
    expect(callFlow.mock.calls.filter(([flowName]) => flowName === "bookings.fetchDashboardBookingContext")).toHaveLength(2);
  });

  it("passes group availability windows and fan bookings into the main calendar events", async () => {
    const slotDate = isoDaysFromToday(1, 12).slice(0, 10);
    const startIso = isoDaysFromToday(1, 10);
    const endIso = isoDaysFromToday(1, 11);

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_group_calendar",
          type: "group-event",
          status: "active",
          eventCallType: "video",
          eventColorSkin: "#E11D48",
          raw: {
            repeatRule: "doesNotRepeat",
            dates: [{
              date: slotDate,
              times: [{ startTime: "10:00", endTime: "12:00" }],
            }],
          },
        }],
        bookedSlots: [{
          bookingId: "booking_group_calendar",
          eventId: "evt_group_calendar",
          userId: 2615,
          creatorId: 77,
          startIso,
          endIso,
          status: "confirmed",
          eventTitle: "Calendar Group Hang",
          eventType: "group-event",
          eventCallType: "video",
        }],
        bookedSlotsIndex: {
          evt_group_calendar: {
            [slotDate]: [{
              bookingId: "booking_group_calendar",
              userId: 2615,
              startIso,
              endIso,
              startMs: new Date(startIso).getTime(),
              endMs: new Date(endIso).getTime(),
              status: "confirmed",
            }],
          },
        },
      },
    });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await flushPromises();

    const calendarEvents = wrapper.getComponent({ name: "MainCalendar" }).props("events");

    expect(calendarEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        eventId: "evt_group_calendar",
        isAvailabilityBlock: true,
        slot: "availability",
      }),
      expect.objectContaining({
        bookingId: "booking_group_calendar",
        eventId: "evt_group_calendar",
        title: "Calendar Group Hang",
        type: "group-event",
      }),
    ]));
  });

  it("cancels grouped group sessions through the existing cancel booking flow", async () => {
    callFlow
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [],
          bookedSlotsIndex: {},
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          bookingId: "booking_group_1",
          cancelledCount: 2,
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [],
          bookedSlotsIndex: {},
        },
      });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");
    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator(),
        },
      },
    });

    await flushPromises();
    await wrapper.find("[data-test='widget-cancel-group']").trigger("click");
    await flushPromises();

    const confirmButton = wrapper.findAll("button").find((button) => button.text() === "Cancel call");
    expect(confirmButton).toBeTruthy();
    await confirmButton.trigger("click");
    await flushPromises();

    const cancelCall = callFlow.mock.calls.find(([flowName]) => flowName === "bookings.cancelBooking");
    expect(cancelCall).toEqual(expect.arrayContaining([
      "bookings.cancelBooking",
      expect.objectContaining({
        bookingId: "booking_group_1",
        actor: "creator",
        reason: "creator_cancelled_from_events_widget",
      }),
    ]));
  });

  it("keeps private widget cancellation on the same single-booking flow", async () => {
    callFlow
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [],
          bookedSlotsIndex: {},
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          bookingId: "booking_private_1",
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [],
          bookedSlotsIndex: {},
        },
      });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");
    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator(),
        },
      },
    });

    await flushPromises();
    await wrapper.find("[data-test='widget-cancel-private']").trigger("click");
    await flushPromises();

    const confirmButton = wrapper.findAll("button").find((button) => button.text() === "Cancel call");
    expect(confirmButton).toBeTruthy();
    await confirmButton.trigger("click");
    await flushPromises();

    const cancelCall = callFlow.mock.calls.find(([flowName]) => flowName === "bookings.cancelBooking");
    expect(cancelCall).toEqual(expect.arrayContaining([
      "bookings.cancelBooking",
      expect.objectContaining({
        bookingId: "booking_private_1",
        actor: "creator",
        reason: "creator_cancelled_from_events_widget",
      }),
    ]));
  });

  it("uses fan copy and fan cancellation payload from the dashboard widget", async () => {
    callFlow
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [],
          bookedSlotsIndex: {},
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          bookingId: "booking_private_1",
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [],
          bookedSlotsIndex: {},
        },
      });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");
    const wrapper = mount(DashboardEventsFeature, {
      props: {
        fanId: 2615,
        userRole: "fan",
      },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator(),
        },
      },
    });

    await flushPromises();
    await wrapper.find("[data-test='widget-cancel-private']").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Are you sure you want to cancel this event?");
    expect(wrapper.text()).toContain("Cancelling this event will notify the host and remove it from your schedule.");
    expect(wrapper.text()).not.toContain("Booking Fee will still be deducted from your wallet.");

    const confirmButton = wrapper.findAll("button").find((button) => button.text() === "Cancel call");
    expect(confirmButton).toBeTruthy();
    await confirmButton.trigger("click");
    await flushPromises();

    const cancelCall = callFlow.mock.calls.find(([flowName]) => flowName === "bookings.cancelBooking");
    expect(cancelCall).toEqual(expect.arrayContaining([
      "bookings.cancelBooking",
      expect.objectContaining({
        bookingId: "booking_private_1",
        actor: "fan",
        reason: "fan_cancelled_from_events_widget",
      }),
    ]));
  });

  it("shows the booking fee warning only when the selected fan booking includes a booking fee", async () => {
    const wrapper = await mountDashboardEventsFeature({
      fanId: 2615,
      userRole: "fan",
    });

    await wrapper.find("[data-test='widget-cancel-booking-fee']").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Booking Fee will still be deducted from your wallet.");
    expect(wrapper.text()).not.toContain("tokens will be deducted as cancellation fee.");
    expect(wrapper.text()).not.toContain("Cancelling this event will notify the host and remove it from your schedule.");
  });

  it("shows the cancellation fee token warning when fan cancellation is outside the advance window", async () => {
    const wrapper = await mountDashboardEventsFeature({
      fanId: 2615,
      userRole: "fan",
    });

    await wrapper.find("[data-test='widget-cancel-cancellation-fee']").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("13 tokens will be deducted as cancellation fee.");
    expect(wrapper.text()).not.toContain("Booking Fee will still be deducted from your wallet.");
    expect(wrapper.text()).not.toContain("Cancelling this event will notify the host and remove it from your schedule.");
  });

  it("shows both booking fee and cancellation fee warnings when both apply", async () => {
    const wrapper = await mountDashboardEventsFeature({
      fanId: 2615,
      userRole: "fan",
    });

    await wrapper.find("[data-test='widget-cancel-both-fees']").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Booking Fee will still be deducted from your wallet.");
    expect(wrapper.text()).toContain("21 tokens will be deducted as cancellation fee.");
    expect(wrapper.text()).not.toContain("Cancelling this event will notify the host and remove it from your schedule.");
  });

  it("does not show the cancellation fee warning when fan cancellation is inside the advance window", async () => {
    const wrapper = await mountDashboardEventsFeature({
      fanId: 2615,
      userRole: "fan",
    });

    await wrapper.find("[data-test='widget-cancel-inside-advance-window']").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Cancelling this event will notify the host and remove it from your schedule.");
    expect(wrapper.text()).not.toContain("34 tokens will be deducted as cancellation fee.");
    expect(wrapper.text()).not.toContain("Booking Fee will still be deducted from your wallet.");
  });

  it("keeps current-week group sessions visible with group styling and join metadata", async () => {
    const startIso = isoCurrentWeekNotToday(11);
    const endIso = isoCurrentWeekNotToday(14);
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [],
        bookedSlots: [{
          bookingId: "booking_group_week",
          eventId: "evt_group_week",
          userId: 2615,
          userDisplayName: "Ava",
          startIso,
          endIso,
          status: "confirmed",
          eventTitle: "Week Group Hang",
          eventSnapshot: { eventType: "group-event" },
        }],
        bookedSlotsIndex: {},
      },
    });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        fanId: 2615,
        userRole: "fan",
      },
    });

    await flushPromises();

    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    const [groupItem] = widgetSections.find((section) => section.title === "WEEK").items;

    expect(groupItem).toEqual(expect.objectContaining({
      title: "Week Group Hang",
      isGroup: true,
      groupText: "Group event",
      participantCount: undefined,
      showJoin: true,
      joinUrl: "https://example.com/join/77",
    }));
  });

  it("keeps future booked sessions outside the current week visible in the upcoming section", async () => {
    const startIso = isoDaysFromToday(8, 20, 30);
    const endIso = isoDaysFromToday(8, 21, 0);
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [],
        bookedSlots: [{
          bookingId: "booking_future_group",
          eventId: "evt_future_group",
          userId: 2615,
          userDisplayName: "Ava",
          creatorId: 77,
          startIso,
          endIso,
          status: "confirmed",
          eventTitle: "Future Group Hang",
          eventType: "group-event",
          eventCallType: "video",
        }],
        bookedSlotsIndex: {},
      },
    });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await flushPromises();

    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    const weekItems = widgetSections.find((section) => section.title === "WEEK").items;

    expect(weekItems).toHaveLength(1);
    expect(weekItems[0]).toEqual(expect.objectContaining({
      title: "Future Group Hang",
      isGroup: true,
      showJoin: true,
      joinUrl: expect.stringContaining("event_id=evt_future_group"),
    }));
  });

  it("does not show past confirmed bookings outside today in widget sections", async () => {
    const startIso = isoDaysFromToday(-1, 20, 30);
    const endIso = isoDaysFromToday(-1, 21, 0);
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [],
        bookedSlots: [{
          bookingId: "booking_past",
          eventId: "evt_past",
          userId: 2615,
          creatorId: 77,
          startIso,
          endIso,
          status: "confirmed",
          eventTitle: "Past Hang",
          eventType: "group-event",
        }],
        bookedSlotsIndex: {},
      },
    });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await flushPromises();

    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    expect(widgetSections.flatMap((section) => section.items)).toHaveLength(0);
  });

  it("keeps past pending bookings in the calendar unless the code toggle is enabled", async () => {
    const pastStartIso = isoTodayAt(7, 30);
    const pastEndIso = isoTodayAt(8, 30);

    const response = {
      ok: true,
      data: {
        events: [],
        bookedSlots: [
          {
            bookingId: "booking_confirmed_past_calendar",
            eventId: "evt_confirmed_past_calendar",
            userId: 2615,
            creatorId: 77,
            startIso: pastStartIso,
            endIso: pastEndIso,
            status: "confirmed",
            eventTitle: "Confirmed Past Calendar",
            eventType: "group-event",
          },
          {
            bookingId: "booking_pending_past_calendar",
            eventId: "evt_pending_past_calendar",
            userId: 2615,
            creatorId: 77,
            startIso: pastStartIso,
            endIso: pastEndIso,
            status: "pending",
            eventTitle: "Pending Past Calendar",
            eventType: "group-event",
          },
        ],
        bookedSlotsIndex: {},
      },
    };

    callFlow.mockResolvedValueOnce(response);

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    const calendarEventTitles = wrapper
      .getComponent({ name: "MainCalendar" })
      .props("events")
      .map((event) => event.title);

    expect(calendarEventTitles).toContain("Confirmed Past Calendar");
    expect(calendarEventTitles).toContain("Pending Past Calendar");

    wrapper.unmount();
    callFlow.mockResolvedValueOnce(response);

    const filteredWrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
      filterPastPendingBookings: true,
    });
    const filteredCalendarEventTitles = filteredWrapper
      .getComponent({ name: "MainCalendar" })
      .props("events")
      .map((event) => event.title);

    expect(filteredCalendarEventTitles).toContain("Confirmed Past Calendar");
    expect(filteredCalendarEventTitles).not.toContain("Pending Past Calendar");

    filteredWrapper.unmount();
  });

  it("keeps widget bookings only when their end time is current or future", async () => {
    const endedStartIso = isoTodayAt(8);
    const endedEndIso = isoTodayAt(8, 30);
    const boundaryStartIso = isoTodayAt(8, 30);
    const boundaryEndIso = isoTodayAt(9);

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [],
        bookedSlots: [
          {
            bookingId: "booking_ended_today",
            eventId: "evt_ended_today",
            userId: 2615,
            creatorId: 77,
            startIso: endedStartIso,
            endIso: endedEndIso,
            status: "confirmed",
            eventTitle: "Ended Today Hang",
            eventType: "group-event",
          },
          {
            bookingId: "booking_boundary_today",
            eventId: "evt_boundary_today",
            userId: 2615,
            creatorId: 77,
            startIso: boundaryStartIso,
            endIso: boundaryEndIso,
            status: "confirmed",
            eventTitle: "Boundary Today Hang",
            eventType: "group-event",
          },
        ],
        bookedSlotsIndex: {},
      },
    });

    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });

    await flushPromises();

    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    expect(widgetSections.flatMap((section) => section.items).map((item) => item.title)).toEqual([
      "Boundary Today Hang",
    ]);
  });
});
