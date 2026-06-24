import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

vi.mock("@/components/calendar/EventDropdownContent.vue", () => ({
  default: {
    name: "EventDropdownContent",
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template: `
      <div data-test="event-dropdown">
        <button
          data-test="video-only"
          @click="$emit('update:modelValue', { ...modelValue, video: true, audio: false, groupCall: false })"
        >
          video
        </button>
        <button
          data-test="audio-only"
          @click="$emit('update:modelValue', { ...modelValue, video: false, audio: true, groupCall: false })"
        >
          audio
        </button>
        <button
          data-test="video-audio"
          @click="$emit('update:modelValue', { ...modelValue, video: true, audio: true, groupCall: false })"
        >
          both
        </button>
        <button
          data-test="group-off"
          @click="$emit('update:modelValue', { ...modelValue, video: false, audio: false, groupCall: false })"
        >
          group off
        </button>
      </div>
    `,
  },
}));

vi.mock("@/components/calendar/MiniCalendar.vue", () => ({
  default: {
    name: "MiniCalendar",
    template: "<div />",
  },
}));

vi.mock("@/components/ui/popup/PopupHandler.vue", () => ({
  default: {
    name: "PopupHandler",
    props: ["modelValue"],
    template: "<div v-if='modelValue'><slot /></div>",
  },
}));

vi.mock("@/components/calendar/EventsWidget.vue", () => ({
  default: {
    name: "EventsWidget",
    template: "<div />",
  },
}));

vi.mock("@/components/dev/button/ButtonComponent.vue", () => ({
  default: {
    name: "ButtonComponent",
    template: "<button />",
  },
}));

vi.mock("@/components/calendar/NewEventsPopup.vue", () => ({
  default: {
    name: "NewEventsPopup",
    emits: ["create-private", "create-group"],
    template: `
      <div data-test="new-events-popup">
        <button data-test="new-events-private" @click="$emit('create-private')">private</button>
        <button data-test="new-events-group" @click="$emit('create-group')">group</button>
      </div>
    `,
  },
}));

vi.mock("@/components/calendar/CalendarMobilePopupContent.vue", () => ({
  default: {
    name: "CalendarMobilePopupContent",
    props: ["view", "eventsData", "canCreateEvents", "bookingScheduleEvents", "bookingScheduleBookedSlotsIndex", "showBookingScheduleList"],
    emits: ["join-click", "event-click", "menu-action", "open-new-events", "edit-schedule-event", "delete-schedule-event"],
    template: `
      <div data-test="mobile-popup">
        <button data-test="mobile-open-new-events" @click="$emit('open-new-events')">new</button>
        <button
          data-test="mobile-event"
          @click="$emit('event-click', { sourceEvent: { id: 'mobile-source', title: 'Mobile Source', start: '2026-04-23T10:00:00Z', end: '2026-04-23T10:30:00Z' } })"
        >
          event
        </button>
        <button
          data-test="mobile-menu-action"
          @click="$emit('menu-action', { action: 'cancel_call', event: { sourceEvent: { id: 'mobile-source' } } })"
        >
          menu
        </button>
        <button
          data-test="mobile-schedule-edit"
          @click="$emit('edit-schedule-event', bookingScheduleEvents[0])"
        >
          edit schedule
        </button>
        <button
          data-test="mobile-schedule-delete"
          @click="$emit('delete-schedule-event', bookingScheduleEvents[0])"
        >
          delete schedule
        </button>
      </div>
    `,
  },
}));

vi.mock("@/components/calendar/CalendarEventDetailsPopup.vue", () => ({
  default: {
    name: "CalendarEventDetailsPopup",
    props: ["event"],
    template: "<div data-test='event-details'>{{ event.title }}</div>",
  },
}));

vi.mock("@/components/calendar/MobileDateSelector.vue", () => ({
  default: {
    name: "MobileDateSelector",
    template: "<div />",
  },
}));

vi.mock("@/components/ui/form/checkbox/CheckboxGroup.vue", () => ({
  default: {
    name: "CheckboxGroup",
    template: "<label />",
  },
}));

const theme = {
  mini: {},
  main: {
    wrapper: "",
    title: "",
    xHeader: "",
    axisXLabel: "",
    axisXDay: "",
    axisXToday: "",
    axisYRow: "",
    colBase: "",
    gridRow: "",
    eventBase: "",
  },
  month: {
    cellBase: "",
    outside: "",
    today: "",
  },
};

