import { mount } from "@vue/test-utils";
import { reactive } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";
import { localDateTimeToHkt } from "@/services/events/eventsApiUtils.js";

let engine;
const callFlow = vi.fn();
const showToast = vi.fn();
const getCalendarEventJoinState = vi.fn();
const mainCalendarResetScrollToTop = vi.fn();
const mainCalendarScrollToCurrentTime = vi.fn();
const mainCalendarRevealSelectedWeekDay = vi.fn();
const mainCalendarOpenEventDetails = vi.fn();
const mainCalendarApplyBookingReviewResult = vi.fn();
const requestFanTokenBalanceRefresh = vi.fn();

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

vi.mock("@/utils/fanTokenBalanceRefresh.js", () => ({
  requestFanTokenBalanceRefresh,
}));

vi.mock("@/utils/bookingJoinUtils.js", async (importOriginal) => ({
  ...(await importOriginal()),
  getCalendarEventJoinState,
}));

vi.mock("@/components/calendar/MainCalendar.vue", () => ({
  default: {
    name: "MainCalendar",
    props: ["focusDate", "selectedDate", "initialView", "events", "eventsData", "bookedSlotsCount", "bookingScheduleEvents", "bookingScheduleBookedSlotsIndex", "showBookingScheduleList", "theme", "dayColumnMode", "fitDayEventColumns", "tabletWeekEventLaneMinWidthPx", "responsiveViewportWidth", "showCurrentTimeAcrossDates", "joinComparisonTime", "minEventHeightPx", "stickyCardEvents", "stickyCardEvent"],
    emits: ["date-selected", "update:focus-date", "view-changed", "create-event", "month-event-click", "join-call", "approve-booking", "reject-booking", "accept-adjustment", "decline-adjustment", "accept-counter", "reject-counter", "cancel-booking", "widget-accept-details", "edit-schedule-event", "delete-schedule-event", "view-schedule-card"],
    data() {
      return {
        availabilityTestView: "month",
        bookingTestView: "month",
        pastBookingTestView: "month",
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
      handleMonthEventClick(event, action) {
        if (typeof action === "function") {
          action();
          return;
        }
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
      scrollToCurrentTime: mainCalendarScrollToCurrentTime,
      revealSelectedWeekDay: mainCalendarRevealSelectedWeekDay,
      openEventDetails: mainCalendarOpenEventDetails,
      applyBookingReviewResult: mainCalendarApplyBookingReviewResult,
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
        <button
          data-test="main-calendar-popup-join"
          @click="$emit('join-call', {
            event: {
              bookingId: 'booking_popup_race',
              eventId: 'evt_popup_race',
              start: '2026-03-23T10:00:00',
              end: '2026-03-23T10:30:00',
              status: 'confirmed',
              eventType: '1on1-call'
            }
          })"
        >join popup call</button>
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
          :view="bookingTestView"
        />
        <slot
          name="event"
          :event="monthPastBookedEvent"
          :style="undefined"
          :onClick="handleMonthEventClick"
          :view="pastBookingTestView"
        />
        <slot
          name="event"
          :event="monthPendingEvent"
          :style="undefined"
          :onClick="handleMonthEventClick"
          :view="bookingTestView"
        />
        <slot
          name="event-alt"
          :event="monthDeclinedEvent"
          :style="undefined"
          :onClick="handleMonthEventClick"
          :view="bookingTestView"
        />
        <slot
          name="event-availability"
          :event="monthAvailabilityEvent"
          :style="undefined"
          :onClick="handleMonthEventClick"
          :view="availabilityTestView"
        />
        <slot
          v-for="event in dynamicBookedEvents"
          :key="'dynamic-booked-' + (event.id || event.eventId || event.title)"
          name="event"
          :event="event"
          :style="undefined"
          :onClick="handleMonthEventClick"
          :view="bookingTestView"
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
    props: ["allowPastDates", "events"],
    emits: ["date-selected"],
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

vi.mock("@/components/ui/popup/BookingDetailsPopup.vue", () => ({
  default: {
    name: "BookingDetailsPopup",
    props: ["modelValue", "event", "userRole", "canReviewPending", "comparisonTime", "actionLoading", "popupConfig", "layoutVariant", "compactReviewMode", "presentation"],
    emits: ["update:modelValue", "approve-booking", "close", "closed"],
    data: () => ({ opened: false }),
    watch: {
      modelValue(value) {
        this.opened = value;
      },
    },
    template: `
      <div data-test="widget-compact-details" :data-open="String(modelValue)">
        <button
          v-if="opened"
          data-test="widget-compact-approve"
          :disabled="actionLoading"
          @click="$emit('approve-booking', { bookingId: event.bookingId, eventId: event.eventId, decision: 'approve', event })"
        >accept</button>
      </div>
    `,
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
    emits: ["join-click", "reply-click", "event-click", "menu-action", "approve-booking", "accept-details"],
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
            <span v-if="event.canJoin" data-test="widget-synchronized-join">Join</span>
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
            data-test="widget-approve"
            @click="$emit('accept-details', { bookingId: 'booking_widget_pending', eventId: 'event_widget_pending', event: { bookingId: 'booking_widget_pending', eventId: 'event_widget_pending', status: 'pending' } })"
          >
            Approve
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

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function calendarContextResponse(title, suffix = title.toLowerCase().replace(/\s+/g, "_")) {
  return {
    ok: true,
    data: {
      events: [],
      bookedSlots: [{
        bookingId: `booking_${suffix}`,
        eventId: `event_${suffix}`,
        eventTitle: title,
        eventType: "1on1-call",
        startIso: "2026-03-23T10:00:00+08:00",
        endIso: "2026-03-23T10:30:00+08:00",
        status: "confirmed",
      }],
      bookedSlotsIndex: {},
    },
  };
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

function setDocumentVisibilityState(value) {
  Object.defineProperty(document, "visibilityState", {
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
    getCalendarEventJoinState.mockReset();
    mainCalendarResetScrollToTop.mockReset();
    mainCalendarScrollToCurrentTime.mockReset();
    mainCalendarRevealSelectedWeekDay.mockReset();
    mainCalendarOpenEventDetails.mockReset();
    mainCalendarApplyBookingReviewResult.mockReset();
    requestFanTokenBalanceRefresh.mockReset();

    callFlow.mockResolvedValue({
      ok: true,
      data: {
        events: [],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });

    getCalendarEventJoinState.mockImplementation((event, { viewerRole } = {}) => {
      const raw = event?.raw || {};
      const eventType = String(event?.eventType || event?.type || raw.eventType || raw.type || "");
      const eventId = event?.eventId || raw.eventId;
      const startIso = event?.start || raw.startIso || raw.startAtIso;
      return {
        canJoin: true,
        joinUrl: viewerRole === "creator" && eventType.includes("group")
          ? `https://example.com/scheduled-meeting/?event_id=${encodeURIComponent(eventId)}&start_iso=${encodeURIComponent(startIso)}`
          : "https://example.com/join/77",
      };
    });

    engine = createMockEngine();
    setWindowWidth(1024);
    setWindowHeight(768);
    setNavigatorTouchPoints(0);
    setDocumentVisibilityState("hidden");
    window.localStorage.clear();
  });

  afterEach(() => {
    setWindowWidth(1024);
    setWindowHeight(768);
    setNavigatorTouchPoints(0);
    setDocumentVisibilityState("visible");
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("loads booking context from the creatorId prop", async () => {
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");

    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 99,
        userRole: "creator",
      },
    });

    await flushPromises();

    expect(callFlow).toHaveBeenCalledWith(
      "bookings.fetchDashboardBookingContext",
      expect.objectContaining({
        creatorId: 99,
        fromIso: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        toIso: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        widgetFromIso: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        widgetToIso: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        statusIn: "pending,pending_hold,confirmed,completed,cancelled_user,cancelled_creator,cancelled_system",
        widgetStatusIn: "pending,pending_hold,confirmed",
      }),
      expect.objectContaining({
        context: expect.objectContaining({ creatorId: 99 }),
      }),
    );
    expect(mainCalendarRevealSelectedWeekDay).toHaveBeenCalledTimes(1);
    expect(mainCalendarRevealSelectedWeekDay).toHaveBeenCalledWith({ behavior: "smooth" });
    expect(mainCalendarScrollToCurrentTime).toHaveBeenCalledTimes(1);
    expect(mainCalendarScrollToCurrentTime).toHaveBeenCalledWith({ behavior: "auto" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    expect(mainCalendar.props("showCurrentTimeAcrossDates")).toBe(true);
    expect(mainCalendar.props("minEventHeightPx")).toBe(40);
    expect(mainCalendar.props("tabletWeekEventLaneMinWidthPx")).toBe(96);
    expect(wrapper.getComponent({ name: "MiniCalendar" }).props("allowPastDates")).toBe(true);
    wrapper.unmount();
  });

  it("polls the shared dashboard booking context every ten seconds and updates calendars and widgets", async () => {
    setDocumentVisibilityState("visible");
    const refreshedSlot = {
      bookingId: "booking_polled",
      eventId: "event_polled",
      eventTitle: "Polled booking",
      eventType: "1on1-call",
      startIso: isoTodayAt(10),
      endIso: isoTodayAt(10, 30),
      status: "confirmed",
    };
    callFlow
      .mockResolvedValueOnce({
        ok: true,
        data: { events: [], bookedSlots: [], widgetBookedSlots: [], bookedSlotsIndex: {} },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [refreshedSlot],
          widgetBookedSlots: [refreshedSlot],
          bookedSlotsIndex: {},
        },
      });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    expect(callFlow).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(9_999);
    expect(callFlow).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();

    expect(callFlow).toHaveBeenCalledTimes(2);
    expect(callFlow.mock.calls[1]).toEqual([
      "bookings.fetchDashboardBookingContext",
      expect.objectContaining({
        creatorId: 99,
        widgetFromIso: expect.any(String),
        widgetToIso: expect.any(String),
      }),
      expect.objectContaining({ forceRefresh: true }),
    ]);

    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Polled booking" }),
    ]);
    expect(mainCalendar.props("bookedSlotsCount")).toBe(1);
    expect(Object.keys(mainCalendar.props("bookingScheduleBookedSlotsIndex")))
      .toContain("event_polled");
    expect(wrapper.findAllComponents({ name: "EventsWidget" }).some((widget) => (
      widget.props("sections").some((section) => (
        section.items?.some((item) => item.title === "Polled booking")
      ))
    ))).toBe(true);

    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(callFlow).toHaveBeenCalledTimes(2);
  });

  it("keeps stale dashboard data visible and silently retries after a polling failure", async () => {
    setDocumentVisibilityState("visible");
    const pollFailure = createDeferred();
    const stableSlot = {
      bookingId: "booking_stable_poll",
      eventId: "event_stable_poll",
      eventTitle: "Stable polling booking",
      eventType: "1on1-call",
      startIso: isoTodayAt(10),
      endIso: isoTodayAt(10, 30),
      status: "confirmed",
    };
    callFlow
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [stableSlot],
          widgetBookedSlots: [stableSlot],
          bookedSlotsIndex: {},
        },
      })
      .mockImplementationOnce(() => pollFailure.promise)
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [stableSlot],
          widgetBookedSlots: [stableSlot],
          bookedSlotsIndex: {},
        },
      });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    await vi.advanceTimersByTimeAsync(10_000);
    await flushPromises();

    expect(callFlow).toHaveBeenCalledTimes(2);
    expect(engine.state.events.loading).toBe(false);
    expect(wrapper.getComponent({ name: "MainCalendar" }).props("events"))
      .toEqual([expect.objectContaining({ title: "Stable polling booking" })]);
    expect(wrapper.findAllComponents({ name: "EventsWidget" })).not.toHaveLength(0);

    pollFailure.resolve({ ok: false, error: { message: "Temporary poll failure" } });
    await flushPromises();

    expect(engine.state.events.error).toBeNull();
    expect(wrapper.text()).not.toContain("Temporary poll failure");
    expect(wrapper.getComponent({ name: "MainCalendar" }).props("events"))
      .toEqual([expect.objectContaining({ title: "Stable polling booking" })]);

    await vi.advanceTimersByTimeAsync(10_000);
    await flushPromises();
    expect(callFlow).toHaveBeenCalledTimes(3);

    wrapper.unmount();
  });

  it("pauses polling while hidden and refreshes immediately when visible again", async () => {
    setDocumentVisibilityState("visible");
    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    expect(callFlow).toHaveBeenCalledTimes(1);

    setDocumentVisibilityState("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(callFlow).toHaveBeenCalledTimes(1);

    setDocumentVisibilityState("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await flushPromises();
    expect(callFlow).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(9_999);
    expect(callFlow).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(callFlow).toHaveBeenCalledTimes(3);

    wrapper.unmount();
  });

  it("does not start a poll while another dashboard-context request is active", async () => {
    setDocumentVisibilityState("visible");
    const manualRefresh = createDeferred();
    callFlow
      .mockResolvedValueOnce(calendarContextResponse("Initial polling snapshot"))
      .mockImplementationOnce(() => manualRefresh.promise)
      .mockResolvedValueOnce(calendarContextResponse("Later polling snapshot"));

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    await wrapper.setProps({ refreshSignal: "manual-refresh-in-flight" });
    await flushPromises();
    expect(callFlow).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(callFlow).toHaveBeenCalledTimes(2);

    manualRefresh.resolve(calendarContextResponse("Manual polling snapshot"));
    await flushPromises();
    await vi.advanceTimersByTimeAsync(9_999);
    expect(callFlow).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(callFlow).toHaveBeenCalledTimes(3);

    wrapper.unmount();
  });

  it("forwards the embedded host viewport width to MainCalendar", async () => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
      responsiveViewportWidth: 820,
    });

    expect(wrapper.getComponent({ name: "MainCalendar" }).props("responsiveViewportWidth")).toBe(820);
  });

  it("uses the same reserved axis width for the dashboard header and body on tablets", async () => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
    });
    const calendarTheme = wrapper.getComponent({ name: "MainCalendar" }).props("theme");

    expect(calendarTheme.main.axisXLabel).toContain("md:w-[4.8rem]");
    expect(calendarTheme.main.axisYRow).toContain("md:w-[4.8rem]");
    expect(calendarTheme.main.axisYRow).not.toContain("lg:w-[4.8rem]");
  });

  it("opens compact details before approving a widget booking, then opens refreshed hero details", async () => {
    callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.reviewPendingBooking") {
        return {
          ok: true,
          data: {
            item: {
              bookingId: "booking_widget_pending",
              eventId: "event_widget_pending",
              status: "confirmed",
              eventTitle: "Approved widget booking",
            },
          },
        };
      }
      return {
        ok: true,
        data: { events: [], bookedSlots: [], bookedSlotsIndex: {} },
      };
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
    });

    const approveButton = wrapper.findAll("[data-test='widget-approve']").at(-1);
    expect(approveButton).toBeTruthy();
    await approveButton.trigger("click");
    await flushPromises();

    const compactDetails = wrapper.getComponent({ name: "BookingDetailsPopup" });
    expect(wrapper.find("[data-test='widget-compact-approve']").exists()).toBe(true);
    expect(compactDetails.props("layoutVariant")).toBe("compact");
    expect(compactDetails.props("compactReviewMode")).toBe("accept-only");
    expect(compactDetails.props("presentation")).toBe("responsive-dialog");
    expect(callFlow.mock.calls.some(([flowName]) => flowName === "bookings.reviewPendingBooking"))
      .toBe(false);

    showToast.mockClear();
    await wrapper.get("[data-test='widget-compact-approve']").trigger("click");
    await flushPromises();

    expect(callFlow).toHaveBeenCalledWith(
      "bookings.reviewPendingBooking",
      {
        bookingId: "booking_widget_pending",
        decision: "approve",
        actor: "creator",
        reason: "approved_by_creator",
      },
      expect.objectContaining({
        context: expect.objectContaining({ creatorId: 99 }),
      }),
    );
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ variant: "booking-review" }));

    expect(mainCalendarOpenEventDetails).not.toHaveBeenCalled();
    compactDetails.vm.$emit("closed");
    await flushPromises();
    expect(mainCalendarOpenEventDetails).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking_widget_pending",
      status: "confirmed",
      raw: expect.objectContaining({ status: "confirmed" }),
    }));
  });

  it("keeps the EventsWidget accept-only compact popup open after mobile approval", async () => {
    setWindowWidth(390);
    callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.reviewPendingBooking") {
        return {
          ok: true,
          data: {
            item: {
              bookingId: "booking_widget_pending",
              eventId: "event_widget_pending",
              status: "confirmed",
              eventTitle: "Approved widget booking",
            },
          },
        };
      }
      return { ok: true, data: { events: [], bookedSlots: [], bookedSlotsIndex: {} } };
    });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    await wrapper.findAll("[data-test='widget-approve']").at(-1).trigger("click");
    await flushPromises();

    await wrapper.get("[data-test='widget-compact-approve']").trigger("click");
    await flushPromises();

    const compactDetails = wrapper.getComponent({ name: "BookingDetailsPopup" });
    expect(compactDetails.props("modelValue")).toBe(true);
    expect(compactDetails.props("event")).toEqual(expect.objectContaining({ status: "confirmed" }));
    expect(mainCalendarOpenEventDetails).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: "booking-review",
      status: "confirmed",
      persistent: true,
    }));
  });

  it.each([
    ["approve", "confirmed"],
    ["reject", "cancelled_creator"],
  ])("keeps retained creator hero details open after %s without showing a success toast", async (decision, reviewedStatus) => {
    callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.reviewPendingBooking") {
        return {
          ok: true,
          data: {
            item: {
              bookingId: `booking_hero_${decision}`,
              eventId: `event_hero_${decision}`,
              status: reviewedStatus,
              eventTitle: "Hero review booking",
            },
          },
        };
      }
      return { ok: true, data: { events: [], bookedSlots: [], bookedSlotsIndex: {} } };
    });
    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    showToast.mockClear();
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    mainCalendar.vm.$emit(`${decision === "approve" ? "approve" : "reject"}-booking`, {
      bookingId: `booking_hero_${decision}`,
      retainDetails: true,
      showReviewToast: false,
      event: {
        bookingId: `booking_hero_${decision}`,
        eventId: `event_hero_${decision}`,
        status: "pending",
        start: "2026-03-24T10:00:00",
        end: "2026-03-24T10:30:00",
        raw: { bookingId: `booking_hero_${decision}`, status: "pending" },
      },
    });
    await flushPromises();
    await flushPromises();

    expect(mainCalendarApplyBookingReviewResult).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: `booking_hero_${decision}`,
      status: reviewedStatus,
      raw: expect.objectContaining({ status: reviewedStatus }),
    }));
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ variant: "booking-review" }));
  });

  it("keeps widget compact details open when approval fails", async () => {
    callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.reviewPendingBooking") {
        return { ok: false, error: { message: "Approval failed" } };
      }
      return {
        ok: true,
        data: { events: [], bookedSlots: [], bookedSlotsIndex: {} },
      };
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
    });

    await wrapper.findAll("[data-test='widget-approve']").at(-1).trigger("click");
    await flushPromises();
    await wrapper.get("[data-test='widget-compact-approve']").trigger("click");
    await flushPromises();

    const compactDetails = wrapper.getComponent({ name: "BookingDetailsPopup" });
    expect(compactDetails.props("modelValue")).toBe(true);
    expect(compactDetails.props("actionLoading")).toBe(false);
    expect(mainCalendarOpenEventDetails).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      message: "Approval failed",
    }));
  });

  it("dismisses widget compact details without opening the hero drawer", async () => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
    });

    await wrapper.findAll("[data-test='widget-approve']").at(-1).trigger("click");
    await flushPromises();
    const compactDetails = wrapper.getComponent({ name: "BookingDetailsPopup" });
    compactDetails.vm.$emit("update:modelValue", false);
    compactDetails.vm.$emit("close");
    compactDetails.vm.$emit("closed");
    await flushPromises();

    expect(wrapper.findComponent({ name: "BookingDetailsPopup" }).exists()).toBe(false);
    expect(mainCalendarOpenEventDetails).not.toHaveBeenCalled();
    expect(callFlow.mock.calls.some(([flowName]) => flowName === "bookings.reviewPendingBooking"))
      .toBe(false);
  });

  it("selects past dates from the dashboard mini calendar and loads their range", async () => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
    });
    const miniCalendar = wrapper.getComponent({ name: "MiniCalendar" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    const fetchCallsAfterMount = callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchDashboardBookingContext",
    ).length;
    const pastDate = new Date("2026-02-15T09:00:00");

    miniCalendar.vm.$emit("date-selected", pastDate);
    await flushPromises();

    expect(mainCalendar.props("focusDate").getTime()).toBe(pastDate.getTime());
    expect(mainCalendar.props("selectedDate").getTime()).toBe(pastDate.getTime());
    expect(callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchDashboardBookingContext",
    )).toHaveLength(fetchCallsAfterMount + 1);
  });

  it("replaces the mobile Day dataset when a different week-strip date is selected", async () => {
    vi.setSystemTime(new Date("2026-08-06T09:00:00"));
    setWindowWidth(390);

    callFlow.mockImplementation(async (flowName, payload) => {
      if (flowName !== "bookings.fetchDashboardBookingContext") {
        return { ok: true, data: {} };
      }

      const selectedDate = payload.toIso;
      return {
        ok: true,
        data: {
          events: [],
          bookedSlots: [{
            bookingId: `booking_${selectedDate}`,
            eventId: `event_${selectedDate}`,
            eventTitle: selectedDate === "2026-08-07" ? "August 7 booking" : "August 6 booking",
            eventType: "1on1-call",
            startIso: `${selectedDate}T00:10:00.000Z`,
            endIso: `${selectedDate}T00:20:00.000Z`,
            status: "confirmed",
          }],
          bookedSlotsIndex: {},
        },
      };
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 1407,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();
    mainCalendar.vm.$emit("date-selected", new Date("2026-08-07T12:00:00"));
    await flushPromises();

    const dashboardFetchCalls = callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchDashboardBookingContext",
    );
    const visibleBookings = mainCalendar.props("events")
      .filter((event) => event?.slot !== "availability");

    expect(dashboardFetchCalls.at(-1)?.[1]).toEqual(expect.objectContaining({
      creatorId: 1407,
      fromIso: "2026-08-06",
      toIso: "2026-08-07",
    }));
    expect(visibleBookings).toEqual([
      expect.objectContaining({
        bookingId: "booking_2026-08-07",
        title: "August 7 booking",
      }),
    ]);
  });

  it("coalesces mobile initialization navigation without losing widget bookings", async () => {
    vi.setSystemTime(new Date("2026-08-06T09:00:00"));
    setWindowWidth(390);

    let resolveInitialFetch;
    const initialFetch = new Promise((resolve) => {
      resolveInitialFetch = resolve;
    });
    const confirmedStart = "2026-08-07T03:10:00+08:00";
    const pendingStart = "2026-08-07T04:10:00+08:00";
    const widgetSlots = [
      {
        bookingId: "booking_mobile_confirmed",
        eventId: "event_mobile_confirmed",
        eventTitle: "Mobile Confirmed",
        eventType: "1on1-call",
        startIso: confirmedStart,
        endIso: "2026-08-07T03:20:00+08:00",
        status: "confirmed",
      },
      {
        bookingId: "booking_mobile_pending",
        eventId: "event_mobile_pending",
        eventTitle: "Mobile Pending",
        eventType: "1on1-call",
        startIso: pendingStart,
        endIso: "2026-08-07T04:20:00+08:00",
        status: "pending",
      },
    ];

    callFlow
      .mockImplementationOnce(() => initialFetch)
      .mockResolvedValueOnce({
        ok: true,
        data: {
          events: [],
          bookedSlots: [],
          widgetBookedSlots: null,
          bookedSlotsIndex: {},
        },
      });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 1407,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    expect(mainCalendar.props("initialView")).toBe("day");
    expect(callFlow).toHaveBeenCalledTimes(1);

    mainCalendar.vm.$emit("view-changed", "week");
    mainCalendar.vm.$emit("update:focus-date", new Date("2026-08-14T12:00:00"));
    mainCalendar.vm.$emit("update:focus-date", new Date("2026-08-21T12:00:00"));
    await flushPromises();

    expect(callFlow).toHaveBeenCalledTimes(1);

    resolveInitialFetch({
      ok: true,
      data: {
        events: [],
        bookedSlots: [],
        widgetBookedSlots: widgetSlots,
        bookedSlotsIndex: {},
      },
    });
    await flushPromises();
    await flushPromises();

    const dashboardFetchCalls = callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchDashboardBookingContext",
    );
    const sections = mainCalendar.props("eventsData");

    expect(dashboardFetchCalls).toHaveLength(2);
    expect(dashboardFetchCalls[0][1]).toEqual(expect.objectContaining({
      widgetFromIso: "2026-08-06",
      widgetToIso: "2027-02-06",
    }));
    expect(dashboardFetchCalls[1][1]).toEqual(expect.objectContaining({
      fromIso: "2026-08-15",
      toIso: "2026-08-22",
    }));
    expect(dashboardFetchCalls[1][1]).not.toHaveProperty("widgetFromIso");
    expect(sections.filter((section) => section.isPending === false)
      .flatMap((section) => section.items))
      .toEqual([expect.objectContaining({ title: "Mobile Confirmed" })]);
    expect(sections.find((section) => section.isPending === true)?.items)
      .toEqual([expect.objectContaining({ title: "Mobile Pending", showReply: true })]);
  });

  it("keeps upcoming widget sections stable across Day, Week, and Month views", async () => {
    const farFutureStart = isoDaysFromToday(8, 20, 30);
    const pendingStart = isoDaysFromToday(9, 20, 30);
    const pendingRequestStart = isoDaysFromToday(10, 20, 30);
    const widgetSlots = [
      {
        bookingId: "booking_view_stable_confirmed",
        eventId: "event_view_stable_confirmed",
        eventTitle: "Future Confirmed",
        eventType: "1on1-call",
        startIso: farFutureStart,
        endIso: isoDaysFromToday(8, 21, 0),
        status: "confirmed",
      },
      {
        bookingId: "booking_view_stable_pending",
        eventId: "event_view_stable_pending",
        eventTitle: "Future Pending",
        eventType: "1on1-call",
        startIso: pendingStart,
        endIso: isoDaysFromToday(9, 21, 0),
        status: "pending_hold",
      },
      {
        bookingId: "booking_view_stable_pending_request",
        eventId: "event_view_stable_pending_request",
        eventTitle: "Future Pending Request",
        eventType: "1on1-call",
        startIso: pendingRequestStart,
        endIso: isoDaysFromToday(10, 21, 0),
        status: "pending",
      },
      {
        bookingId: "booking_view_stable_completed",
        eventId: "event_view_stable_completed",
        eventTitle: "Future Completed",
        eventType: "1on1-call",
        startIso: isoDaysFromToday(11, 20, 30),
        endIso: isoDaysFromToday(11, 21, 0),
        status: "completed",
      },
      {
        bookingId: "booking_view_stable_cancelled",
        eventId: "event_view_stable_cancelled",
        eventTitle: "Future Cancelled",
        eventType: "1on1-call",
        startIso: isoDaysFromToday(12, 20, 30),
        endIso: isoDaysFromToday(12, 21, 0),
        status: "cancelled_user",
      },
    ];

    callFlow.mockImplementation(async (flowName, payload) => ({
      ok: true,
      data: {
        events: [],
        bookedSlots: [],
        widgetBookedSlots: payload?.widgetFromIso ? widgetSlots : null,
        bookedSlotsIndex: {},
      },
    }));

    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    const sectionTitlesForView = () => mainCalendar.props("eventsData")
      .flatMap((section) => section.items)
      .map((item) => item.title)
      .sort();

    expect(sectionTitlesForView()).toEqual(["Future Confirmed", "Future Pending", "Future Pending Request"]);
    expect(mainCalendar.props("bookedSlotsCount")).toBe(3);

    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();
    expect(sectionTitlesForView()).toEqual(["Future Confirmed", "Future Pending", "Future Pending Request"]);
    expect(mainCalendar.props("bookedSlotsCount")).toBe(3);

    mainCalendar.vm.$emit("view-changed", "month");
    await flushPromises();
    expect(sectionTitlesForView()).toEqual(["Future Confirmed", "Future Pending", "Future Pending Request"]);
    expect(mainCalendar.props("bookedSlotsCount")).toBe(3);

    const sections = mainCalendar.props("eventsData");
    expect(sections.filter((section) => section.isPending === false)
      .flatMap((section) => section.items))
      .toEqual([expect.objectContaining({ title: "Future Confirmed" })]);
    expect(sections.find((section) => section.isPending === true)?.items)
      .toEqual([
        expect.objectContaining({ title: "Future Pending" }),
        expect.objectContaining({ title: "Future Pending Request" }),
      ]);
  });

  it("masks an uncached view until its complete calendar snapshot is ready", async () => {
    const dayFetch = createDeferred();
    callFlow
      .mockResolvedValueOnce(calendarContextResponse("Week snapshot", "week"))
      .mockImplementationOnce(() => dayFetch.promise);

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Week snapshot" }),
    ]);

    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();

    expect(mainCalendar.props("events")).toEqual([]);
    expect(wrapper.get("[data-test='dashboard-calendar-range-loading']").exists()).toBe(true);
    expect(wrapper.get("[data-test='dashboard-calendar-range-overlay']").attributes("aria-busy")).toBe("true");

    dayFetch.resolve(calendarContextResponse("Day snapshot", "day"));
    await flushPromises();
    await flushPromises();

    expect(wrapper.find("[data-test='dashboard-calendar-range-overlay']").exists()).toBe(false);
    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Day snapshot" }),
    ]);
  });

  it("restores a cached range immediately and revalidates it without an empty state", async () => {
    const dayFetch = createDeferred();
    const weekRevalidation = createDeferred();
    callFlow
      .mockResolvedValueOnce(calendarContextResponse("Cached week", "cached_week"))
      .mockImplementationOnce(() => dayFetch.promise)
      .mockImplementationOnce(() => weekRevalidation.promise);

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();
    dayFetch.resolve(calendarContextResponse("Cached day", "cached_day"));
    await flushPromises();
    await flushPromises();

    mainCalendar.vm.$emit("view-changed", "week");
    await flushPromises();

    expect(wrapper.find("[data-test='dashboard-calendar-range-overlay']").exists()).toBe(false);
    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Cached week" }),
    ]);

    weekRevalidation.resolve(calendarContextResponse("Fresh week", "fresh_week"));
    await flushPromises();
    await flushPromises();

    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Fresh week" }),
    ]);
  });

  it("shows a blocking retry state for an uncached failure but keeps cached data on refresh failure", async () => {
    const dayFailure = createDeferred();
    callFlow
      .mockResolvedValueOnce(calendarContextResponse("Stable week", "stable_week"))
      .mockImplementationOnce(() => dayFailure.promise);

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();
    dayFailure.resolve({ ok: false, error: { message: "Day range failed" } });
    await flushPromises();
    await flushPromises();

    expect(mainCalendar.props("events")).toEqual([]);
    expect(wrapper.get("[data-test='dashboard-calendar-range-error']").text()).toContain("Day range failed");

    callFlow.mockResolvedValueOnce(calendarContextResponse("Recovered day", "recovered_day"));
    await wrapper.get("[data-test='dashboard-calendar-range-retry']").trigger("click");
    await flushPromises();
    await flushPromises();
    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Recovered day" }),
    ]);

    const cachedFailure = createDeferred();
    callFlow.mockImplementationOnce(() => cachedFailure.promise);
    await wrapper.setProps({ refreshSignal: "revalidate-day" });
    await flushPromises();

    expect(wrapper.find("[data-test='dashboard-calendar-range-overlay']").exists()).toBe(false);
    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Recovered day" }),
    ]);

    cachedFailure.resolve({ ok: false, error: { message: "Background refresh failed" } });
    await flushPromises();
    await flushPromises();
    expect(wrapper.find("[data-test='dashboard-calendar-range-overlay']").exists()).toBe(false);
    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Recovered day" }),
    ]);
  });

  it("cannot commit an older response after a rapid Day to Month change", async () => {
    const dayFetch = createDeferred();
    const monthFetch = createDeferred();
    callFlow
      .mockResolvedValueOnce(calendarContextResponse("Initial week", "initial_week"))
      .mockImplementationOnce(() => dayFetch.promise)
      .mockImplementationOnce(() => monthFetch.promise);

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();
    mainCalendar.vm.$emit("view-changed", "month");
    await flushPromises();

    monthFetch.resolve(calendarContextResponse("Current month", "current_month"));
    await flushPromises();
    await flushPromises();
    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Current month" }),
    ]);

    dayFetch.resolve(calendarContextResponse("Stale day", "stale_day"));
    await flushPromises();
    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Current month" }),
    ]);
  });

  it("clears range snapshots when the dashboard identity changes", async () => {
    const identityFetch = createDeferred();
    callFlow
      .mockResolvedValueOnce(calendarContextResponse("Creator 99", "creator_99"))
      .mockImplementationOnce(() => identityFetch.promise);

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    await wrapper.setProps({ creatorId: 100 });
    await flushPromises();

    expect(mainCalendar.props("events")).toEqual([]);
    expect(wrapper.get("[data-test='dashboard-calendar-range-loading']").exists()).toBe(true);

    identityFetch.resolve(calendarContextResponse("Creator 100", "creator_100"));
    await flushPromises();
    await flushPromises();
    expect(mainCalendar.props("events")).toEqual([
      expect.objectContaining({ title: "Creator 100" }),
    ]);
  });

  it("caps the calendar snapshot cache at the twelve most recent ranges", async () => {
    const evictedRangeFetch = createDeferred();
    let firstFromIso = null;
    let revisitFirstRange = false;

    callFlow.mockImplementation((flowName, payload) => {
      if (flowName !== "bookings.fetchDashboardBookingContext") {
        return Promise.resolve({ ok: true, data: {} });
      }
      firstFromIso ||= payload.fromIso;
      if (revisitFirstRange && payload.fromIso === firstFromIso) {
        return evictedRangeFetch.promise;
      }
      return Promise.resolve(calendarContextResponse(`Range ${payload.fromIso}`, payload.fromIso));
    });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    for (let index = 1; index <= 12; index += 1) {
      mainCalendar.vm.$emit("update:focus-date", new Date(2026, 2, 23 + (index * 7), 9, 0, 0));
      await flushPromises();
    }

    revisitFirstRange = true;
    mainCalendar.vm.$emit("update:focus-date", new Date(2026, 2, 23, 9, 0, 0));
    await flushPromises();

    expect(mainCalendar.props("events")).toEqual([]);
    expect(wrapper.get("[data-test='dashboard-calendar-range-loading']").exists()).toBe(true);

    evictedRangeFetch.resolve(calendarContextResponse("Reloaded oldest range", "reloaded_oldest"));
    await flushPromises();
    await flushPromises();
  });

  it("invalidates inactive snapshots on a forced refresh", async () => {
    const evictedDayFetch = createDeferred();
    callFlow
      .mockResolvedValueOnce(calendarContextResponse("Initial week", "forced_week"))
      .mockResolvedValueOnce(calendarContextResponse("Initial day", "forced_day"))
      .mockResolvedValueOnce(calendarContextResponse("Refreshed week", "refreshed_week"))
      .mockResolvedValueOnce(calendarContextResponse("Forced week", "forced_week_latest"))
      .mockImplementationOnce(() => evictedDayFetch.promise);

    const wrapper = await mountDashboardEventsFeature({ creatorId: 99, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();
    mainCalendar.vm.$emit("view-changed", "week");
    await flushPromises();

    await wrapper.setProps({ refreshSignal: "force-week" });
    await flushPromises();

    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();
    expect(mainCalendar.props("events")).toEqual([]);
    expect(wrapper.get("[data-test='dashboard-calendar-range-loading']").exists()).toBe(true);

    evictedDayFetch.resolve(calendarContextResponse("Reloaded day", "reloaded_day"));
    await flushPromises();
    await flushPromises();
  });

  it("scrolls to the current time on Day and Week view changes without changing the selected date", async () => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    const initialFocusDate = new Date(mainCalendar.props("focusDate"));
    const initialSelectedDate = new Date(mainCalendar.props("selectedDate"));

    mainCalendarScrollToCurrentTime.mockClear();

    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();

    expect(mainCalendarScrollToCurrentTime).toHaveBeenCalledTimes(1);
    expect(mainCalendarScrollToCurrentTime).toHaveBeenLastCalledWith({ behavior: "auto" });
    expect(mainCalendar.props("focusDate").getTime()).toBe(initialFocusDate.getTime());
    expect(mainCalendar.props("selectedDate").getTime()).toBe(initialSelectedDate.getTime());

    mainCalendar.vm.$emit("view-changed", "week");
    await flushPromises();

    expect(mainCalendarScrollToCurrentTime).toHaveBeenCalledTimes(2);
    expect(mainCalendarScrollToCurrentTime).toHaveBeenLastCalledWith({ behavior: "auto" });
    expect(mainCalendar.props("focusDate").getTime()).toBe(initialFocusDate.getTime());
    expect(mainCalendar.props("selectedDate").getTime()).toBe(initialSelectedDate.getTime());

    mainCalendar.vm.$emit("view-changed", "month");
    await flushPromises();
    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();

    expect(mainCalendarScrollToCurrentTime).toHaveBeenCalledTimes(2);
    expect(mainCalendar.props("focusDate").getTime()).toBe(initialFocusDate.getTime());
    expect(mainCalendar.props("selectedDate").getTime()).toBe(initialSelectedDate.getTime());
  });

  it("updates the visible range without changing the dashboard selection", async () => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    const initialSelectedDate = mainCalendar.props("selectedDate");
    const callsAfterMount = callFlow.mock.calls.length;
    const nextWeekFocus = new Date(2026, 2, 30, 9, 0, 0);

    mainCalendarScrollToCurrentTime.mockClear();
    mainCalendar.vm.$emit("update:focus-date", nextWeekFocus);
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(mainCalendar.props("focusDate").toDateString()).toBe(nextWeekFocus.toDateString());
    expect(mainCalendar.props("selectedDate").toDateString()).toBe(initialSelectedDate.toDateString());
    expect(callFlow).toHaveBeenCalledTimes(callsAfterMount + 1);

    const manuallySelectedDate = new Date(2026, 3, 2, 9, 0, 0);
    mainCalendar.vm.$emit("date-selected", manuallySelectedDate);
    mainCalendar.vm.$emit("update:focus-date", manuallySelectedDate);
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(mainCalendar.props("focusDate").toDateString()).toBe(manuallySelectedDate.toDateString());
    expect(mainCalendar.props("selectedDate").toDateString()).toBe(manuallySelectedDate.toDateString());
    expect(callFlow).toHaveBeenCalledTimes(callsAfterMount + 2);
    expect(mainCalendarScrollToCurrentTime).not.toHaveBeenCalled();
  });

  it("does not scroll when moving between dates in Day view", async () => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    mainCalendar.vm.$emit("view-changed", "day");
    await flushPromises();
    mainCalendarScrollToCurrentTime.mockClear();

    const nextDayFocus = new Date(2026, 2, 24, 9, 0, 0);
    mainCalendar.vm.$emit("update:focus-date", nextDayFocus);
    await flushPromises();

    expect(mainCalendar.props("focusDate").getTime()).toBe(nextDayFocus.getTime());
    expect(mainCalendarScrollToCurrentTime).not.toHaveBeenCalled();
  });

  it("does not scroll when dashboard context is refreshed after initial load", async () => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
    });

    mainCalendarScrollToCurrentTime.mockClear();
    await wrapper.setProps({ refreshSignal: "refresh-current-view" });
    await flushPromises();

    expect(mainCalendarScrollToCurrentTime).not.toHaveBeenCalled();
  });

  it("keeps early month availability when month navigation preserves a late focus day", async () => {
    vi.setSystemTime(new Date("2026-07-29T09:00:00"));
    const sundayStart = localDateTimeToHkt("2026-08-02", "10:00");
    const sundayEnd = localDateTimeToHkt("2026-08-02", "11:00");
    const rangeAnchor = localDateTimeToHkt("2026-07-29", "12:00");
    const recurringEvent = {
      eventId: "evt_late_month_focus",
      type: "1on1-call",
      status: "active",
      title: "Weekly Sunday event",
      dateFrom: "2026-07-29",
      raw: {
        type: "1on1-call",
        repeatRule: "weekly",
        dateFrom: rangeAnchor.dateIso,
        sessionDurationMinutes: 60,
        slots: [{
          day: sundayStart.weekday,
          startTime: sundayStart.hm,
          endTime: sundayEnd.hm,
          endDayOffset: 0,
        }],
      },
    };
    callFlow.mockResolvedValue({
      ok: true,
      data: {
        events: [recurringEvent],
        bookedSlots: [],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 99,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    mainCalendar.vm.$emit("view-changed", "month");
    await flushPromises();
    mainCalendar.vm.$emit("update:focus-date", new Date("2026-08-29T09:00:00"));
    await flushPromises();

    const availabilityDates = mainCalendar.props("events")
      .filter((event) => event?.isAvailabilityBlock)
      .map((event) => new Date(event.start))
      .map((date) => (
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      ));
    const dashboardFetchCalls = callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchDashboardBookingContext",
    );

    expect(availabilityDates).toEqual(expect.arrayContaining([
      "2026-08-02",
      "2026-08-09",
      "2026-08-16",
    ]));
    expect(dashboardFetchCalls.at(-1)?.[1]).toEqual(expect.objectContaining({
      fromIso: "2026-07-25",
      toIso: "2026-09-05",
    }));
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
        statusIn: "pending,pending_hold,confirmed,completed,cancelled_user,cancelled_creator,cancelled_system",
        widgetStatusIn: "pending,pending_hold,confirmed",
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
      expect.objectContaining({ title: "PENDING REQUESTS", items: [], isPending: true }),
      expect.objectContaining({ title: "TODAY", items: [], isPending: false }),
      expect.objectContaining({ title: "WEEK", items: [], isPending: false }),
    ]);
  });

  it("shows cancelled and creator-declined bookings only in the main calendar", async () => {
    callFlow.mockResolvedValue({
      ok: true,
      data: {
        events: [],
        bookedSlots: [
          {
            bookingId: "booking_cancelled_user",
            eventId: "event_cancelled_user",
            eventTitle: "Fan Cancelled",
            eventType: "1on1-call",
            startIso: isoTodayAt(10),
            endIso: isoTodayAt(10, 30),
            status: "cancelled_user",
          },
          {
            bookingId: "booking_cancelled_creator",
            eventId: "event_cancelled_creator",
            eventTitle: "Creator Declined",
            eventType: "1on1-call",
            startIso: isoTodayAt(11),
            endIso: isoTodayAt(11, 30),
            status: "cancelled_creator",
            approvalStatus: "manual_rejected",
          },
          {
            bookingId: "booking_cancelled_system",
            eventId: "event_cancelled_system",
            eventTitle: "System Cancelled",
            eventType: "1on1-call",
            startIso: isoTodayAt(12),
            endIso: isoTodayAt(12, 30),
            status: "cancelled_system",
          },
        ],
        widgetBookedSlots: [],
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

    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    const cancelledEvents = mainCalendar.props("events")
      .filter((event) => event.bookingId?.startsWith("booking_cancelled"));

    expect(cancelledEvents).toHaveLength(3);
    expect(cancelledEvents.map((event) => event.status)).toEqual([
      "cancelled_user",
      "cancelled_creator",
      "cancelled_system",
    ]);
    expect(cancelledEvents.every((event) => event.slot === "alt")).toBe(true);
    expect(cancelledEvents.find((event) => event.bookingId === "booking_cancelled_creator")?.raw)
      .toEqual(expect.objectContaining({ approvalStatus: "manual_rejected" }));

    expect(wrapper.getComponent({ name: "MiniCalendar" }).props("events"))
      .not.toEqual(expect.arrayContaining([
        expect.objectContaining({ bookingId: "booking_cancelled_user" }),
        expect.objectContaining({ bookingId: "booking_cancelled_creator" }),
        expect.objectContaining({ bookingId: "booking_cancelled_system" }),
      ]));
    expect(mainCalendar.props("eventsData").flatMap((section) => section.items))
      .not.toEqual(expect.arrayContaining([
        expect.objectContaining({ bookingId: "booking_cancelled_user" }),
        expect.objectContaining({ bookingId: "booking_cancelled_creator" }),
        expect.objectContaining({ bookingId: "booking_cancelled_system" }),
      ]));
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

  it("renders visible desktop month booking markers and the availability summary chip", async () => {
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
    expect(declinedMarker.classes()).toContain("min-h-[2.5rem]");

    expect(bookingMarker.text()).toContain("Month Booked Slot");
    expect(bookingMarker.text()).toContain("12:00pm");
    expect(bookingMarker.text()).not.toContain("12:30pm");
    expect(bookingMarker.classes()).toContain("static");
    expect(bookingMarker.classes()).toContain("hidden");
    expect(bookingMarker.classes()).toContain("lg:flex");
    expect(bookingMarker.classes()).toContain("month-booking-row");
    expect(bookingMarker.classes()).not.toContain("flex-col");
    expect(bookingMarker.classes()).not.toContain("justify-between");
    expect(bookingMarker.classes()).not.toContain("h-full");
    expect(bookingMarker.classes()).toContain("cursor-pointer");
    expect(bookingMarker.classes()).toContain("rounded-[0.25rem]");
    expect(bookingMarker.element.style.backgroundColor).toBe("rgb(85, 73, 255)");
    expect(bookingMarker.element.style.borderTopWidth).toBe("1px");
    expect(bookingMarker.element.style.color).toBe("rgb(255, 255, 255)");
    const bookingIcon = bookingMarker.get("[data-test='dashboard-calendar-booking-icon']");
    expect(bookingIcon.attributes("data-booking-icon-type")).toBe("private");
    expect(bookingIcon.get("path").attributes("stroke")).toBe("currentColor");
    const bookingStatusIcon = bookingMarker.get("[data-test='dashboard-calendar-booking-status-icon']");
    expect(bookingStatusIcon.attributes("data-booking-status-icon")).toBe("confirmed");
    expect(bookingStatusIcon.classes()).toContain("shrink-0");
    const bookingTitle = bookingMarker.get("[data-test='dashboard-calendar-booking-title']");
    const bookingTime = bookingMarker.get("[data-test='dashboard-calendar-booking-time']");
    expect(bookingTime.text()).toBe("12:00pm");
    expect(bookingTitle.classes()).toContain("month-booking-title-region");
    expect(bookingTime.classes()).toContain("month-booking-time-region");
    expect(bookingTime.element.lastElementChild?.classList).toContain("month-booking-time-text");
    expect(bookingTime.element.lastElementChild?.classList).toContain("truncate");
    expect(bookingIcon.classes()).toContain("shrink-0");
    for (const marker of bookingMarkers.filter((candidate) => candidate.find("[data-test='dashboard-calendar-booking-time']").exists())) {
      expect(marker.get("[data-test='dashboard-calendar-booking-icon']").classes()).toContain("shrink-0");
      const fixedIndicator = marker.find("[data-test='dashboard-calendar-booking-status-icon'], [data-test='dashboard-calendar-booking-countdown-indicator']");
      expect(fixedIndicator.exists()).toBe(true);
      expect(fixedIndicator.classes()).toContain("shrink-0");
    }
    expect(bookingMarker.find("[data-test='dashboard-calendar-join-call']").exists()).toBe(false);

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
    expect(pastBookingMarker.text()).toContain("7:30am");
    expect(pastBookingMarker.text()).not.toContain("8:30am");
    expect(pastBookingMarker.element.style.backgroundColor).toBe("rgb(217, 220, 230)");
    expect(pastBookingMarker.element.style.borderTopWidth).toBe("0px");
    expect(pastBookingMarker.element.style.borderRightWidth).toBe("0px");
    expect(pastBookingMarker.element.style.borderBottomWidth).toBe("0px");
    expect(pastBookingMarker.element.style.borderLeftWidth).toBe("0px");
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
    expect(pendingMarker.text()).toContain("1:00pm");
    expect(pendingMarker.text()).not.toContain("1:30pm");
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
    expect(declinedMarker.text()).toContain("2:00pm");
    expect(declinedMarker.text()).not.toContain("2:30pm");
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
    expect(availabilityMarker.classes()).toContain("flex");
    expect(availabilityMarker.classes()).not.toContain("hidden");
    expect(availabilityMarker.classes()).toContain("rounded-[0.25rem]");
    expect(availabilityMarker.classes()).toContain("text-xs");
    expect(availabilityMarker.classes()).toContain("font-medium");
    expect(availabilityMarker.text()).toContain("Month Availability Window");
    const availabilityTitle = availabilityMarker.get("[data-test='dashboard-calendar-availability-title']");
    const availabilityIcon = availabilityTitle.get("[data-test='dashboard-calendar-availability-icon']");
    expect(availabilityIcon.classes()).toEqual(expect.arrayContaining(["h-4", "w-4"]));
    expect(availabilityIcon.get("path").attributes("stroke")).toBe("currentColor");
    expect(availabilityTitle.text()).toContain("Month Availability Window");
    expect(availabilityMarker.element.style.backgroundColor).toBe("rgba(14, 165, 233, 0.1)");
    expect(availabilityMarker.element.style.borderTopWidth).toBe("0px");
    expect(availabilityMarker.element.style.borderBottomWidth).toBe("0px");
    expect(availabilityMarker.element.style.borderRadius).toBe("4px");
    expect(availabilityMarker.element.style.color).toBe("rgb(14, 165, 233)");
    expect(availabilityMarker.element.style.backgroundImage).toBe("");
    expect(availabilityMarker.attributes("style")).not.toContain("repeating-linear-gradient");
    expect(availabilityMarker.attributes("style")).not.toContain("rgba(102, 112, 133");
  });

  it("uses a solid grey indicator for every past-booking status in day, week, and month views", async () => {
    getCalendarEventJoinState.mockReturnValue({
      canJoin: false,
      joinUrl: null,
    });
    const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");
    const wrapper = mount(DashboardEventsFeature, {
      props: {
        creatorId: 77,
        userRole: "creator",
      },
    });
    await flushPromises();

    const calendar = wrapper.getComponent({ name: "MainCalendar" });
    const pastStatuses = ["confirmed", "completed", "cancelled_creator", "declined", "pending"];

    for (const view of ["day", "week", "month"]) {
      for (const status of pastStatuses) {
        await calendar.setData({
          pastBookingTestView: view,
          monthPastBookedEvent: {
            ...calendar.vm.monthPastBookedEvent,
            status,
          },
        });
        const pastBookingMarker = wrapper.findAll("[data-test='dashboard-month-booking-marker']")
          .find((marker) => marker.text().includes("Month Past Booked Slot"));

        expect(pastBookingMarker).toBeTruthy();
        expect(pastBookingMarker.element.style.backgroundColor).toBe("rgb(217, 220, 230)");
        expect(pastBookingMarker.element.style.borderTopWidth).toBe("0px");
        expect(pastBookingMarker.element.style.borderRightWidth).toBe("0px");
        expect(pastBookingMarker.element.style.borderBottomWidth).toBe("0px");
        expect(pastBookingMarker.element.style.borderLeftWidth).toBe("0px");
        expect(pastBookingMarker.classes()).toContain(view === "month" ? "static" : "absolute");
        const markerIndicator = pastBookingMarker.get("[data-test='dashboard-calendar-booking-status-icon']");
        expect(markerIndicator.attributes("data-booking-status-icon")).toBe("past");
        expect(markerIndicator.find("svg").exists()).toBe(false);
        expect(markerIndicator.get("div").classes()).toContain("bg-[#98A2B3]");

        pastBookingMarker.element.getBoundingClientRect = vi.fn(() => ({
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
        await pastBookingMarker.trigger("mouseenter");
        const tooltipIndicator = wrapper.get("[data-test='dashboard-booking-tooltip-status-icon']");
        expect(tooltipIndicator.attributes("data-booking-tooltip-status-icon")).toBe("past");
        expect(tooltipIndicator.find("svg").exists()).toBe(false);
        expect(tooltipIndicator.get("div").classes()).toContain("bg-[#98A2B3]");
        await pastBookingMarker.trigger("mouseleave");

        await pastBookingMarker.trigger("click");
        expect(calendar.emitted("month-event-click")?.at(-1)?.[0]).toEqual(expect.objectContaining({ status }));
      }
    }
  });

  it("changes a confirmed month booking countdown to live now for the active call", async () => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({
      bookingTestView: "month",
      monthBookedEvent: {
        ...mainCalendar.vm.monthBookedEvent,
        start: "2026-03-23T09:05:00",
        end: "2026-03-23T09:30:00",
        status: "confirmed",
      },
    });

    const findBookingMarker = () => wrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Month Booked Slot"));

    expect(findBookingMarker().get("[data-test='dashboard-calendar-booking-countdown']").text())
      .toBe("in 5 mins");
    expect(findBookingMarker().get("[data-test='dashboard-calendar-booking-countdown-indicator'] circle").attributes("fill"))
      .toBe("#FF4405");
    expect(findBookingMarker().find("[data-test='dashboard-calendar-booking-status-icon']").exists())
      .toBe(false);
    expect(findBookingMarker().get("[data-test='dashboard-calendar-booking-time']").text())
      .not.toContain("9:05am");

    await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
    await flushPromises();

    expect(findBookingMarker().get("[data-test='dashboard-calendar-booking-countdown']").text())
      .toBe("in 1 min");

    await vi.advanceTimersByTimeAsync(60 * 1000);
    await flushPromises();

    expect(findBookingMarker().get("[data-test='dashboard-calendar-booking-countdown']").text())
      .toBe("live now");
    expect(findBookingMarker().find("[data-test='dashboard-calendar-booking-status-icon']").exists())
      .toBe(false);
    expect(findBookingMarker().get("[data-test='dashboard-calendar-booking-time']").text())
      .not.toContain("9:05am");

    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    await flushPromises();

    expect(findBookingMarker().find("[data-test='dashboard-calendar-booking-countdown']").exists())
      .toBe(false);
    expect(findBookingMarker().get("[data-test='dashboard-calendar-booking-time']").text())
      .toBe("9:05am");
  });

  it.each([
    ["confirmed bookings outside the window", "confirmed", "2026-03-23T09:06:00", "9:06am"],
    ["pending bookings", "pending", "2026-03-23T09:05:00", "9:05am"],
    ["completed bookings", "completed", "2026-03-23T09:05:00", "9:05am"],
    ["cancelled bookings", "cancelled_creator", "2026-03-23T09:05:00", "9:05am"],
    ["confirmed bookings with invalid dates", "confirmed", "not-a-date", ""],
  ])("keeps the month time for %s", async (_label, status, start, expectedTime) => {
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({
      bookingTestView: "month",
      monthBookedEvent: {
        ...mainCalendar.vm.monthBookedEvent,
        start,
        status,
      },
    });

    const bookingMarker = wrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Month Booked Slot"));

    expect(bookingMarker.find("[data-test='dashboard-calendar-booking-countdown']").exists())
      .toBe(false);
    expect(bookingMarker.get("[data-test='dashboard-calendar-booking-time']").text())
      .toBe(expectedTime);
  });

  it("renders the month countdown through booking translations", async () => {
    const wrapper = await mountDashboardEventsFeature(
      { creatorId: 77, userRole: "creator" },
      {
        calendar_event_in_minutes: "dentro de {count} {unit}",
        calendar_event_minute_short_other: "minutos",
        calendar_event_live_now: "en vivo ahora",
      },
    );
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({
      bookingTestView: "month",
      monthBookedEvent: {
        ...mainCalendar.vm.monthBookedEvent,
        start: "2026-03-23T09:05:00",
        status: "confirmed",
      },
    });

    const bookingMarker = wrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Month Booked Slot"));

    expect(bookingMarker.get("[data-test='dashboard-calendar-booking-countdown']").text())
      .toBe("dentro de 5 minutos");

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    await flushPromises();

    expect(bookingMarker.get("[data-test='dashboard-calendar-booking-countdown']").text())
      .toBe("en vivo ahora");
  });

  it.each(["day", "week"])("shows the starting-soon countdown above Join call in %s view", async (view) => {
    getCalendarEventJoinState.mockReturnValue({
      canJoin: true,
      joinUrl: "https://example.com/join/calendar-booking",
    });
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({
      bookingTestView: view,
      monthBookedEvent: {
        ...mainCalendar.vm.monthBookedEvent,
        start: "2026-03-23T09:05:00",
        end: "2026-03-23T09:30:00",
        status: "confirmed",
      },
    });

    const bookingMarker = wrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Month Booked Slot"));
    const joinArea = bookingMarker.get("[data-test='dashboard-calendar-join-area']");
    const countdown = joinArea.get("[data-test='dashboard-calendar-booking-countdown']");
    const joinButton = joinArea.get("[data-test='dashboard-calendar-join-call']");

    expect(countdown.text()).toBe("in 5 mins");
    expect(joinArea.get("[data-test='dashboard-calendar-booking-countdown-indicator'] circle").attributes("fill"))
      .toBe("#FF4405");
    expect(joinArea.get("[data-test='dashboard-calendar-booking-countdown-indicator']").attributes("aria-hidden"))
      .toBe("true");
    expect(countdown.element.compareDocumentPosition(joinButton.element) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
    expect(joinArea.classes()).toContain("pb-1");
    expect(bookingMarker.classes()).toContain("min-h-[4rem]");
    expect(joinButton.text()).toBe("Join call");
  });

  it.each(["day", "week"])("updates the %s countdown to live now while preserving the active Join action", async (view) => {
    getCalendarEventJoinState.mockReturnValue({
      canJoin: true,
      joinUrl: "https://example.com/join/calendar-booking",
    });
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({
      bookingTestView: view,
      monthBookedEvent: {
        ...mainCalendar.vm.monthBookedEvent,
        start: "2026-03-23T09:05:00",
        end: "2026-03-23T09:30:00",
        status: "confirmed",
      },
    });

    expect(wrapper.get("[data-test='dashboard-calendar-booking-countdown']").text())
      .toBe("in 5 mins");

    await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
    await flushPromises();
    expect(wrapper.get("[data-test='dashboard-calendar-booking-countdown']").text())
      .toBe("in 1 min");

    await vi.advanceTimersByTimeAsync(60 * 1000);
    await flushPromises();
    expect(wrapper.get("[data-test='dashboard-calendar-booking-countdown']").text())
      .toBe("live now");
    expect(wrapper.find("[data-test='dashboard-calendar-join-call']").exists())
      .toBe(true);
  });

  it("keeps live now through an effective paid extension and clears it at the extended end", async () => {
    getCalendarEventJoinState.mockReturnValue({
      canJoin: true,
      joinUrl: "https://example.com/join/calendar-booking",
      effectiveEndDate: new Date("2026-03-23T09:10:00"),
    });
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({
      bookingTestView: "month",
      monthBookedEvent: {
        ...mainCalendar.vm.monthBookedEvent,
        start: "2026-03-23T08:55:00",
        end: "2026-03-23T08:59:00",
        status: "confirmed",
      },
    });

    expect(wrapper.get("[data-test='dashboard-calendar-booking-countdown']").text())
      .toBe("live now");

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    await flushPromises();

    expect(wrapper.find("[data-test='dashboard-calendar-booking-countdown']").exists())
      .toBe(false);
  });

  it.each(["day", "week"])("replaces a joinable booking's time with the Join call CTA in %s view", async (view) => {
    getCalendarEventJoinState.mockReturnValue({
      canJoin: true,
      joinUrl: "https://example.com/join/calendar-booking",
    });
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({ bookingTestView: view });

    const bookingMarker = wrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Month Booked Slot"));
    const joinArea = bookingMarker.get("[data-test='dashboard-calendar-join-area']");
    const joinButton = bookingMarker.get("[data-test='dashboard-calendar-join-call']");

    expect(joinArea.classes()).toContain("pb-1");
    expect(joinButton.text()).toBe("Join call");
    expect(joinButton.classes()).toEqual(expect.arrayContaining([
      "mx-1",
      "w-[calc(100%_-_0.5rem)]",
      "justify-center",
      "bg-[#07F468]",
    ]));
    expect(bookingMarker.classes()).toContain("min-h-[4rem]");
    expect(bookingMarker.classes()).not.toContain("min-h-[2.5rem]");
    expect(bookingMarker.classes()).toEqual(expect.arrayContaining([
      "flex",
      "h-full",
      "flex-col",
      "justify-between",
    ]));
    expect(bookingMarker.find("[data-test='dashboard-calendar-booking-time']").exists()).toBe(false);
    expect(bookingMarker.find("[data-test='dashboard-calendar-booking-countdown']").exists()).toBe(false);

    await joinButton.trigger("click");

    expect(wrapper.emitted("open-url")).toEqual([
      [{
        url: "https://example.com/join/calendar-booking",
        target: "_self",
      }],
    ]);
    expect(mainCalendar.emitted("month-event-click")).toBeUndefined();
  });

  it.each(["day", "week"])("spaces a non-joinable booking's title and time apart in %s view", async (view) => {
    getCalendarEventJoinState.mockReturnValue({
      canJoin: false,
      joinUrl: "https://example.com/join/calendar-booking",
    });
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({ bookingTestView: view });

    const bookingMarker = wrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Month Booked Slot"));

    expect(bookingMarker.classes()).toEqual(expect.arrayContaining([
      "flex",
      "h-full",
      "flex-col",
      "justify-between",
      "min-h-[2.5rem]",
    ]));
    expect(bookingMarker.find("[data-test='dashboard-calendar-booking-title']").exists()).toBe(true);
    expect(bookingMarker.find("[data-test='dashboard-calendar-booking-time']").exists()).toBe(true);
    expect(bookingMarker.find("[data-test='dashboard-calendar-join-area']").exists()).toBe(false);
  });

  it("uses the existing group meeting URL and exposes the CTA to fan dashboards", async () => {
    getCalendarEventJoinState.mockImplementation((event, { viewerRole }) => ({
      canJoin: true,
      joinUrl: viewerRole === "creator" && String(event?.eventType || event?.type || "").includes("group")
        ? "https://example.com/scheduled-meeting/?event_id=evt_month_booked&start_iso=2026-03-23T12%3A00%3A00"
        : "https://example.com/join/private-booking",
    }));
    const creatorWrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const creatorCalendar = creatorWrapper.getComponent({ name: "MainCalendar" });
    await creatorCalendar.setData({
      bookingTestView: "week",
      monthBookedEvent: {
        ...creatorCalendar.vm.monthBookedEvent,
        type: "group-event",
        eventType: "group-event",
      },
    });

    await creatorWrapper.get("[data-test='dashboard-calendar-join-call']").trigger("click");
    expect(creatorWrapper.emitted("open-url")?.[0]?.[0]).toEqual({
      url: "https://example.com/scheduled-meeting/?event_id=evt_month_booked&start_iso=2026-03-23T12%3A00%3A00",
      target: "_self",
    });

    const fanWrapper = await mountDashboardEventsFeature({
      creatorId: null,
      fanId: 2615,
      userRole: "fan",
    });
    const fanCalendar = fanWrapper.getComponent({ name: "MainCalendar" });
    await fanCalendar.setData({ bookingTestView: "day" });

    await fanWrapper.get("[data-test='dashboard-calendar-join-call']").trigger("click");
    expect(fanWrapper.emitted("open-url")?.[0]?.[0]).toEqual({
      url: "https://example.com/join/private-booking",
      target: "_self",
    });
  });

  it.each([
    {
      label: "outside the join window",
      status: "confirmed",
      joinState: { canJoin: false, joinUrl: "https://example.com/join/calendar-booking" },
    },
    {
      label: "without a join URL",
      status: "confirmed",
      joinState: { canJoin: true, joinUrl: null },
    },
    {
      label: "after completion",
      status: "completed",
      joinState: { canJoin: true, joinUrl: "https://example.com/join/calendar-booking" },
    },
    {
      label: "while pending",
      status: "pending",
      joinState: { canJoin: true, joinUrl: "https://example.com/join/calendar-booking" },
    },
    {
      label: "after cancellation",
      status: "cancelled_creator",
      joinState: { canJoin: true, joinUrl: "https://example.com/join/calendar-booking" },
    },
  ])("keeps the time row for a booking $label", async ({ status, joinState }) => {
    getCalendarEventJoinState.mockReturnValue(joinState);
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({
      bookingTestView: "day",
      monthBookedEvent: {
        ...mainCalendar.vm.monthBookedEvent,
        start: "2026-03-23T09:05:00",
        end: "2026-03-23T09:30:00",
        status,
      },
    });
    const bookingMarker = wrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Month Booked Slot"));

    expect(bookingMarker.find("[data-test='dashboard-calendar-join-call']").exists()).toBe(false);
    expect(bookingMarker.get("[data-test='dashboard-calendar-booking-time']").text())
      .toBe("9:05am - 9:30am");
    expect(bookingMarker.find("[data-test='dashboard-calendar-booking-countdown']").exists()).toBe(false);
    expect(bookingMarker.classes()).toContain("min-h-[2.5rem]");
    expect(bookingMarker.classes()).not.toContain("min-h-[4rem]");
    expect(wrapper.findAll("[data-test='dashboard-calendar-join-call']")).toHaveLength(0);
  });

  it("updates the calendar CTA as the reactive clock enters and leaves the join window", async () => {
    vi.setSystemTime(new Date("2026-03-23T09:00:59"));
    const joinWindowStart = new Date("2026-03-23T09:01:00").getTime();
    const joinWindowEnd = new Date("2026-03-23T09:02:00").getTime();
    const widgetBookedSlots = [
      {
        bookingId: "booking_height_transition",
        eventId: "evt_height_transition",
        eventTitle: "Height Transition Call",
        eventType: "1on1-call",
        eventCallType: "video",
        startIso: "2026-03-23T09:01:00",
        endIso: "2026-03-23T09:30:00",
        status: "confirmed",
      },
      {
        bookingId: "booking_pending_during_transition",
        eventId: "evt_pending_during_transition",
        eventTitle: "Pending During Transition",
        eventType: "1on1-call",
        eventCallType: "video",
        startIso: "2026-03-23T10:00:00",
        endIso: "2026-03-23T10:30:00",
        status: "pending",
      },
    ];
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_height_transition",
          title: "Height Transition Call",
          type: "1on1-call",
          eventCallType: "video",
        }],
        bookedSlots: widgetBookedSlots,
        widgetBookedSlots,
        bookedSlotsIndex: {},
      },
    });
    getCalendarEventJoinState.mockImplementation((_event, { now }) => {
      const nowMs = new Date(now).getTime();
      return {
        canJoin: nowMs >= joinWindowStart && nowMs < joinWindowEnd,
        joinUrl: "https://example.com/join/calendar-booking",
      };
    });
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({ bookingTestView: "day" });
    const layoutHeight = () => mainCalendar.props("events")
      .find((event) => event.bookingId === "booking_height_transition")
      ?.layoutMinHeightPx;
    const sectionOrder = () => mainCalendar.props("eventsData").map((section) => (
      section.isPending ? "pending" : section.title === "TODAY" ? "today" : "week"
    ));
    const renderedWidgetSectionOrder = () => wrapper
      .findAllComponents({ name: "EventsWidget" })
      .find((component) => component.props("sections")?.some((section) => section.isPending))
      ?.props("sections")
      .map((section) => (
        section.isPending ? "pending" : section.title === "TODAY" ? "today" : "week"
      ));

    expect(wrapper.find("[data-test='dashboard-calendar-join-call']").exists()).toBe(false);
    expect(wrapper.find("[data-test='widget-synchronized-join']").exists()).toBe(false);
    expect(sectionOrder()).toEqual(["pending", "today", "week"]);
    expect(renderedWidgetSectionOrder()).toEqual(["pending", "today", "week"]);
    expect(mainCalendar.props("joinComparisonTime").getTime())
      .toBe(new Date("2026-03-23T09:00:59").getTime());
    expect(layoutHeight()).toBe(40);
    await vi.advanceTimersByTimeAsync(999);
    await flushPromises();
    expect(wrapper.find("[data-test='dashboard-calendar-join-call']").exists()).toBe(false);
    expect(wrapper.find("[data-test='widget-synchronized-join']").exists()).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(wrapper.find("[data-test='dashboard-calendar-join-call']").exists()).toBe(true);
    expect(wrapper.find("[data-test='widget-synchronized-join']").exists()).toBe(true);
    expect(sectionOrder()).toEqual(["today", "pending", "week"]);
    expect(renderedWidgetSectionOrder()).toEqual(["today", "pending", "week"]);
    expect(mainCalendar.props("joinComparisonTime").getTime()).toBe(joinWindowStart);
    expect(layoutHeight()).toBe(64);

    await vi.advanceTimersByTimeAsync(60 * 1000);
    await flushPromises();
    expect(wrapper.find("[data-test='dashboard-calendar-join-call']").exists()).toBe(false);
    expect(wrapper.find("[data-test='widget-synchronized-join']").exists()).toBe(false);
    expect(sectionOrder()).toEqual(["pending", "today", "week"]);
    expect(renderedWidgetSectionOrder()).toEqual(["pending", "today", "week"]);
    expect(mainCalendar.props("joinComparisonTime").getTime()).toBe(joinWindowEnd);
    expect(layoutHeight()).toBe(40);
  });

  it.each([
    { label: "a private creator booking", userRole: "creator", eventType: "1on1-call" },
    { label: "a group creator booking", userRole: "creator", eventType: "group-event" },
    { label: "a private fan booking", userRole: "fan", eventType: "1on1-call" },
    { label: "a group fan booking", userRole: "fan", eventType: "group-event" },
  ])("promotes Today for $label with an enabled Join Call", async ({ userRole, eventType }) => {
    const joinableSlot = {
      bookingId: `booking_joinable_${userRole}_${eventType}`,
      eventId: `evt_joinable_${userRole}_${eventType}`,
      eventTitle: "Joinable Today",
      eventType,
      eventCallType: "video",
      startIso: "2026-03-23T09:05:00",
      endIso: "2026-03-23T09:35:00",
      status: "confirmed",
    };
    const pendingSlot = {
      bookingId: `booking_pending_${userRole}_${eventType}`,
      eventId: `evt_pending_${userRole}_${eventType}`,
      eventTitle: "Pending Today",
      eventType: "1on1-call",
      eventCallType: "video",
      startIso: "2026-03-23T10:00:00",
      endIso: "2026-03-23T10:30:00",
      status: "pending",
    };
    const laterTodaySlot = {
      bookingId: `booking_later_${userRole}_${eventType}`,
      eventId: `evt_later_${userRole}_${eventType}`,
      eventTitle: "Later Today",
      eventType: "1on1-call",
      eventCallType: "video",
      startIso: "2026-03-23T09:30:00",
      endIso: "2026-03-23T10:00:00",
      status: "confirmed",
    };
    getCalendarEventJoinState.mockReturnValue({
      canJoin: true,
      joinUrl: "https://example.com/join/active-booking",
    });
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: joinableSlot.eventId,
          title: joinableSlot.eventTitle,
          type: eventType,
          eventCallType: "video",
        }],
        bookedSlots: [pendingSlot, laterTodaySlot, joinableSlot],
        widgetBookedSlots: [pendingSlot, laterTodaySlot, joinableSlot],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: userRole === "creator" ? 77 : null,
      fanId: userRole === "fan" ? 2615 : null,
      userRole,
    });
    const sections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");

    expect(sections.map((section) => (
      section.isPending ? "pending" : section.title === "TODAY" ? "today" : "week"
    ))).toEqual(["today", "pending", "week"]);
    expect(sections[0].items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: "Joinable Today",
        canJoin: true,
        joinUrl: "https://example.com/join/active-booking",
      }),
    ]));
    expect(sections[0].items.map((item) => item.title))
      .toEqual(["Joinable Today", "Later Today"]);
  });

  it.each([
    {
      label: "outside the join window",
      joinState: { canJoin: false, joinUrl: "https://example.com/join/upcoming" },
    },
    {
      label: "without a usable join URL",
      joinState: { canJoin: true, joinUrl: null },
    },
  ])("keeps Pending first when a confirmed Today booking is $label", async ({ joinState }) => {
    const slots = [
      {
        bookingId: "booking_not_enabled",
        eventId: "evt_not_enabled",
        eventTitle: "Not Enabled Today",
        eventType: "1on1-call",
        startIso: "2026-03-23T09:05:00",
        endIso: "2026-03-23T09:35:00",
        status: "confirmed",
      },
      {
        bookingId: "booking_pending_stays_first",
        eventId: "evt_pending_stays_first",
        eventTitle: "Pending Stays First",
        eventType: "1on1-call",
        startIso: "2026-03-23T10:00:00",
        endIso: "2026-03-23T10:30:00",
        status: "pending_hold",
      },
      {
        bookingId: "booking_completed_ignored",
        eventId: "evt_completed_ignored",
        eventTitle: "Completed Ignored",
        eventType: "1on1-call",
        startIso: "2026-03-23T10:30:00",
        endIso: "2026-03-23T11:00:00",
        status: "completed",
      },
      {
        bookingId: "booking_cancelled_ignored",
        eventId: "evt_cancelled_ignored",
        eventTitle: "Cancelled Ignored",
        eventType: "1on1-call",
        startIso: "2026-03-23T11:00:00",
        endIso: "2026-03-23T11:30:00",
        status: "cancelled_creator",
      },
    ];
    getCalendarEventJoinState.mockReturnValue(joinState);
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [],
        bookedSlots: slots,
        widgetBookedSlots: slots,
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });
    const sections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");

    expect(sections.map((section) => (
      section.isPending ? "pending" : section.title === "TODAY" ? "today" : "week"
    ))).toEqual(["pending", "today", "week"]);
  });

  it("refreshes the shared join clock immediately on visibility and focus recovery", async () => {
    setDocumentVisibilityState("visible");
    vi.setSystemTime(new Date("2026-03-23T09:54:10"));
    const joinWindowStart = new Date("2026-03-23T09:55:00").getTime();
    getCalendarEventJoinState.mockImplementation((_event, { now }) => ({
      canJoin: new Date(now).getTime() >= joinWindowStart,
      joinUrl: "https://example.com/join/calendar-booking",
    }));
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    expect(mainCalendar.props("joinComparisonTime").getTime())
      .toBe(new Date("2026-03-23T09:54:10").getTime());

    vi.setSystemTime(new Date("2026-03-23T09:55:05"));
    document.dispatchEvent(new Event("visibilitychange"));
    await flushPromises();

    expect(mainCalendar.props("joinComparisonTime").getTime())
      .toBe(new Date("2026-03-23T09:55:05").getTime());

    vi.setSystemTime(new Date("2026-03-23T09:55:20"));
    window.dispatchEvent(new Event("focus"));
    await flushPromises();

    expect(mainCalendar.props("joinComparisonTime").getTime())
      .toBe(new Date("2026-03-23T09:55:20").getTime());

    wrapper.unmount();
  });

  it("shows an interactive schedule-title hover card in every main calendar view", async () => {
    const selectedSlot = {
      bookingId: "booking_schedule_hover",
      eventId: "evt_month_availability",
      startIso: "2026-03-23T10:00:00",
      endIso: "2026-03-23T10:30:00",
      status: "confirmed",
    };
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_month_availability",
          title: "Month Availability Window",
          status: "active",
          type: "group-event",
          eventColorSkin: "#0EA5E9",
        }],
        bookedSlots: [selectedSlot],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
      apiBaseUrl: "https://api.example.test",
    });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    for (const view of ["month", "week", "day"]) {
      await mainCalendar.setData({ availabilityTestView: view });
      const title = wrapper.get("[data-test='dashboard-calendar-availability-title-text']");
      title.element.getBoundingClientRect = vi.fn(() => ({
        left: 120,
        right: 260,
        top: 120,
        bottom: 150,
        width: 140,
        height: 30,
        x: 120,
        y: 120,
        toJSON: () => ({}),
      }));

      await title.trigger("mouseenter");

      const tooltip = wrapper.get("[data-test='dashboard-schedule-title-tooltip']");
      expect(tooltip.text()).toContain("Month Availability Window");
      const viewScheduleButton = tooltip.get("[data-test='dashboard-schedule-title-tooltip-view']");
      expect(viewScheduleButton.text()).toContain("View Booking Schedule");
      expect(viewScheduleButton.text()).toContain("↗");

      await title.trigger("mouseleave");
      vi.advanceTimersByTime(121);
      await wrapper.vm.$nextTick();
      expect(wrapper.find("[data-test='dashboard-schedule-title-tooltip']").exists()).toBe(false);
    }

    const title = wrapper.get("[data-test='dashboard-calendar-availability-title-text']");
    await title.trigger("mouseenter");
    await title.trigger("click");
    expect(wrapper.find("[data-test='dashboard-schedule-title-tooltip']").exists()).toBe(false);
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(true);
    document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await wrapper.vm.$nextTick();

    await title.trigger("focusin");
    expect(wrapper.find("[data-test='dashboard-schedule-title-tooltip']").exists()).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find("[data-test='dashboard-schedule-title-tooltip']").exists()).toBe(false);

    await title.trigger("mouseenter");
    await title.trigger("mouseleave");
    const interactiveTooltip = wrapper.get("[data-test='dashboard-schedule-title-tooltip']");
    await interactiveTooltip.trigger("mouseenter");
    vi.advanceTimersByTime(121);
    await wrapper.vm.$nextTick();
    expect(wrapper.find("[data-test='dashboard-schedule-title-tooltip']").exists()).toBe(true);

    await wrapper.get("[data-test='dashboard-schedule-title-tooltip-view']").trigger("click");
    await flushPromises();

    expect(wrapper.find("[data-test='dashboard-schedule-title-tooltip']").exists()).toBe(false);
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(false);
    const previewPopup = wrapper.getComponent({ name: "OneOnOneBookingFlowPopup" });
    expect(previewPopup.props("modelValue")).toBe(true);
    expect(previewPopup.props("previewEvent")).toEqual(expect.objectContaining({
      eventId: "evt_month_availability",
      title: "Month Availability Window",
      type: "group",
    }));
    expect(previewPopup.props("previewBookedSlots")).toEqual([selectedSlot]);
  });

  it.each([
    {
      label: "short title near the left edge",
      title: "Short",
      tooltipWidth: 192,
      titleLeft: 20,
      titleWidth: 40,
      expectedTooltipCenter: 108,
      expectedArrowX: 28,
      viewportHeight: 768,
      titleTop: 100,
      expectedPlacement: "bottom",
    },
    {
      label: "long title near the right edge",
      title: "A very long booking schedule title",
      tooltipWidth: 260,
      titleLeft: 250,
      titleWidth: 40,
      expectedTooltipCenter: 158,
      expectedArrowX: 242,
      viewportHeight: 768,
      titleTop: 100,
      expectedPlacement: "bottom",
    },
    {
      label: "centered title with top placement",
      title: "Centered schedule",
      tooltipWidth: 224,
      titleLeft: 130,
      titleWidth: 40,
      expectedTooltipCenter: 150,
      expectedArrowX: 112,
      viewportHeight: 190,
      titleTop: 150,
      expectedPlacement: "top",
    },
  ])("aligns the tooltip arrow with a $label", async ({
    title,
    tooltipWidth,
    titleLeft,
    titleWidth,
    expectedTooltipCenter,
    expectedArrowX,
    viewportHeight,
    titleTop,
    expectedPlacement,
  }) => {
    setWindowWidth(300);
    setWindowHeight(viewportHeight);
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function getBoundingClientRectMock() {
        if (this.matches?.("[data-test='dashboard-schedule-title-tooltip']")) {
          return {
            left: 0,
            right: tooltipWidth,
            top: 0,
            bottom: 72,
            width: tooltipWidth,
            height: 72,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          };
        }
        return originalGetBoundingClientRect.call(this);
      });

    try {
      const wrapper = await mountDashboardEventsFeature({
        creatorId: 77,
        userRole: "creator",
      });
      const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
      await mainCalendar.setData({
        monthAvailabilityEvent: {
          ...mainCalendar.vm.monthAvailabilityEvent,
          title,
        },
      });
      const titleElement = wrapper.get("[data-test='dashboard-calendar-availability-title-text']");
      titleElement.element.getBoundingClientRect = vi.fn(() => ({
        left: titleLeft,
        right: titleLeft + titleWidth,
        top: titleTop,
        bottom: titleTop + 30,
        width: titleWidth,
        height: 30,
        x: titleLeft,
        y: titleTop,
        toJSON: () => ({}),
      }));

      await titleElement.trigger("mouseenter");
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const tooltip = wrapper.get("[data-test='dashboard-schedule-title-tooltip']");
      const arrow = tooltip.get("span.absolute");
      expect(tooltip.element.style.left).toBe(`${expectedTooltipCenter}px`);
      expect(arrow.element.style.left).toBe(`${expectedArrowX}px`);
      expect(tooltip.attributes("data-placement")).toBe(expectedPlacement);
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("limits schedule-title hover cards to visible creator schedule titles", async () => {
    const creatorWrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const availabilityMarker = creatorWrapper.get("[data-test='dashboard-month-availability-marker']");
    const bookingMarker = creatorWrapper.findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes("Month Booked Slot"));

    await availabilityMarker.trigger("mouseenter");
    expect(creatorWrapper.find("[data-test='dashboard-schedule-title-tooltip']").exists()).toBe(false);

    await bookingMarker.trigger("mouseenter");
    expect(creatorWrapper.find("[data-test='dashboard-booking-tooltip']").exists()).toBe(true);
    expect(creatorWrapper.find("[data-test='dashboard-schedule-title-tooltip']").exists()).toBe(false);

    const mainCalendar = creatorWrapper.getComponent({ name: "MainCalendar" });
    await mainCalendar.setData({
      availabilityTestView: "week",
      monthAvailabilityEvent: {
        ...mainCalendar.vm.monthAvailabilityEvent,
        hideAvailabilityTitle: true,
      },
    });
    expect(creatorWrapper.find("[data-test='dashboard-calendar-availability-title']").exists()).toBe(false);

    const fanWrapper = await mountDashboardEventsFeature({
      creatorId: null,
      fanId: 2615,
      userRole: "fan",
    });
    const fanTitle = fanWrapper.get("[data-test='dashboard-calendar-availability-title-text']");
    await fanTitle.trigger("mouseenter");
    await fanTitle.trigger("focusin");
    expect(fanWrapper.find("[data-test='dashboard-schedule-title-tooltip']").exists()).toBe(false);

    setNavigatorTouchPoints(1);
    const touchWrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });
    const touchTitle = touchWrapper.get("[data-test='dashboard-calendar-availability-title-text']");
    await touchTitle.trigger("mouseenter");
    await touchTitle.trigger("focusin");
    expect(touchWrapper.find("[data-test='dashboard-schedule-title-tooltip']").exists()).toBe(false);
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
    expect(availabilityMarker.find("[data-test='dashboard-calendar-availability-title']").exists()).toBe(true);
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
    const bookedSlots = [{
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
    }, {
      bookingId: "booking_group_color",
      eventId: "evt_group_color",
      userId: 2616,
      creatorId: 77,
      startIso: isoTodayAt(11),
      endIso: isoTodayAt(11, 30),
      status: "confirmed",
      eventTitle: "Group Color Skin",
      eventType: "group-event",
      eventCallType: "video",
      eventSnapshot: {
        eventColorSkin: "#E11D48",
      },
    }];

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_private_color",
          type: "1on1-call",
          eventCallType: "video",
          eventColorSkin: "#28C76F",
        }, {
          eventId: "evt_group_color",
          type: "group-event",
          eventCallType: "video",
          eventColorSkin: "#8B5CF6",
        }],
        bookedSlots,
        widgetBookedSlots: bookedSlots,
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
    expect(todayItem).toEqual(expect.objectContaining({
      accentColor: "#28C76F",
      monthName: "MARCH",
      dayNumber: "23",
      time: "10:00am-10:30am",
    }));
  });

  it("passes the earliest-starting currently joinable confirmed booking to the mobile sticky card", async () => {
    setWindowWidth(768);
    setWindowHeight(1024);
    const laterStartIso = isoTodayAt(9, 4);
    const earlierStartIso = isoTodayAt(9, 2);
    const endIso = isoTodayAt(9, 30);

    getCalendarEventJoinState.mockImplementation((event) => {
      const bookingId = event?.bookingId || event?.raw?.bookingId;
      return {
        canJoin: bookingId !== "booking_without_url",
        joinUrl: bookingId === "booking_without_url" ? null : `https://example.com/join/${bookingId}`,
      };
    });
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [
          { eventId: "evt_later", type: "1on1-call", eventCallType: "video" },
          { eventId: "evt_earlier", type: "1on1-call", eventCallType: "audio" },
          { eventId: "evt_pending", type: "1on1-call", eventCallType: "video" },
          { eventId: "evt_without_url", type: "1on1-call", eventCallType: "video" },
        ],
        bookedSlots: [
          {
            bookingId: "booking_later",
            eventId: "evt_later",
            startIso: laterStartIso,
            endIso,
            status: "confirmed",
            eventTitle: "Later Joinable Call",
            eventType: "1on1-call",
          },
          {
            bookingId: "booking_earlier",
            eventId: "evt_earlier",
            userDisplayName: "Ava",
            userAvatarUrl: "https://example.com/ava.png",
            startIso: earlierStartIso,
            endIso,
            status: "confirmed",
            eventTitle: "Earlier Joinable Call",
            eventType: "1on1-call",
          },
          {
            bookingId: "booking_pending",
            eventId: "evt_pending",
            startIso: isoTodayAt(9, 1),
            endIso,
            status: "pending",
            eventTitle: "Pending Call",
            eventType: "1on1-call",
          },
          {
            bookingId: "booking_without_url",
            eventId: "evt_without_url",
            startIso: isoTodayAt(9, 0),
            endIso,
            status: "confirmed",
            eventTitle: "Call Without URL",
            eventType: "1on1-call",
          },
        ],
        widgetBookedSlots: [],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });
    const stickyEvent = wrapper.getComponent({ name: "MainCalendar" }).props("stickyCardEvent");

    expect(stickyEvent).toEqual(expect.objectContaining({
      title: "Earlier Joinable Call",
      canJoin: true,
      joinUrl: "https://example.com/join/booking_earlier",
      profile: {
        name: "Ava",
        avatar: "https://example.com/ava.png",
      },
    }));
    const floatingCreateControl = wrapper.get("[data-test='dashboard-floating-create-event']");
    expect(floatingCreateControl.classes()).toContain("bottom-[7rem]");
    expect(floatingCreateControl.classes()).toContain("md:bottom-5");
    expect(floatingCreateControl.classes()).toContain("ipad-portrait:bottom-[var(--sticky-card-tablet-bottom)]");
    expect(floatingCreateControl.attributes("style")).toContain("--sticky-card-tablet-bottom: 22.25rem");
  });

  it("prioritizes starting-soon and live confirmed bookings ahead of pending tablet cards", async () => {
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [
          { eventId: "evt_live", type: "1on1-call", eventCallType: "video" },
          { eventId: "evt_soon", type: "1on1-call", eventCallType: "video" },
          { eventId: "evt_later", type: "1on1-call", eventCallType: "video" },
          { eventId: "evt_pending", type: "1on1-call", eventCallType: "video" },
          { eventId: "evt_hold", type: "1on1-call", eventCallType: "video" },
        ],
        bookedSlots: [
          {
            bookingId: "booking_live",
            eventId: "evt_live",
            startIso: isoTodayAt(8, 55),
            endIso: isoTodayAt(9, 30),
            status: "confirmed",
            eventTitle: "Live Call",
          },
          {
            bookingId: "booking_soon",
            eventId: "evt_soon",
            startIso: isoTodayAt(9, 5),
            endIso: isoTodayAt(9, 30),
            status: "confirmed",
            eventTitle: "Starts In Five",
          },
          {
            bookingId: "booking_later",
            eventId: "evt_later",
            startIso: new Date(Date.now() + (5 * 60 + 1) * 1000).toISOString(),
            endIso: isoTodayAt(9, 30),
            status: "confirmed",
            eventTitle: "Outside Five Minutes",
          },
          {
            bookingId: "booking_pending",
            eventId: "evt_pending",
            startIso: isoTodayAt(9, 10),
            endIso: isoTodayAt(9, 40),
            status: "pending",
            eventTitle: "Pending Request",
          },
          {
            bookingId: "booking_hold",
            eventId: "evt_hold",
            startIso: isoTodayAt(9, 20),
            endIso: isoTodayAt(9, 50),
            status: "pending_hold",
            eventTitle: "Pending Hold",
          },
        ],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    const stickyEvents = mainCalendar.props("stickyCardEvents");

    expect(stickyEvents).toHaveLength(3);
    expect(stickyEvents.map((item) => item.title)).toEqual([
      "Live Call",
      "Starts In Five",
      "Pending Request",
    ]);
    expect(stickyEvents[2].showReply).toBe(true);
    expect(mainCalendar.props("stickyCardEvent")?.title).toBe("Live Call");
  });

  it("keeps tablet-only pending cards from moving phone controls and activates the offset in tablet portrait", async () => {
    setWindowWidth(390);
    setWindowHeight(844);
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{ eventId: "evt_pending_mobile", type: "1on1-call", eventCallType: "video" }],
        bookedSlots: [{
          bookingId: "booking_pending_mobile",
          eventId: "evt_pending_mobile",
          startIso: isoTodayAt(9, 10),
          endIso: isoTodayAt(9, 40),
          status: "pending",
          eventTitle: "Pending Mobile Request",
        }],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    const floatingCreateControl = wrapper.get("[data-test='dashboard-floating-create-event']");

    expect(mainCalendar.props("stickyCardEvents")).toHaveLength(1);
    expect(mainCalendar.props("stickyCardEvent")).toBeNull();
    expect(floatingCreateControl.classes())
      .not.toContain("ipad-portrait:bottom-[var(--sticky-card-tablet-bottom)]");
    expect(floatingCreateControl.attributes("style"))
      .toContain("--sticky-card-tablet-bottom: 0.5rem");

    setWindowWidth(768);
    setWindowHeight(1024);
    window.dispatchEvent(new Event("resize"));
    await wrapper.vm.$nextTick();

    expect(floatingCreateControl.classes())
      .toContain("ipad-portrait:bottom-[var(--sticky-card-tablet-bottom)]");
    expect(floatingCreateControl.attributes("style"))
      .toContain("--sticky-card-tablet-bottom: 8.25rem");
  });

  it("excludes pending cards for fans and confirmed bookings outside five minutes", async () => {
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [
          { eventId: "evt_later", type: "1on1-call", eventCallType: "video" },
          { eventId: "evt_pending", type: "1on1-call", eventCallType: "video" },
        ],
        bookedSlots: [
          {
            bookingId: "booking_later",
            eventId: "evt_later",
            startIso: new Date(Date.now() + (5 * 60 + 1) * 1000).toISOString(),
            endIso: isoTodayAt(9, 30),
            status: "confirmed",
            eventTitle: "Outside Five Minutes",
          },
          {
            bookingId: "booking_pending",
            eventId: "evt_pending",
            startIso: isoTodayAt(9, 2),
            endIso: isoTodayAt(9, 30),
            status: "pending",
            eventTitle: "Pending Fan Request",
          },
        ],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({ fanId: 88, userRole: "fan" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    expect(mainCalendar.props("stickyCardEvents")).toEqual([]);
    expect(mainCalendar.props("stickyCardEvent")).toBeNull();
  });

  it("clears the mobile sticky card after an extended booking's effective end", async () => {
    const extendedEndIso = isoTodayAt(9, 1);
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{ eventId: "evt_extended", type: "1on1-call", eventCallType: "video" }],
        bookedSlots: [{
          bookingId: "booking_extended",
          eventId: "evt_extended",
          startIso: isoTodayAt(8, 0),
          endIso: isoTodayAt(8, 30),
          status: "confirmed",
          eventTitle: "Extended Call",
          eventType: "1on1-call",
          extensions: [{ status: "held", endAtIso: extendedEndIso }],
        }],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });

    expect(mainCalendar.props("stickyCardEvent")?.sourceEvent?.end).toBe(extendedEndIso);

    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    await flushPromises();

    expect(mainCalendar.props("stickyCardEvent")).toBeNull();
    expect(wrapper.get("[data-test='dashboard-floating-create-event']").attributes("style"))
      .toContain("--sticky-card-tablet-bottom: 0.5rem");
  });

  it("does not pass a sticky card event when no confirmed booking has an active join URL", async () => {
    getCalendarEventJoinState.mockReturnValue({ canJoin: true, joinUrl: null });
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{ eventId: "evt_no_url", type: "1on1-call", eventCallType: "video" }],
        bookedSlots: [{
          bookingId: "booking_no_url",
          eventId: "evt_no_url",
          startIso: isoTodayAt(9, 0),
          endIso: isoTodayAt(9, 30),
          status: "confirmed",
          eventTitle: "No URL",
          eventType: "1on1-call",
        }],
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });

    expect(wrapper.getComponent({ name: "MainCalendar" }).props("stickyCardEvent")).toBeNull();
    const floatingCreateControl = wrapper.get("[data-test='dashboard-floating-create-event']");
    expect(floatingCreateControl.classes()).toContain("bottom-2");
    expect(floatingCreateControl.classes()).toContain("md:bottom-5");
    expect(floatingCreateControl.classes()).not.toContain("ipad-portrait:bottom-[7rem]");
    expect(floatingCreateControl.attributes("style"))
      .toContain("--sticky-card-tablet-bottom: 0.5rem");
  });

  it("shows confirmed widget status as minutes remaining in the event color skin inside five minutes", async () => {
    const startIso = isoTodayAt(9, 5);
    const endIso = isoTodayAt(9, 30);
    const bookedSlots = [{
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
    }];

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_private_starting_soon",
          type: "1on1-call",
          eventCallType: "video",
          eventColorSkin: "#28C76F",
        }],
        bookedSlots,
        widgetBookedSlots: bookedSlots,
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
    const bookedSlots = [{
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
    }];

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_private_live_now",
          type: "1on1-call",
          eventCallType: "video",
          eventColorSkin: "#28C76F",
        }],
        bookedSlots,
        widgetBookedSlots: bookedSlots,
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
    const bookedSlots = [{
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
    }];

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_group_color",
          type: "group-event",
          eventCallType: "video",
          eventColorSkin: "#28C76F",
        }],
        bookedSlots,
        widgetBookedSlots: bookedSlots,
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
    expect(getCalendarEventJoinState).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: 77 }),
      expect.objectContaining({ viewerRole: "creator", now: expect.any(Date) }),
    );
  });

  it("validates popup joins with the actual click time instead of the stale dashboard clock", async () => {
    vi.setSystemTime(new Date("2026-03-23T09:54:30"));
    const joinWindowStart = Date.parse("2026-03-23T09:55:00");
    getCalendarEventJoinState.mockImplementation((_event, { now }) => ({
      canJoin: new Date(now).getTime() >= joinWindowStart,
      joinUrl: "https://example.com/join/booking_popup_race",
    }));
    const wrapper = await mountDashboardEventsFeature({
      creatorId: 77,
      userRole: "creator",
    });

    vi.setSystemTime(new Date("2026-03-23T09:55:01"));
    await wrapper.get("[data-test='main-calendar-popup-join']").trigger("click");

    const clickOptions = getCalendarEventJoinState.mock.calls.at(-1)?.[1];
    expect(clickOptions.now.getTime()).toBe(Date.parse("2026-03-23T09:55:01"));
    expect(wrapper.emitted("open-url")?.at(-1)).toEqual([{
      url: "https://example.com/join/booking_popup_race",
      target: "_self",
    }]);
    expect(showToast).not.toHaveBeenCalled();
  });

  it("shows current unavailable copy when a confirmed booking cannot be joined", async () => {
    getCalendarEventJoinState.mockReturnValue({
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
    const bookedSlots = [
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
    ];
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_group",
          type: "group-event",
          eventCallType: "video",
          eventColorSkin: "#E11D48",
        }],
        bookedSlots,
        widgetBookedSlots: bookedSlots,
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
    expect(wrapper.getComponent({ name: "MainCalendar" }).props("bookedSlotsCount")).toBe(1);
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
    const bookedSlots = [{
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
    }];

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [{
          eventId: "evt_private_extended",
          type: "1on1-call",
          eventCallType: "video",
          eventColorSkin: "#5549FF",
        }],
        bookedSlots,
        widgetBookedSlots: bookedSlots,
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

    await availabilityMarker.trigger("keydown", { key: "Enter" });
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flushPromises();
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(false);

    await availabilityMarker.trigger("keydown", { key: " " });
    expect(wrapper.find("[data-test='booking-schedule-menu']").exists()).toBe(true);

    wrapper.getComponent({ name: "MainCalendar" }).vm.$emit("date-selected", new Date("2026-03-24T00:00:00"));
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
    expect(mainCalendar.props("fitDayEventColumns")).toBe(true);
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

    mainCalendarScrollToCurrentTime.mockClear();
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
    expect(mainCalendarScrollToCurrentTime).not.toHaveBeenCalled();
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

    const confirmButton = wrapper.get("[data-test='booking-adjustment-decision-primary']");
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

    const confirmButton = wrapper.get("[data-test='booking-adjustment-decision-primary']");
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
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));

    wrapper.getComponent({ name: "BookingAdjustmentDecisionPopup" }).vm.$emit("closed");
    await wrapper.vm.$nextTick();

    expect(mainCalendarOpenEventDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: "booking_private_1",
        status: "cancelled_creator",
      }),
      expect.objectContaining({
        bookingId: "booking_private_1",
        status: "cancelled_creator",
        cancellation: expect.objectContaining({ actor: "creator" }),
      }),
    );
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

    const confirmButton = wrapper.findAll("button").find((button) => button.text().includes("cancel call"));
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
    expect(requestFanTokenBalanceRefresh).toHaveBeenCalledWith({
      reason: "events-booking-update",
      action: "cancel",
      bookingId: "booking_private_1",
    });
  });

  it("shows the booking fee warning only when the selected fan booking includes a booking fee", async () => {
    const wrapper = await mountDashboardEventsFeature({
      fanId: 2615,
      userRole: "fan",
    });

    await wrapper.find("[data-test='widget-cancel-booking-fee']").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("The booking allocation already included in your total will be paid to the creator; the remaining amount will be released.");
    expect(wrapper.text()).not.toContain("held cancellation reserve");
    expect(wrapper.text()).not.toContain("Cancelling this event will notify the host and remove it from your schedule.");
  });

  it("shows the cancellation fee token warning when fan cancellation is outside the advance window", async () => {
    const wrapper = await mountDashboardEventsFeature({
      fanId: 2615,
      userRole: "fan",
    });

    await wrapper.find("[data-test='widget-cancel-cancellation-fee']").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("The 13-token cancellation allocation already included in your booking total will be paid to the creator.");
    expect(wrapper.text()).not.toContain("The booking allocation already included in your total will be paid to the creator");
    expect(wrapper.text()).not.toContain("Cancelling this event will notify the host and remove it from your schedule.");
  });

  it("shows both booking fee and cancellation fee warnings when both apply", async () => {
    const wrapper = await mountDashboardEventsFeature({
      fanId: 2615,
      userRole: "fan",
    });

    await wrapper.find("[data-test='widget-cancel-both-fees']").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("The booking allocation already included in your total will be paid to the creator; the remaining amount will be released.");
    expect(wrapper.text()).toContain("The 21-token cancellation allocation already included in your booking total will be paid to the creator.");
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
    expect(wrapper.text()).not.toContain("held cancellation reserve of 34 tokens");
    expect(wrapper.text()).not.toContain("The booking allocation already included in your total will be paid to the creator");
  });

  it("keeps current-week group sessions visible with group styling and join metadata", async () => {
    const startIso = isoCurrentWeekNotToday(11);
    const endIso = isoCurrentWeekNotToday(14);
    const bookedSlots = [{
      bookingId: "booking_group_week",
      eventId: "evt_group_week",
      userId: 2615,
      userDisplayName: "Ava",
      startIso,
      endIso,
      status: "confirmed",
      eventTitle: "Week Group Hang",
      eventSnapshot: { eventType: "group-event" },
    }];
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [],
        bookedSlots,
        widgetBookedSlots: bookedSlots,
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
    const bookedSlots = [{
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
    }];
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [],
        bookedSlots,
        widgetBookedSlots: bookedSlots,
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

  it("preserves the pending price adjustment projection in dashboard widget event data", async () => {
    const bookedSlots = [{
      bookingId: "booking_adjust_projection",
      eventId: "evt_adjust_projection",
      creatorId: 77,
      startIso: isoDaysFromToday(8, 10),
      endIso: isoDaysFromToday(8, 10, 30),
      status: "confirmed",
      eventTitle: "Adjusted Session",
      eventType: "1on1-call",
      eventCallType: "video",
      pendingPriceAdjustment: true,
    }];
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [],
        bookedSlots,
        widgetBookedSlots: bookedSlots,
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });
    const widgetSections = wrapper.getComponent({ name: "MainCalendar" }).props("eventsData");
    const adjustedItem = widgetSections
      .flatMap((section) => section.items)
      .find((item) => item.sourceEvent?.bookingId === "booking_adjust_projection");

    expect(adjustedItem.sourceEvent.raw.pendingPriceAdjustment).toBe(true);
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
    const bookedSlots = [
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
    ];

    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [],
        bookedSlots,
        widgetBookedSlots: bookedSlots,
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

  it("expires pending approval cards at the exact start while retaining the calendar marker", async () => {
    vi.setSystemTime(new Date("2026-03-23T09:59:59"));
    const boundaryRequests = [
      {
        bookingId: "booking_pending_boundary",
        eventId: "evt_pending_boundary",
        startIso: "2026-03-23T10:00:00",
        endIso: "2026-03-23T10:30:00",
        status: "pending",
        eventTitle: "Pending At Boundary",
        eventType: "1on1-call",
      },
      {
        bookingId: "booking_hold_boundary",
        eventId: "evt_hold_boundary",
        startIso: "2026-03-23T10:00:00",
        endIso: "2026-03-23T10:30:00",
        status: "pending_hold",
        eventTitle: "Hold At Boundary",
        eventType: "group-event",
      },
      {
        bookingId: "booking_pending_future",
        eventId: "evt_pending_future",
        startIso: "2026-03-23T11:00:00",
        endIso: "2026-03-23T11:30:00",
        status: "pending",
        eventTitle: "Future Pending",
        eventType: "1on1-call",
      },
    ];
    callFlow.mockResolvedValueOnce({
      ok: true,
      data: {
        events: [],
        bookedSlots: boundaryRequests,
        widgetBookedSlots: boundaryRequests,
        bookedSlotsIndex: {},
      },
    });

    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    const actionableTitles = () => mainCalendar.props("eventsData")
      .find((section) => section.isPending)?.items.map((item) => item.title);
    const stickyTitles = () => mainCalendar.props("stickyCardEvents").map((item) => item.title);
    const calendarTitles = () => mainCalendar.props("events").map((event) => event.title);
    const calendarMarkerFor = (title) => wrapper
      .findAll("[data-test='dashboard-month-booking-marker']")
      .find((marker) => marker.text().includes(title));

    expect(actionableTitles()).toEqual([
      "Pending At Boundary",
      "Hold At Boundary",
      "Future Pending",
    ]);
    expect(stickyTitles()).toEqual([
      "Pending At Boundary",
      "Hold At Boundary",
      "Future Pending",
    ]);
    expect(wrapper.find("[data-test='dashboard-month-expanded']").text())
      .toContain("Expanded Pending Event");
    expect(calendarMarkerFor("Pending At Boundary")?.element.style.backgroundColor)
      .toBe("transparent");
    expect(calendarMarkerFor("Hold At Boundary")?.element.style.backgroundColor)
      .toBe("transparent");

    await vi.advanceTimersByTimeAsync(999);
    await flushPromises();
    expect(actionableTitles()).toContain("Pending At Boundary");

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();

    expect(actionableTitles()).toEqual(["Future Pending"]);
    expect(stickyTitles()).toEqual(["Future Pending"]);
    expect(wrapper.find("[data-test='dashboard-month-expanded']").text())
      .not.toContain("Expanded Pending Event");
    expect(calendarTitles()).toEqual(expect.arrayContaining([
      "Pending At Boundary",
      "Hold At Boundary",
      "Future Pending",
    ]));
    expect(mainCalendar.props("events")).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "Pending At Boundary", status: "pending" }),
      expect.objectContaining({ title: "Hold At Boundary", status: "pending_hold" }),
    ]));

    for (const view of ["day", "week", "month"]) {
      mainCalendar.vm.bookingTestView = view;
      await wrapper.vm.$nextTick();

      for (const title of ["Pending At Boundary", "Hold At Boundary"]) {
        const markerStyle = calendarMarkerFor(title)?.element.style;
        expect(markerStyle?.backgroundColor).toBe("rgb(217, 220, 230)");
        expect(markerStyle?.borderColor).toBe("rgb(200, 205, 216)");
        expect(markerStyle?.color).toBe("rgb(152, 162, 179)");
        expect(markerStyle?.boxShadow).toBe("none");
      }
    }
  });

  it("blocks stale approval events locally and refreshes the dashboard context", async () => {
    vi.setSystemTime(new Date("2026-03-23T09:59:59Z"));
    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    const initialFetchCount = callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchDashboardBookingContext",
    ).length;

    vi.setSystemTime(new Date("2026-03-23T10:00:00Z"));
    mainCalendar.vm.$emit("approve-booking", {
      bookingId: "booking_stale_dashboard",
      event: {
        bookingId: "booking_stale_dashboard",
        start: "2026-03-23T10:00:00Z",
        status: "pending",
      },
    });
    await flushPromises();

    expect(callFlow.mock.calls.some(
      ([flowName]) => flowName === "bookings.reviewPendingBooking",
    )).toBe(false);
    expect(callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchDashboardBookingContext",
    )).toHaveLength(initialFetchCount + 1);
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      title: "Approval Window Closed",
      message: expect.not.stringContaining("approval_window_closed"),
    }));
  });

  it("turns an approval_window_closed backend race into friendly copy and refreshes context", async () => {
    callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.reviewPendingBooking") {
        return {
          ok: false,
          error: {
            code: "REVIEW_BOOKING_FAILED",
            message: "approval_window_closed",
            details: { error: "approval_window_closed" },
          },
        };
      }
      return {
        ok: true,
        data: { events: [], bookedSlots: [], widgetBookedSlots: [], bookedSlotsIndex: {} },
      };
    });
    const wrapper = await mountDashboardEventsFeature({ creatorId: 77, userRole: "creator" });
    const mainCalendar = wrapper.getComponent({ name: "MainCalendar" });
    const initialFetchCount = callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchDashboardBookingContext",
    ).length;

    mainCalendar.vm.$emit("approve-booking", {
      bookingId: "booking_raced_dashboard",
      event: {
        bookingId: "booking_raced_dashboard",
        start: "2026-03-23T10:00:00Z",
        status: "pending",
      },
    });
    await flushPromises();

    expect(callFlow.mock.calls.some(
      ([flowName]) => flowName === "bookings.reviewPendingBooking",
    )).toBe(true);
    expect(callFlow.mock.calls.filter(
      ([flowName]) => flowName === "bookings.fetchDashboardBookingContext",
    )).toHaveLength(initialFetchCount + 1);
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      title: "Approval Window Closed",
      message: expect.not.stringContaining("approval_window_closed"),
    }));
  });
});
