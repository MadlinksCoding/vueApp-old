import { mount } from "@vue/test-utils";
import { reactive } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

let engine;
const callFlow = vi.fn();
const showToast = vi.fn();
const getBookingJoinState = vi.fn();

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
    emits: ["create-event"],
    template: `
      <div class='main-calendar-stub'>
        <button data-test="main-calendar-create-group" @click="$emit('create-event', { type: 'group' })">group</button>
        <slot />
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
    template: `
      <div>
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
          @click="$emit('menu-action', { action: 'cancel_call', event: { sourceEvent: { bookingId: 'booking_private_1', eventId: 'evt_private', start: '2026-03-23T12:00:00Z', end: '2026-03-23T12:30:00Z', status: 'confirmed', type: '1on1-call', raw: { bookingId: 'booking_private_1' } } } })"
        >
          Cancel Private
        </button>
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
        target: "_blank",
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
      groupText: expect.stringContaining("Group event"),
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