const baseDate = new Date("2026-04-23T00:00:00Z");

function setWindowWidth(width) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

function findMonthDayButton(wrapper, dayNumber) {
  return wrapper.findAll("button").find((button) => button.text().trim().startsWith(String(dayNumber)));
}

function makeEvent(overrides = {}) {
  return {
    id: overrides.id || `${overrides.eventId || "event"}_${overrides.start || "start"}`,
    eventId: overrides.eventId || "event_1",
    title: overrides.title || "Event",
    start: overrides.start || "2026-04-23T10:00:00Z",
    end: overrides.end || "2026-04-23T11:00:00Z",
    eventCallType: overrides.eventCallType || "video",
    type: overrides.type || "1on1-call",
    slot: overrides.slot || null,
    isAvailabilityBlock: overrides.isAvailabilityBlock ?? true,
    isDraftPreview: overrides.isDraftPreview || false,
    raw: {
      eventId: overrides.eventId || "event_1",
      eventCallType: overrides.eventCallType || "video",
      eventType: overrides.type || "1on1-call",
      ...(overrides.raw || {}),
    },
  };
}

function calendarDateAttr(date, offsetDays = 0) {
  const value = new Date(date);
  value.setDate(value.getDate() + offsetDays);
  return value.toISOString().slice(0, 10);
}

async function mountCalendar(events, extraProps = {}, mountOptions = {}) {
  const { default: MainCalendar } = await import("@/components/calendar/MainCalendar.vue");

  return mount(MainCalendar, {
    props: {
      focusDate: baseDate,
      events,
      theme,
      variant: "default",
      timeStart: "00:00",
      timeEnd: "24:00",
      slotMinutes: 60,
      ...extraProps,
    },
    ...mountOptions,
  });
}

async function openFilters(wrapper) {
  await wrapper.get("[data-test='all-events-count']").trigger("click");
}

async function openMobilePopup(wrapper) {
  const mobileActions = wrapper.findAll(".cursor-pointer.flex.xl\\:hidden");
  await mobileActions[mobileActions.length - 1].trigger("click");
}

afterEach(() => {
  vi.useRealTimers();
  setWindowWidth(1024);
});

