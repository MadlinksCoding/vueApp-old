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
    props: ["events", "eventsData"],
    emits: ["create-event", "month-event-click"],
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
        monthAvailabilityEvent: {
          id: "month-availability",
          eventId: "evt_month_availability",
          title: "",
          start: "2026-03-23T09:00:00",
          end: "2026-03-23T10:00:00",
          status: "available",
          slot: "availability",
          isAvailabilityBlock: true,
        },
      };
    },
    methods: {
      handleMonthEventClick(event) {
        this.$emit("month-event-click", event);
      },
      resetScrollToTop: mainCalendarResetScrollToTop,
    },
    template: `
      <div class='main-calendar-stub'>
        <button data-test="main-calendar-create-group" @click="$emit('create-event', { type: 'group' })">group</button>
        <slot />
        <slot
          name="event"
          :event="monthBookedEvent"
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

async function mountDashboardEventsFeature(props = {}) {
  const { default: DashboardEventsFeature } = await import("@/features/events/DashboardEventsFeature.vue");
  const wrapper = mount(DashboardEventsFeature, {
    props,
    global: {
      provide: {
        [bookingTranslationSymbol]: createBookingTranslator(),
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
  });

  afterEach(() => {
    setWindowWidth(1024);
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

    const bookingMarker = wrapper.get("[data-test='dashboard-month-booking-marker']");
    expect(bookingMarker.text()).toContain("Month Booked Slot");
    expect(bookingMarker.text()).toContain("12:00pm - 12:30pm");
    expect(bookingMarker.classes()).toContain("static");
    expect(bookingMarker.classes()).toContain("hidden");
    expect(bookingMarker.classes()).toContain("lg:block");

    const availabilityMarker = wrapper.get("[data-test='dashboard-month-availability-marker']");
    expect(availabilityMarker.classes()).toContain("static");
    expect(availabilityMarker.classes()).toContain("hidden");
    expect(availabilityMarker.classes()).toContain("lg:block");
    expect(availabilityMarker.attributes("style")).toContain("rgba(102, 112, 133, 0.55)");
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
});