describe("MainCalendar all events count", () => {
  it("renders a translated Today label above the current date in the theme2 header", async () => {
    vi.useFakeTimers();
    const currentDate = new Date(2026, 3, 23, 9, 0, 0);
    vi.setSystemTime(currentDate);

    const { bookingTranslationSymbol } = await import("@/i18n/bookingTranslations");
    const wrapper = await mountCalendar(
      [],
      {
        focusDate: currentDate,
        highlightTodayColumn: true,
        variant: "theme2",
      },
      {
        global: {
          provide: {
            [bookingTranslationSymbol]: {
              locale: ref("en"),
              t: (key) => (key === "common_today" ? "Hoy" : key),
            },
          },
        },
      },
    );

    const label = wrapper.get("[data-test='calendar-today-label']");
    expect(label.text()).toBe("Hoy");
    expect(label.element.closest("[data-date]")?.textContent).toContain("23");
  });

  it("exposes a reset that clears root, body, and time-column scroll positions", async () => {
    const wrapper = await mountCalendar([
      makeEvent({
        id: "booking_reset",
        eventId: "video_reset",
        start: "2026-04-23T10:00:00Z",
        end: "2026-04-23T11:00:00Z",
        isAvailabilityBlock: false,
      }),
    ]);

    const root = wrapper.element;
    const body = wrapper.get("[data-cal-time-grid]").element;
    const columnScrollers = wrapper.findAll("[data-cal-scroll]").map((node) => node.element);
    const attachScrollSpy = (element) => {
      element.scrollTop = 48;
      element.scrollLeft = 12;
      element.scrollTo = vi.fn(({ top = 0, left = 0 }) => {
        element.scrollTop = top;
        element.scrollLeft = left;
      });
    };

    attachScrollSpy(root);
    attachScrollSpy(body);
    columnScrollers.forEach(attachScrollSpy);

    wrapper.vm.resetScrollToTop();

    expect(root.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(body.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(root.scrollTop).toBe(0);
    expect(body.scrollTop).toBe(0);
    expect(columnScrollers.length).toBeGreaterThan(0);
    columnScrollers.forEach((element) => {
      expect(element.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
      expect(element.scrollTop).toBe(0);
    });
  });

  it("counts one video event once across multiple availability entries and bookings", async () => {
    const wrapper = await mountCalendar([
      makeEvent({ eventId: "video_1", start: "2026-04-23T10:00:00Z", end: "2026-04-23T11:00:00Z" }),
      makeEvent({ eventId: "video_1", start: "2026-04-24T10:00:00Z", end: "2026-04-24T11:00:00Z" }),
      makeEvent({
        id: "booking_1",
        eventId: "video_1",
        start: "2026-04-25T10:00:00Z",
        end: "2026-04-25T11:00:00Z",
        isAvailabilityBlock: false,
      }),
    ]);

    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("1");
  });

  it("counts video and audio events according to selected filters", async () => {
    const wrapper = await mountCalendar([
      makeEvent({ eventId: "video_1", eventCallType: "video" }),
      makeEvent({ eventId: "audio_1", eventCallType: "audio" }),
    ]);

    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("2");

    await openFilters(wrapper);
    await wrapper.get("[data-test='video-only']").trigger("click");
    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("1");

    await wrapper.get("[data-test='audio-only']").trigger("click");
    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("1");

    await wrapper.get("[data-test='video-audio']").trigger("click");
    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("2");
  });

  it("includes group availability and bookings by default and hides them when group is disabled", async () => {
    const wrapper = await mountCalendar([
      makeEvent({
        eventId: "group_availability",
        eventCallType: "video",
        type: "group-event",
        isAvailabilityBlock: true,
      }),
      makeEvent({
        id: "group_booking",
        eventId: "group_booking",
        eventCallType: "video",
        type: "group-event",
        isAvailabilityBlock: false,
      }),
    ]);

    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("2");

    await openFilters(wrapper);
    await wrapper.get("[data-test='group-off']").trigger("click");

    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("0");
  });

  it("renders availability windows that span midnight instead of hiding them", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "overnight_availability",
          start: new Date(2026, 3, 23, 23, 0, 0),
          end: new Date(2026, 3, 24, 1, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      {},
      {
        slots: {
          "event-availability": `
            <template #event-availability="{ style }">
              <div data-test="availability-block" :style="style" />
            </template>
          `,
        },
      },
    );

    const blocks = wrapper.findAll("[data-test='availability-block']");
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some((block) => block.attributes("style")?.includes("display: none"))).toBe(false);
  });

  it("aligns day view body columns with the previous, current, and next day headers", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "focused_day_availability",
          title: "Focused availability",
          start: new Date(2026, 3, 23, 12, 0, 0),
          end: new Date(2026, 3, 23, 13, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      { initialView: "day" },
      {
        slots: {
          "event-availability": `
            <template #event-availability="{ event, day, style }">
              <div
                data-test="availability-block"
                :data-event-id="event.eventId"
                :data-day="day.toISOString().slice(0, 10)"
                :style="style"
              >
                {{ event.title }}
              </div>
            </template>
          `,
        },
      },
    );

    const bodyColumns = wrapper.findAll("[data-cal-time-grid] span.grid > div[data-date]");
    const expectedDates = [
      calendarDateAttr(baseDate, -1),
      calendarDateAttr(baseDate),
      calendarDateAttr(baseDate, 1),
    ];

    expect(bodyColumns).toHaveLength(3);
    expect(bodyColumns.map((column) => column.attributes("data-date"))).toEqual(expectedDates);
    expect(wrapper.findAll("[data-test='availability-block']")).toHaveLength(1);
    expect(bodyColumns[0].find("[data-test='availability-block']").exists()).toBe(false);
    expect(bodyColumns[1].get("[data-test='availability-block']").attributes("data-event-id")).toBe("focused_day_availability");
    expect(bodyColumns[1].get("[data-test='availability-block']").attributes("data-day")).toBe(expectedDates[1]);
    expect(bodyColumns[2].find("[data-test='availability-block']").exists()).toBe(false);
  });

  it("renders adjacent-day availability in its own day view body column", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "previous_day_availability",
          title: "Previous day availability",
          start: new Date(2026, 3, 22, 12, 0, 0),
          end: new Date(2026, 3, 22, 13, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      { initialView: "day" },
      {
        slots: {
          "event-availability": `
            <template #event-availability="{ event, day }">
              <div
                data-test="availability-block"
                :data-event-id="event.eventId"
                :data-day="day.toISOString().slice(0, 10)"
              >
                {{ event.title }}
              </div>
            </template>
          `,
        },
      },
    );

    const bodyColumns = wrapper.findAll("[data-cal-time-grid] span.grid > div[data-date]");
    const expectedDates = [
      calendarDateAttr(baseDate, -1),
      calendarDateAttr(baseDate),
      calendarDateAttr(baseDate, 1),
    ];

    expect(bodyColumns).toHaveLength(3);
    expect(bodyColumns.map((column) => column.attributes("data-date"))).toEqual(expectedDates);
    expect(wrapper.findAll("[data-test='availability-block']")).toHaveLength(1);
    expect(bodyColumns[0].get("[data-test='availability-block']").attributes("data-event-id")).toBe("previous_day_availability");
    expect(bodyColumns[0].get("[data-test='availability-block']").attributes("data-day")).toBe(expectedDates[0]);
    expect(bodyColumns[1].find("[data-test='availability-block']").exists()).toBe(false);
    expect(bodyColumns[2].find("[data-test='availability-block']").exists()).toBe(false);
  });

  it("keeps late-night availability aligned when earlier evening rows expand", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "late_availability_with_expanded_rows",
          start: new Date(2026, 3, 23, 17, 0, 0),
          end: new Date(2026, 3, 23, 23, 55, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          id: "evening_booking_1",
          eventId: "booking_1",
          start: new Date(2026, 3, 23, 18, 0, 0),
          end: new Date(2026, 3, 23, 18, 5, 0),
          isAvailabilityBlock: false,
        }),
        makeEvent({
          id: "evening_booking_2",
          eventId: "booking_2",
          start: new Date(2026, 3, 23, 18, 0, 0),
          end: new Date(2026, 3, 23, 18, 5, 0),
          isAvailabilityBlock: false,
        }),
        makeEvent({
          id: "evening_booking_3",
          eventId: "booking_3",
          start: new Date(2026, 3, 23, 18, 0, 0),
          end: new Date(2026, 3, 23, 18, 5, 0),
          isAvailabilityBlock: false,
        }),
      ],
      {},
      {
        slots: {
          "event-availability": `
            <template #event-availability="{ style }">
              <div data-test="availability-block" :style="style" />
            </template>
          `,
        },
      },
    );

    const block = wrapper.get("[data-test='availability-block']");
    const height = Number(block.attributes("style")?.match(/height:\s*([\d.]+)px/)?.[1]);
    expect(height).toBeGreaterThan(442.66);
  });

  it("routes confirmed month bookings with slot event through the default event slot", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          id: "confirmed_booking",
          title: "Confirmed Booking",
          start: "2026-04-23T10:00:00",
          end: "2026-04-23T11:00:00",
          slot: "event",
          isAvailabilityBlock: false,
        }),
      ],
      { initialView: "month" },
      {
        slots: {
          event: `
            <template #event="{ event, view }">
              <div data-test="month-default-event">{{ view }} {{ event.title }}</div>
            </template>
          `,
          "event-event": `
            <template #event-event="{ event }">
              <div data-test="month-wrong-event">{{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    expect(wrapper.get("[data-test='month-default-event']").text()).toBe("month Confirmed Booking");
    expect(wrapper.find("[data-test='month-wrong-event']").exists()).toBe(false);
  });

  it("routes month availability through the availability slot", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          id: "availability_block",
          title: "",
          start: "2026-04-23T10:00:00",
          end: "2026-04-23T11:00:00",
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      { initialView: "month" },
      {
        slots: {
          "event-availability": `
            <template #event-availability="{ event, view }">
              <div data-test="month-availability">{{ view }} {{ event.eventId }}</div>
            </template>
          `,
        },
      },
    );

    expect(wrapper.get("[data-test='month-availability']").text()).toBe("month event_1");
  });

  it("keeps custom month events on their named slots", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          id: "pending_booking",
          title: "Pending Booking",
          start: "2026-04-23T10:00:00",
          end: "2026-04-23T11:00:00",
          slot: "custom",
          isAvailabilityBlock: false,
        }),
      ],
      { initialView: "month" },
      {
        slots: {
          "event-custom": `
            <template #event-custom="{ event, view }">
              <div data-test="month-custom-event">{{ view }} {{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    expect(wrapper.get("[data-test='month-custom-event']").text()).toBe("month Pending Booking");
  });

  it("ignores draft preview events", async () => {
    const wrapper = await mountCalendar([
      makeEvent({ eventId: "video_1", eventCallType: "video" }),
      makeEvent({ eventId: "draft_1", eventCallType: "video", isDraftPreview: true }),
    ]);

    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("1");
  });

  it("passes dynamic event sections to the mobile popup", async () => {
    const eventsData = [
      {
        title: "Dynamic Today",
        items: [
          {
            title: "Dynamic booked slot",
            sourceEvent: makeEvent({ id: "booked_1", isAvailabilityBlock: false }),
          },
        ],
      },
    ];
    const wrapper = await mountCalendar([], { eventsData });

    await openMobilePopup(wrapper);

    expect(wrapper.getComponent({ name: "CalendarMobilePopupContent" }).props("eventsData")).toEqual(eventsData);
  });

  it("passes booking schedule data to the mobile popup", async () => {
    const bookingScheduleEvents = [
      makeEvent({
        eventId: "evt_mobile_schedule",
        title: "Mobile Schedule",
        isAvailabilityBlock: false,
      }),
    ];
    const bookingScheduleBookedSlotsIndex = {
      evt_mobile_schedule: {
        "2026-04-23": [{ startAtIso: "2026-04-23T10:00:00Z" }],
      },
    };
    const wrapper = await mountCalendar([], {
      bookingScheduleEvents,
      bookingScheduleBookedSlotsIndex,
      showBookingScheduleList: true,
    });

    await openMobilePopup(wrapper);

    const mobilePopup = wrapper.getComponent({ name: "CalendarMobilePopupContent" });
    expect(mobilePopup.props("bookingScheduleEvents")).toEqual(bookingScheduleEvents);
    expect(mobilePopup.props("bookingScheduleBookedSlotsIndex")).toEqual(bookingScheduleBookedSlotsIndex);
    expect(mobilePopup.props("showBookingScheduleList")).toBe(true);
  });

  it("forwards mobile schedule edit actions and closes the mobile popup", async () => {
    const bookingScheduleEvents = [
      makeEvent({
        eventId: "evt_mobile_edit",
        title: "Mobile Edit Schedule",
        isAvailabilityBlock: false,
      }),
    ];
    const wrapper = await mountCalendar([], {
      bookingScheduleEvents,
      showBookingScheduleList: true,
    });

    await openMobilePopup(wrapper);
    await wrapper.get("[data-test='mobile-schedule-edit']").trigger("click");

    expect(wrapper.emitted("edit-schedule-event")).toEqual([[bookingScheduleEvents[0]]]);
    expect(wrapper.find("[data-test='mobile-popup']").exists()).toBe(false);
  });

  it("forwards mobile schedule delete actions and closes the mobile popup", async () => {
    const bookingScheduleEvents = [
      makeEvent({
        eventId: "evt_mobile_delete",
        title: "Mobile Delete Schedule",
        isAvailabilityBlock: false,
      }),
    ];
    const wrapper = await mountCalendar([], {
      bookingScheduleEvents,
      showBookingScheduleList: true,
    });

    await openMobilePopup(wrapper);
    await wrapper.get("[data-test='mobile-schedule-delete']").trigger("click");

    expect(wrapper.emitted("delete-schedule-event")).toEqual([[bookingScheduleEvents[0]]]);
    expect(wrapper.find("[data-test='mobile-popup']").exists()).toBe(false);
  });

  it("expands mobile month rows with real booked events instead of dummy content", async () => {
    setWindowWidth(500);
    const wrapper = await mountCalendar([
      makeEvent({
        id: "booking_real",
        eventId: "video_real",
        title: "Real Live Call",
        start: "2026-04-23T10:00:00",
        end: "2026-04-23T11:00:00",
        status: "confirmed",
        isAvailabilityBlock: false,
      }),
    ], { initialView: "month" });

    await findMonthDayButton(wrapper, 23).trigger("click");

    const expanded = wrapper.get("[data-test='month-expanded-default']");
    expect(expanded.text()).toContain("Real Live Call");
    expect(expanded.text()).toContain("10:00am-11:00am");
    expect(expanded.text()).not.toContain("Apples");
    expect(expanded.text()).not.toContain("Mangoes");
  });

  it("does not expand mobile month rows for availability-only dates", async () => {
    setWindowWidth(500);
    const wrapper = await mountCalendar([
      makeEvent({
        eventId: "availability_only",
        start: "2026-04-23T10:00:00",
        end: "2026-04-23T11:00:00",
        slot: "availability",
        isAvailabilityBlock: true,
      }),
    ], { initialView: "month" });

    await findMonthDayButton(wrapper, 23).trigger("click");

    expect(wrapper.find("[data-test='month-expanded-default']").exists()).toBe(false);
  });

  it("opens event details from the mobile month expanded row", async () => {
    setWindowWidth(500);
    const wrapper = await mountCalendar([
      makeEvent({
        id: "booking_real",
        eventId: "video_real",
        title: "Expanded Detail Source",
        start: "2026-04-23T10:00:00",
        end: "2026-04-23T11:00:00",
        status: "confirmed",
        isAvailabilityBlock: false,
      }),
    ], { initialView: "month" });

    await findMonthDayButton(wrapper, 23).trigger("click");
    await wrapper.get("[data-test='month-expanded-event']").trigger("click");

    expect(wrapper.get("[data-test='event-details']").text()).toBe("Expanded Detail Source");
  });

  it("allows creators to open new events from the mobile popup", async () => {
    const wrapper = await mountCalendar([], { userRole: "creator" });

    await openMobilePopup(wrapper);

    expect(wrapper.getComponent({ name: "CalendarMobilePopupContent" }).props("canCreateEvents")).toBe(true);
  });

  it("prevents fans from opening new events from the mobile popup", async () => {
    const wrapper = await mountCalendar([], { userRole: "fan" });

    await openMobilePopup(wrapper);
    expect(wrapper.getComponent({ name: "CalendarMobilePopupContent" }).props("canCreateEvents")).toBe(false);

    await wrapper.get("[data-test='mobile-open-new-events']").trigger("click");
    expect(wrapper.find("[data-test='new-events-popup']").exists()).toBe(false);
  });

  it("opens event details from mobile widget source events", async () => {
    const wrapper = await mountCalendar([]);

    await openMobilePopup(wrapper);
    await wrapper.get("[data-test='mobile-event']").trigger("click");

    expect(wrapper.get("[data-test='event-details']").text()).toBe("Mobile Source");
    expect(wrapper.find("[data-test='mobile-popup']").exists()).toBe(false);
  });

  it("forwards mobile widget menu actions", async () => {
    const wrapper = await mountCalendar([]);

    await openMobilePopup(wrapper);
    await wrapper.get("[data-test='mobile-menu-action']").trigger("click");

    expect(wrapper.emitted("menu-action")).toEqual([
      [{ action: "cancel_call", event: { sourceEvent: { id: "mobile-source" } } }],
    ]);
    expect(wrapper.find("[data-test='mobile-popup']").exists()).toBe(false);
  });

  it("emits private create events from the mobile new events popup", async () => {
    const wrapper = await mountCalendar([]);

    await openMobilePopup(wrapper);
    await wrapper.get("[data-test='mobile-open-new-events']").trigger("click");
    await wrapper.get("[data-test='new-events-private']").trigger("click");

    expect(wrapper.emitted("create-event")).toEqual([[{ type: "private" }]]);
    expect(wrapper.find("[data-test='new-events-popup']").exists()).toBe(false);
  });

  it("emits group create events from the mobile new events popup", async () => {
    const wrapper = await mountCalendar([]);

    await openMobilePopup(wrapper);
    await wrapper.get("[data-test='mobile-open-new-events']").trigger("click");
    await wrapper.get("[data-test='new-events-group']").trigger("click");

    expect(wrapper.emitted("create-event")).toEqual([[{ type: "group" }]]);
    expect(wrapper.find("[data-test='new-events-popup']").exists()).toBe(false);
  });
});
