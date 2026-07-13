import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
        <button
          data-test="show-completed"
          @click="$emit('update:modelValue', { ...modelValue, showCompleted: true })"
        >
          completed
        </button>
        <button
          data-test="show-schedule-off"
          @click="$emit('update:modelValue', { ...modelValue, showSchedule: false })"
        >
          hide schedule
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
    emits: ["join-click", "event-click", "menu-action", "open-new-events", "edit-schedule-event", "delete-schedule-event", "view-schedule-card"],
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
        <button
          data-test="mobile-schedule-view-card"
          @click="$emit('view-schedule-card', bookingScheduleEvents[0])"
        >
          view schedule card
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
    props: ["label", "modelValue"],
    emits: ["update:modelValue"],
    template: `
      <label>
        <input
          data-test="checkbox-group-input"
          type="checkbox"
          :checked="modelValue"
          @change="$emit('update:modelValue', $event.target.checked)"
        />
        <span>{{ label }}</span>
      </label>
    `,
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
    createdAt: overrides.createdAt || undefined,
    start: overrides.start || "2026-04-23T10:00:00Z",
    end: overrides.end || "2026-04-23T11:00:00Z",
    eventCallType: overrides.eventCallType || "video",
    type: overrides.type || "1on1-call",
    slot: overrides.slot || null,
    isAvailabilityBlock: overrides.isAvailabilityBlock ?? true,
    isDraftPreview: overrides.isDraftPreview || false,
    status: overrides.status,
    raw: {
      eventId: overrides.eventId || "event_1",
      createdAt: overrides.createdAt || undefined,
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

function localDateKey(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  await wrapper.get("[data-test='calendar-mobile-popup-trigger']").trigger("click");
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 3, 23, 9, 0, 0));
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
  setWindowWidth(1024);
});

describe("MainCalendar all events count", () => {
  it("renders default calendar labels through booking translations", async () => {
    const { bookingTranslationSymbol } = await import("@/i18n/bookingTranslations");
    const translations = {
      dashboard_calendar_show_legend: "Mostrar leyenda",
      dashboard_calendar_legend_event_type: "Tipo de evento",
      dashboard_calendar_legend_one_on_one_call: "Llamada individual",
      dashboard_calendar_legend_group_call: "Llamada grupal",
      dashboard_calendar_legend_booking_schedule: "Agenda de reservas",
      dashboard_calendar_legend_status: "Estado",
      calendar_event_status_pending: "Pendiente",
      calendar_event_status_confirmed: "Confirmada",
      dashboard_calendar_legend_declined_canceled: "Rechazada/Cancelada",
      calendar_timezone_gmt_offset: "UTC{offset}",
      calendar_time_period_am_short: "a. m.",
      calendar_time_period_pm_short: "p. m.",
    };

    const wrapper = await mountCalendar(
      [],
      {},
      {
        global: {
          provide: {
            [bookingTranslationSymbol]: {
              locale: ref("es"),
              t: (key, params = {}) => {
                const message = translations[key] || key;
                return message.replace(/\{offset\}/g, params.offset ?? "{offset}");
              },
            },
          },
        },
      },
    );

    expect(wrapper.text()).toContain("Mostrar leyenda");
    expect(wrapper.text()).toContain("UTC +08");
    expect(wrapper.text()).toContain("12a. m.");

    await wrapper.get("[data-test='checkbox-group-input']").setValue(true);

    expect(wrapper.text()).toContain("Tipo de evento");
    expect(wrapper.text()).toContain("Llamada individual");
    expect(wrapper.text()).toContain("Llamada grupal");
    expect(wrapper.text()).toContain("Agenda de reservas");
    expect(wrapper.text()).toContain("Estado");
    expect(wrapper.text()).toContain("Pendiente");
    expect(wrapper.text()).toContain("Confirmada");
    expect(wrapper.text()).toContain("Rechazada/Cancelada");
  });

  it("translates fallback month-expanded event statuses", async () => {
    setWindowWidth(390);

    const { bookingTranslationSymbol } = await import("@/i18n/bookingTranslations");
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "pending_hold_booking",
          status: "pending_hold",
          isAvailabilityBlock: false,
        }),
      ],
      { initialView: "month" },
      {
        global: {
          provide: {
            [bookingTranslationSymbol]: {
              locale: ref("es"),
              t: (key) => (key === "calendar_event_status_pending_hold" ? "En espera" : key),
            },
          },
        },
      },
    );

    await findMonthDayButton(wrapper, 23).trigger("click");

    expect(wrapper.get("[data-test='month-expanded-event']").text()).toContain("En espera");
  });

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

  it("supports theme2 week event columns and hides only saved schedules when unchecked", async () => {
    const wrapper = await mountCalendar(
      [
        {
          ...makeEvent({
            eventId: "evt_saved",
            title: "Saved availability",
            slot: "availability",
            isAvailabilityBlock: true,
          }),
          isExistingSchedule: true,
        },
        {
          ...makeEvent({
            id: "booking_saved",
            eventId: "evt_saved",
            title: "Saved booking",
            slot: "event",
            isAvailabilityBlock: false,
          }),
          isExistingSchedule: true,
        },
        {
          ...makeEvent({
            eventId: "draft_new_event",
            title: "Draft availability",
            slot: "custom",
            isAvailabilityBlock: true,
            isDraftPreview: true,
          }),
          isExistingSchedule: false,
        },
      ],
      {
        variant: "theme2",
        initialView: "week",
        dayColumnMode: "events",
        rowHeightPx: 120,
      },
      {
        slots: {
          "event-availability": `
            <template #event-availability="{ event }">
              <div data-test="theme2-availability" :data-event-id="event.eventId">{{ event.title }}</div>
            </template>
          `,
          event: `
            <template #event="{ event }">
              <div data-test="theme2-booking" :data-event-id="event.eventId">{{ event.title }}</div>
            </template>
          `,
          "event-custom": `
            <template #event-custom="{ event }">
              <div data-test="theme2-draft" :data-event-id="event.eventId">{{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    expect(wrapper.findAll("[data-test='calendar-week-event-day-group']")).toHaveLength(7);
    expect(wrapper.find("[data-test='theme2-availability']").exists()).toBe(true);
    expect(wrapper.find("[data-test='theme2-booking']").exists()).toBe(true);
    expect(wrapper.find("[data-test='theme2-draft']").exists()).toBe(true);

    await wrapper.get("input[type='checkbox']").setValue(false);

    expect(wrapper.find("[data-test='theme2-availability']").exists()).toBe(false);
    expect(wrapper.find("[data-test='theme2-booking']").exists()).toBe(false);
    expect(wrapper.find("[data-test='theme2-draft']").exists()).toBe(true);
    const selectedGroup = wrapper.get("[data-test='calendar-week-event-day-group'][data-selected='true']");
    expect(selectedGroup.findAll("[data-test='calendar-week-event-column']")).toHaveLength(1);
    expect(selectedGroup.get("[data-test='calendar-week-event-column']").attributes("data-event-id")).toBe("draft_new_event");
  });

  it("exposes a reset that clears root, body, shared grid, and time-column scroll positions", async () => {
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
    const sharedGridScroller = wrapper.get("[data-cal-time-scroll]").element;
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
    attachScrollSpy(sharedGridScroller);
    columnScrollers.forEach(attachScrollSpy);

    wrapper.vm.resetScrollToTop();

    expect(root.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(body.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(sharedGridScroller.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(root.scrollTop).toBe(0);
    expect(body.scrollTop).toBe(0);
    expect(sharedGridScroller.scrollTop).toBe(0);
    expect(columnScrollers.length).toBeGreaterThan(0);
    columnScrollers.forEach((element) => {
      expect(element.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
      expect(element.scrollTop).toBe(0);
    });
  });

  it("smoothly scrolls the current-time line into the time-grid viewport", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 23, 12, 15, 0));

    const wrapper = await mountCalendar([], {
      focusDate: new Date(2026, 3, 23),
      initialView: "day",
      dayColumnMode: "events",
      rowHeightPx: 120,
    });
    const timeScroller = wrapper.get("[data-cal-time-scroll]").element;
    Object.defineProperty(timeScroller, "clientHeight", { configurable: true, value: 400 });
    Object.defineProperty(timeScroller, "scrollHeight", { configurable: true, value: 2880 });
    Object.defineProperty(timeScroller, "scrollLeft", { configurable: true, value: 0, writable: true });
    timeScroller.scrollTo = vi.fn();

    await expect(wrapper.vm.scrollToCurrentTime()).resolves.toBe(true);

    expect(timeScroller.scrollTo).toHaveBeenCalledWith({
      top: 1310,
      left: 0,
      behavior: "smooth",
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

  it("hides completed and ended bookings until the completed filter is enabled", async () => {
    const wrapper = await mountCalendar([
      makeEvent({
        id: "completed_status",
        eventId: "completed_status",
        isAvailabilityBlock: false,
        raw: { bookingStatus: "completed" },
        start: "2026-04-23T10:00:00",
        end: "2026-04-23T11:00:00",
      }),
      makeEvent({
        id: "ended_confirmed",
        eventId: "ended_confirmed",
        isAvailabilityBlock: false,
        status: "confirmed",
        start: "2026-04-23T07:00:00",
        end: "2026-04-23T09:00:00",
      }),
      makeEvent({
        id: "upcoming_confirmed",
        eventId: "upcoming_confirmed",
        isAvailabilityBlock: false,
        status: "confirmed",
        start: "2026-04-23T11:00:00",
        end: "2026-04-23T12:00:00",
      }),
      makeEvent({
        id: "ended_availability",
        eventId: "ended_availability",
        isAvailabilityBlock: true,
        start: "2026-04-23T07:00:00",
        end: "2026-04-23T08:00:00",
      }),
    ]);

    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("2");

    await openFilters(wrapper);
    await wrapper.get("[data-test='show-completed']").trigger("click");

    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("4");
  });

  it("updates ended-booking visibility on the existing minute timer", async () => {
    const wrapper = await mountCalendar([
      makeEvent({
        id: "ending_booking",
        eventId: "ending_booking",
        isAvailabilityBlock: false,
        status: "confirmed",
        start: "2026-04-23T08:30:00",
        end: "2026-04-23T09:01:00",
      }),
    ]);

    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("1");

    await vi.advanceTimersByTimeAsync(60000);
    await wrapper.vm.$nextTick();

    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("0");
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

  it("renders event columns for the selected day when day column mode is events", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "evt_a",
          title: "Alpha schedule",
          createdAt: "2026-04-02T00:00:00Z",
          start: new Date(2026, 3, 23, 10, 0, 0),
          end: new Date(2026, 3, 23, 12, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          id: "booking_evt_a",
          eventId: "evt_a",
          title: "Alpha booking",
          createdAt: "2026-04-02T00:00:00Z",
          start: new Date(2026, 3, 23, 10, 30, 0),
          end: new Date(2026, 3, 23, 11, 0, 0),
          isAvailabilityBlock: false,
        }),
        makeEvent({
          id: "booking_evt_b",
          eventId: "evt_b",
          title: "Beta booking",
          createdAt: "2026-04-01T00:00:00Z",
          start: new Date(2026, 3, 23, 11, 0, 0),
          end: new Date(2026, 3, 23, 11, 30, 0),
          isAvailabilityBlock: false,
        }),
        makeEvent({
          eventId: "evt_previous",
          title: "Previous availability",
          start: new Date(2026, 3, 22, 12, 0, 0),
          end: new Date(2026, 3, 22, 13, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      { initialView: "day", dayColumnMode: "events" },
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
          event: `
            <template #event="{ event, day, style }">
              <div
                data-test="booking-block"
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
    const selectedDate = calendarDateAttr(baseDate);

    expect(bodyColumns).toHaveLength(2);
    expect(bodyColumns.map((column) => column.attributes("data-date"))).toEqual([selectedDate, selectedDate]);
    expect(bodyColumns.map((column) => column.attributes("data-event-id"))).toEqual(["evt_b", "evt_a"]);
    expect(wrapper.get("[data-test='calendar-day-event-title']").text()).toBe("APRIL 23, 2026");
    expect(wrapper.get("[data-cal-time-grid] span.grid").attributes("style")).toContain("repeat(2");

    expect(bodyColumns[0].get("[data-test='booking-block']").attributes("data-event-id")).toBe("evt_b");
    expect(bodyColumns[1].get("[data-test='availability-block']").attributes("data-event-id")).toBe("evt_a");
    expect(bodyColumns[1].get("[data-test='booking-block']").attributes("data-event-id")).toBe("evt_a");
    expect(wrapper.find("[data-event-id='evt_previous']").exists()).toBe(false);
  });

  it("stretches sparse week event groups to fill the calendar", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "evt_sunday",
          title: "Sunday schedule",
          createdAt: "2026-04-01T00:00:00Z",
          start: new Date(2026, 3, 19, 9, 0, 0),
          end: new Date(2026, 3, 19, 10, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          eventId: "evt_late",
          title: "Late schedule",
          createdAt: "2026-04-02T00:00:00Z",
          start: new Date(2026, 3, 23, 10, 0, 0),
          end: new Date(2026, 3, 23, 12, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          id: "booking_evt_late",
          eventId: "evt_late",
          title: "Late booking",
          createdAt: "2026-04-02T00:00:00Z",
          start: new Date(2026, 3, 23, 10, 30, 0),
          end: new Date(2026, 3, 23, 11, 0, 0),
          isAvailabilityBlock: false,
        }),
        makeEvent({
          id: "booking_evt_early",
          eventId: "evt_early",
          title: "Early booking",
          createdAt: "2026-04-01T00:00:00Z",
          start: new Date(2026, 3, 23, 11, 0, 0),
          end: new Date(2026, 3, 23, 11, 30, 0),
          isAvailabilityBlock: false,
        }),
        makeEvent({
          eventId: "evt_friday",
          title: "Friday schedule",
          createdAt: "2026-04-03T00:00:00Z",
          start: new Date(2026, 3, 24, 10, 0, 0),
          end: new Date(2026, 3, 24, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      { initialView: "week", dayColumnMode: "events" },
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
          event: `
            <template #event="{ event, day, style }">
              <div
                data-test="booking-block"
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

    const selectedDate = localDateKey(baseDate);
    const emptyDate = localDateKey(new Date(2026, 3, 20));
    const headerDays = wrapper.findAll("[data-test='calendar-week-event-header-day']");
    const dayGroups = wrapper.findAll("[data-test='calendar-week-event-day-group']");
    const selectedHeader = wrapper.get(`[data-test='calendar-week-event-header-day'][data-date='${selectedDate}']`);
    const selectedGroup = wrapper.get(`[data-test='calendar-week-event-day-group'][data-date='${selectedDate}']`);
    const emptyHeader = wrapper.get(`[data-test='calendar-week-event-header-day'][data-date='${emptyDate}']`);
    const emptyGroup = wrapper.get(`[data-test='calendar-week-event-day-group'][data-date='${emptyDate}']`);
    const selectedColumns = selectedGroup.findAll("[data-test='calendar-week-event-column']");

    expect(headerDays).toHaveLength(7);
    expect(dayGroups).toHaveLength(7);
    expect(wrapper.get("[data-test='calendar-week-event-header-track']").attributes("style")).toContain("width: 100%");
    expect(wrapper.get("[data-cal-time-grid] span.relative").attributes("style")).toContain("width: 100%");
    expect(wrapper.get("[data-test='calendar-week-event-body-scroll']").classes()).toContain("overflow-x-auto");

    expect(selectedHeader.attributes("data-week-day-units")).toBe("2");
    expect(selectedHeader.attributes("data-week-day-base-width")).toBe("16%");
    expect(selectedHeader.attributes("style")).toBe(selectedGroup.attributes("style").replace(/ height: [^;]+;/, ""));
    expect(selectedGroup.attributes("style")).toContain("width: 25%");
    expect(emptyHeader.attributes("data-week-day-units")).toBe("1");
    expect(emptyHeader.attributes("data-week-day-base-width")).toBe("8%");
    expect(emptyGroup.attributes("style")).toContain("width: 12.5%");

    expect(selectedGroup.attributes("data-selected")).toBe("true");
    expect(selectedGroup.classes()).toContain("opacity-100");
    expect(dayGroups.filter((group) => group.attributes("data-selected") === "false").every((group) => group.classes().includes("opacity-30"))).toBe(true);

    expect(selectedColumns.map((column) => column.attributes("data-event-id"))).toEqual(["evt_early", "evt_late"]);
    expect(selectedColumns[0].get("[data-test='booking-block']").attributes("data-event-id")).toBe("evt_early");
    expect(selectedColumns[1].get("[data-test='availability-block']").attributes("data-event-id")).toBe("evt_late");
    expect(selectedColumns[1].get("[data-test='booking-block']").attributes("data-event-id")).toBe("evt_late");

    const emptyColumns = emptyGroup.findAll("[data-test='calendar-week-event-column']");
    expect(emptyColumns).toHaveLength(1);
    expect(emptyColumns[0].attributes("data-empty-column")).toBe("true");
  });

  it("uses exact eight-percent units when a dense week exceeds the calendar width", async () => {
    const makeDayEvents = (date, count, prefix) => Array.from({ length: count }, (_, index) => makeEvent({
      eventId: `${prefix}_${index + 1}`,
      title: `${prefix} ${index + 1}`,
      createdAt: `2026-04-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
      start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9 + index, 0, 0),
      end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10 + index, 0, 0),
      slot: "availability",
      isAvailabilityBlock: true,
    }));
    const fiveEventDate = new Date(2026, 3, 23);
    const twoEventDate = new Date(2026, 3, 24);
    const secondTwoEventDate = new Date(2026, 3, 25);
    const wrapper = await mountCalendar(
      [
        ...makeDayEvents(fiveEventDate, 5, "five"),
        ...makeDayEvents(twoEventDate, 2, "two"),
        ...makeDayEvents(secondTwoEventDate, 2, "second_two"),
      ],
      { initialView: "week", dayColumnMode: "events" },
    );

    const headerTrack = wrapper.get("[data-test='calendar-week-event-header-track']");
    const bodyTrack = wrapper.get("[data-cal-time-grid] span.relative");
    const fiveHeader = wrapper.get(`[data-test='calendar-week-event-header-day'][data-date='${localDateKey(fiveEventDate)}']`);
    const fiveGroup = wrapper.get(`[data-test='calendar-week-event-day-group'][data-date='${localDateKey(fiveEventDate)}']`);
    const twoGroup = wrapper.get(`[data-test='calendar-week-event-day-group'][data-date='${localDateKey(twoEventDate)}']`);
    const emptyGroup = wrapper.get(`[data-test='calendar-week-event-day-group'][data-date='${localDateKey(new Date(2026, 3, 19))}']`);
    const widthPercent = (element) => Number(element.attributes("style").match(/width:\s*([\d.]+)%/)?.[1]);

    expect(headerTrack.attributes("style")).toContain("width: 104%");
    expect(bodyTrack.attributes("style")).toContain("width: 104%");
    expect(fiveGroup.attributes("data-week-day-units")).toBe("5");
    expect(fiveGroup.attributes("data-week-day-base-width")).toBe("40%");
    expect(fiveHeader.attributes("style")).toBe(fiveGroup.attributes("style").replace(/ height: [^;]+;/, ""));
    expect(widthPercent(fiveGroup) * 1.04).toBeCloseTo(40);
    expect(twoGroup.attributes("data-week-day-units")).toBe("2");
    expect(twoGroup.attributes("data-week-day-base-width")).toBe("16%");
    expect(widthPercent(twoGroup) * 1.04).toBeCloseTo(16);
    expect(emptyGroup.attributes("data-week-day-units")).toBe("1");
    expect(emptyGroup.attributes("data-week-day-base-width")).toBe("8%");
    expect(widthPercent(emptyGroup) * 1.04).toBeCloseTo(8);
  });

  it("recalculates week widths from event columns left visible by filters", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "availability_1",
          start: new Date(2026, 3, 23, 9, 0, 0),
          end: new Date(2026, 3, 23, 10, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          eventId: "availability_2",
          start: new Date(2026, 3, 23, 10, 0, 0),
          end: new Date(2026, 3, 23, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          id: "visible_booking",
          eventId: "booking_1",
          start: new Date(2026, 3, 23, 12, 0, 0),
          end: new Date(2026, 3, 23, 13, 0, 0),
          isAvailabilityBlock: false,
        }),
      ],
      { initialView: "week", dayColumnMode: "events" },
    );
    const selectedDate = localDateKey(baseDate);
    const selectedGroup = () => wrapper.get(`[data-test='calendar-week-event-day-group'][data-date='${selectedDate}']`);

    expect(selectedGroup().attributes("data-week-day-units")).toBe("3");

    await openFilters(wrapper);
    await wrapper.get("[data-test='show-schedule-off']").trigger("click");
    await wrapper.vm.$nextTick();

    expect(selectedGroup().attributes("data-week-day-units")).toBe("1");
    expect(selectedGroup().attributes("data-week-day-base-width")).toBe("8%");
  });

  it("selects a clicked week event header date and rerenders the selected day", async () => {
    const targetDate = new Date(2026, 3, 24);
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "evt_selected",
          title: "Selected schedule",
          start: new Date(2026, 3, 23, 10, 0, 0),
          end: new Date(2026, 3, 23, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          eventId: "evt_target",
          title: "Target schedule",
          start: new Date(2026, 3, 24, 10, 0, 0),
          end: new Date(2026, 3, 24, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      { initialView: "week", dayColumnMode: "events" },
    );

    await wrapper
      .get(`[data-test='calendar-week-event-header-day'][data-date='${localDateKey(targetDate)}']`)
      .trigger("click");
    await wrapper.vm.$nextTick();

    const emittedDate = wrapper.emitted("date-selected")?.at(-1)?.[0];
    expect(localDateKey(emittedDate)).toBe(localDateKey(targetDate));
    expect(localDateKey(wrapper.emitted("update:focus-date")?.at(-1)?.[0])).toBe(localDateKey(targetDate));

    await wrapper.setProps({ focusDate: emittedDate });
    await wrapper.vm.$nextTick();

    const selectedGroup = wrapper.get("[data-test='calendar-week-event-day-group'][data-selected='true']");
    const targetColumn = selectedGroup.get("[data-test='calendar-week-event-column']");

    expect(selectedGroup.attributes("data-date")).toBe(localDateKey(targetDate));
    expect(targetColumn.attributes("data-event-id")).toBe("evt_target");
  });

  it("scrolls the week date header horizontally with wheel gestures", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "evt_week_scroll",
          title: "Week scroll schedule",
          start: new Date(2026, 3, 23, 10, 0, 0),
          end: new Date(2026, 3, 23, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      { initialView: "week", dayColumnMode: "events" },
    );

    const headerScroll = wrapper.get("[data-test='calendar-week-event-header-scroll']").element;
    const bodyScroll = wrapper.get("[data-test='calendar-week-event-body-scroll']").element;
    const makeScrollable = (element) => {
      Object.defineProperty(element, "clientWidth", { configurable: true, value: 100 });
      Object.defineProperty(element, "scrollWidth", { configurable: true, value: 280 });
      Object.defineProperty(element, "scrollLeft", {
        configurable: true,
        value: 0,
        writable: true,
      });
    };

    makeScrollable(headerScroll);
    makeScrollable(bodyScroll);

    await wrapper.get("[data-test='calendar-week-event-header-scroll']").trigger("wheel", {
      deltaX: 0,
      deltaY: 72,
    });

    expect(headerScroll.scrollLeft).toBe(72);
    expect(bodyScroll.scrollLeft).toBe(72);

    const targetDate = new Date(2026, 3, 24);
    await wrapper
      .get(`[data-test='calendar-week-event-header-day'][data-date='${localDateKey(targetDate)}']`)
      .trigger("click");

    expect(localDateKey(wrapper.emitted("date-selected")?.at(-1)?.[0])).toBe(localDateKey(targetDate));
    expect(headerScroll.scrollLeft).toBe(72);
    expect(bodyScroll.scrollLeft).toBe(72);
  });

  it("drags the week date header without treating the drag as a date click", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "evt_week_drag",
          title: "Week drag schedule",
          start: new Date(2026, 3, 23, 10, 0, 0),
          end: new Date(2026, 3, 23, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      { initialView: "week", dayColumnMode: "events" },
    );

    const header = wrapper.get("[data-test='calendar-week-event-header-scroll']");
    const headerScroll = header.element;
    const bodyScroll = wrapper.get("[data-test='calendar-week-event-body-scroll']").element;
    const makeScrollable = (element) => {
      Object.defineProperty(element, "clientWidth", { configurable: true, value: 100 });
      Object.defineProperty(element, "scrollWidth", { configurable: true, value: 280 });
      Object.defineProperty(element, "scrollLeft", {
        configurable: true,
        value: 0,
        writable: true,
      });
    };

    makeScrollable(headerScroll);
    makeScrollable(bodyScroll);

    await header.trigger("mousedown", { button: 0, clientX: 90 });
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 20, bubbles: true }));
    await wrapper.vm.$nextTick();

    expect(headerScroll.scrollLeft).toBe(70);
    expect(bodyScroll.scrollLeft).toBe(70);
    expect(header.classes()).toContain("cursor-grabbing");

    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    const targetDate = new Date(2026, 3, 24);
    const target = wrapper.get(
      `[data-test='calendar-week-event-header-day'][data-date='${localDateKey(targetDate)}']`,
    );
    await target.trigger("click");

    expect(wrapper.emitted("date-selected")).toBeUndefined();
    expect(headerScroll.scrollLeft).toBe(70);

    await target.trigger("mousedown", { button: 0, clientX: 40 });
    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    await target.trigger("click");

    expect(localDateKey(wrapper.emitted("date-selected")?.at(-1)?.[0])).toBe(localDateKey(targetDate));
    expect(headerScroll.scrollLeft).toBe(70);
  });

  it("does not stack same-time week bookings in different event columns", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          id: "week_booking_evt_a",
          eventId: "evt_a",
          title: "Alpha booking",
          start: new Date(2026, 3, 23, 12, 0, 0),
          end: new Date(2026, 3, 23, 12, 30, 0),
          isAvailabilityBlock: false,
        }),
        makeEvent({
          id: "week_booking_evt_b",
          eventId: "evt_b",
          title: "Beta booking",
          start: new Date(2026, 3, 23, 12, 0, 0),
          end: new Date(2026, 3, 23, 12, 30, 0),
          isAvailabilityBlock: false,
        }),
      ],
      { initialView: "week", dayColumnMode: "events" },
      {
        slots: {
          event: `
            <template #event="{ event, style }">
              <div data-test="booking-block" :data-event-id="event.eventId" :style="style">{{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    const selectedGroup = wrapper.get(`[data-test='calendar-week-event-day-group'][data-date='${localDateKey(baseDate)}']`);
    const blocks = selectedGroup.findAll("[data-test='booking-block']");
    const topValues = blocks.map((block) => block.attributes("style")?.match(/top:\s*([\d.]+)px/)?.[1]);

    expect(blocks).toHaveLength(2);
    expect(blocks.map((block) => block.attributes("data-event-id"))).toEqual(["evt_a", "evt_b"]);
    expect(topValues[0]).toBe(topValues[1]);
  });

  it("still stacks same-time week bookings in the same event column", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          id: "week_booking_evt_a_1",
          eventId: "evt_a",
          title: "Alpha booking 1",
          start: new Date(2026, 3, 23, 12, 0, 0),
          end: new Date(2026, 3, 23, 12, 30, 0),
          isAvailabilityBlock: false,
        }),
        makeEvent({
          id: "week_booking_evt_a_2",
          eventId: "evt_a",
          title: "Alpha booking 2",
          start: new Date(2026, 3, 23, 12, 0, 0),
          end: new Date(2026, 3, 23, 12, 30, 0),
          isAvailabilityBlock: false,
        }),
      ],
      { initialView: "week", dayColumnMode: "events" },
      {
        slots: {
          event: `
            <template #event="{ event, style }">
              <div data-test="booking-block" :data-booking-id="event.id" :style="style">{{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    const selectedGroup = wrapper.get(`[data-test='calendar-week-event-day-group'][data-date='${localDateKey(baseDate)}']`);
    const blocks = selectedGroup.findAll("[data-test='booking-block']");
    const topValues = blocks.map((block) => Number(block.attributes("style")?.match(/top:\s*([\d.]+)px/)?.[1]));

    expect(blocks).toHaveLength(2);
    expect(topValues[1]).toBeGreaterThan(topValues[0]);
  });

  it("keeps the week scroll position and shows the now line when the week includes today", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 23, 12, 15, 0));
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

    try {
      const wrapper = await mountCalendar(
        [
          makeEvent({
            eventId: "evt_today_week",
            title: "Today week schedule",
            start: new Date(2026, 3, 23, 10, 0, 0),
            end: new Date(2026, 3, 23, 11, 0, 0),
            slot: "availability",
            isAvailabilityBlock: true,
          }),
        ],
        { focusDate: new Date(2026, 3, 23), initialView: "week", dayColumnMode: "events" },
      );
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(wrapper.get("[data-test='calendar-week-event-header-day'][data-selected='true']").attributes("data-date")).toBe(localDateKey(new Date(2026, 3, 23)));
      expect(wrapper.find("[data-test='calendar-now-line']").exists()).toBe(true);

      const otherWeek = await mountCalendar(
        [],
        { focusDate: new Date(2026, 4, 1), initialView: "week", dayColumnMode: "events" },
      );
      await otherWeek.vm.$nextTick();
      expect(otherWeek.find("[data-test='calendar-now-line']").exists()).toBe(false);
    } finally {
      window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it("renders a scrollable mobile week strip while the day grid stays on the selected date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 23, 9, 0, 0));
    setWindowWidth(390);

    const todayDate = new Date(2026, 3, 23);
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "evt_today",
          title: "Today schedule",
          start: new Date(2026, 3, 23, 10, 0, 0),
          end: new Date(2026, 3, 23, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          eventId: "evt_tomorrow",
          title: "Tomorrow schedule",
          start: new Date(2026, 3, 24, 10, 0, 0),
          end: new Date(2026, 3, 24, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      {
        focusDate: new Date(2026, 3, 20),
        initialView: "day",
        dayColumnMode: "events",
      },
    );
    await wrapper.vm.$nextTick();

    const strip = wrapper.get("[data-test='calendar-mobile-day-strip']");
    const stripDates = wrapper.findAll("[data-test='calendar-mobile-day-strip-date']");
    const bodyColumns = wrapper.findAll("[data-cal-time-grid] span.grid > div[data-date]");
    const selectedDate = stripDates.find((button) => button.attributes("data-selected") === "true");

    expect(strip.exists()).toBe(true);
    expect(stripDates).toHaveLength(7);
    expect(stripDates.every((button) => button.classes().includes("min-w-[25%]"))).toBe(true);
    expect(selectedDate?.attributes("data-date")).toBe(localDateKey(todayDate));
    expect(selectedDate?.attributes("data-today")).toBe("true");
    expect(wrapper.find("[data-test='calendar-day-event-title']").exists()).toBe(false);

    expect(bodyColumns).toHaveLength(1);
    expect(bodyColumns[0].attributes("data-date")).toBe(localDateKey(todayDate));
    expect(bodyColumns[0].attributes("data-event-id")).toBe("evt_today");
  });

  it("fits all mobile Day event columns equally within the calendar width", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 23, 9, 0, 0));
    setWindowWidth(390);

    const events = Array.from({ length: 5 }, (_, index) => [
      makeEvent({
        id: `availability_${index + 1}`,
        eventId: `evt_${index + 1}`,
        title: `Availability ${index + 1} with a long title`,
        start: new Date(2026, 3, 23, 10, 0, 0),
        end: new Date(2026, 3, 23, 12, 0, 0),
        slot: "availability",
        isAvailabilityBlock: true,
      }),
      makeEvent({
        id: `booking_${index + 1}`,
        eventId: `evt_${index + 1}`,
        title: `Booking ${index + 1} with a long title`,
        start: new Date(2026, 3, 23, 10, 30, 0),
        end: new Date(2026, 3, 23, 11, 0, 0),
        isAvailabilityBlock: false,
      }),
    ]).flat();

    const wrapper = await mountCalendar(
      events,
      { initialView: "day", dayColumnMode: "events" },
      {
        slots: {
          "event-availability": `
            <template #event-availability="{ event, style }">
              <div data-test="mobile-availability" :data-event-id="event.eventId" :style="style">
                {{ event.title }}
              </div>
            </template>
          `,
          event: `
            <template #event="{ event, style, onClick }">
              <button
                data-test="mobile-booking"
                :data-event-id="event.eventId"
                :style="style"
                @click="onClick(event)"
              >
                {{ event.title }}
              </button>
            </template>
          `,
        },
      },
    );

    const track = wrapper.get("[data-cal-time-grid] span.grid");
    const bodyColumns = wrapper.findAll("[data-cal-time-grid] span.grid > div[data-event-id]");

    expect(bodyColumns).toHaveLength(5);
    expect(bodyColumns.every((column) => column.classes().includes("min-w-0"))).toBe(true);
    expect(track.attributes("style")).toContain("grid-template-columns: repeat(5, minmax(0, 1fr))");
    expect(track.attributes("style")).toContain("width: 100%");
    expect(track.attributes("style")).toContain("min-width: 0");
    expect(track.attributes("style")).not.toContain("7.5rem");
    expect(wrapper.get("[data-test='calendar-week-event-body-scroll']").classes()).toContain("overflow-x-hidden");
    expect(wrapper.findAll("[data-test='mobile-availability']")).toHaveLength(5);
    expect(wrapper.findAll("[data-test='mobile-booking']")).toHaveLength(5);

    await wrapper.get("[data-test='mobile-booking']").trigger("click");
    expect(wrapper.findComponent({ name: "CalendarEventDetailsPopup" }).exists()).toBe(true);
  });

  it("uses month and year for the mobile day calendar toggle title", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 23, 9, 0, 0));
    setWindowWidth(390);

    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "evt_mobile_title",
          title: "Mobile title schedule",
          start: new Date(2026, 3, 23, 10, 0, 0),
          end: new Date(2026, 3, 23, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      {
        initialView: "day",
        dayColumnMode: "events",
      },
    );

    expect(wrapper.get("[data-test='calendar-mobile-month-title']").text()).toBe("APRIL 2026");
    expect(wrapper.get("[data-test='calendar-desktop-title']").classes()).toContain("hidden");
    expect(wrapper.find("[data-test='calendar-day-event-title']").exists()).toBe(false);
  });

  it("defaults mobile event-column mode to Day and hides the view selector", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 23, 9, 0, 0));
    setWindowWidth(390);

    const todayDate = new Date(2026, 3, 23);
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "evt_today",
          title: "Today schedule",
          start: new Date(2026, 3, 23, 10, 0, 0),
          end: new Date(2026, 3, 23, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      {
        focusDate: new Date(2026, 3, 20),
        initialView: "week",
        dayColumnMode: "events",
      },
    );

    await wrapper.vm.$nextTick();

    const selectedDate = wrapper.findAll("[data-test='calendar-mobile-day-strip-date']")
      .find((button) => button.attributes("data-selected") === "true");
    const bodyColumns = wrapper.findAll("[data-cal-time-grid] span.grid > div[data-date]");
    const emittedDate = wrapper.emitted("date-selected")?.at(-1)?.[0];

    expect(wrapper.emitted("view-changed")?.at(-1)).toEqual(["day"]);
    expect(wrapper.attributes("data-view")).toBe("day");
    expect(wrapper.find("[data-test='calendar-mobile-view-selector']").exists()).toBe(false);
    expect(localDateKey(emittedDate)).toBe(localDateKey(todayDate));
    expect(selectedDate?.attributes("data-date")).toBe(localDateKey(todayDate));
    expect(bodyColumns).toHaveLength(1);
    expect(bodyColumns[0].attributes("data-date")).toBe(localDateKey(todayDate));
  });

  it("switches to Day when the event calendar crosses into the mobile breakpoint", async () => {
    const wrapper = await mountCalendar([], {
      initialView: "week",
      dayColumnMode: "events",
    });

    expect(wrapper.attributes("data-view")).toBe("week");

    setWindowWidth(390);
    await wrapper.vm.$nextTick();

    expect(wrapper.attributes("data-view")).toBe("day");
    expect(wrapper.emitted("view-changed")?.at(-1)).toEqual(["day"]);
    expect(wrapper.find("[data-test='calendar-mobile-view-selector']").exists()).toBe(false);
  });

  it("selects a tapped mobile week-strip date and rerenders the single-day grid", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 23, 9, 0, 0));
    setWindowWidth(390);

    const todayDate = new Date(2026, 3, 23);
    const targetDate = new Date(2026, 3, 24);
    const wrapper = await mountCalendar(
      [
        makeEvent({
          eventId: "evt_today",
          title: "Today schedule",
          start: new Date(2026, 3, 23, 10, 0, 0),
          end: new Date(2026, 3, 23, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          eventId: "evt_target",
          title: "Target schedule",
          start: new Date(2026, 3, 24, 10, 0, 0),
          end: new Date(2026, 3, 24, 11, 0, 0),
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      {
        focusDate: todayDate,
        initialView: "day",
        dayColumnMode: "events",
      },
    );
    await wrapper.vm.$nextTick();

    const targetButton = wrapper.findAll("[data-test='calendar-mobile-day-strip-date']")
      .find((button) => button.attributes("data-date") === localDateKey(targetDate));
    await targetButton.trigger("click");
    await wrapper.vm.$nextTick();

    const emittedDate = wrapper.emitted("date-selected")?.at(-1)?.[0];
    await wrapper.setProps({ focusDate: emittedDate });
    await wrapper.vm.$nextTick();

    const stripDates = wrapper.findAll("[data-test='calendar-mobile-day-strip-date']");
    const selectedDate = stripDates.find((button) => button.attributes("data-selected") === "true");
    const todayStripDate = stripDates.find((button) => button.attributes("data-date") === localDateKey(todayDate));
    const bodyColumns = wrapper.findAll("[data-cal-time-grid] span.grid > div[data-date]");

    expect(localDateKey(emittedDate)).toBe(localDateKey(targetDate));
    expect(localDateKey(wrapper.emitted("update:focus-date")?.at(-1)?.[0])).toBe(localDateKey(targetDate));
    expect(selectedDate?.attributes("data-date")).toBe(localDateKey(targetDate));
    expect(todayStripDate?.attributes("data-today")).toBe("true");
    expect(todayStripDate?.attributes("data-selected")).toBe("false");
    expect(bodyColumns).toHaveLength(1);
    expect(bodyColumns[0].attributes("data-date")).toBe(localDateKey(targetDate));
    expect(bodyColumns[0].attributes("data-event-id")).toBe("evt_target");
  });

  it("renders one blank selected-day grid when no day event columns qualify", async () => {
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
      { initialView: "day", dayColumnMode: "events" },
    );

    const bodyColumns = wrapper.findAll("[data-cal-time-grid] span.grid > div[data-date]");

    expect(bodyColumns).toHaveLength(1);
    expect(bodyColumns[0].attributes("data-date")).toBe(calendarDateAttr(baseDate));
    expect(bodyColumns[0].attributes("data-empty-column")).toBe("true");
  });

  it("does not stack same-time bookings that belong to different event columns", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          id: "booking_evt_a",
          eventId: "evt_a",
          title: "Alpha booking",
          start: new Date(2026, 3, 23, 12, 0, 0),
          end: new Date(2026, 3, 23, 12, 30, 0),
          isAvailabilityBlock: false,
        }),
        makeEvent({
          id: "booking_evt_b",
          eventId: "evt_b",
          title: "Beta booking",
          start: new Date(2026, 3, 23, 12, 0, 0),
          end: new Date(2026, 3, 23, 12, 30, 0),
          isAvailabilityBlock: false,
        }),
      ],
      { initialView: "day", dayColumnMode: "events" },
      {
        slots: {
          event: `
            <template #event="{ event, style }">
              <div data-test="booking-block" :data-event-id="event.eventId" :style="style">{{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    const blocks = wrapper.findAll("[data-test='booking-block']");
    const topValues = blocks.map((block) => block.attributes("style")?.match(/top:\s*([\d.]+)px/)?.[1]);

    expect(blocks).toHaveLength(2);
    expect(blocks.map((block) => block.attributes("data-event-id"))).toEqual(["evt_a", "evt_b"]);
    expect(topValues[0]).toBe(topValues[1]);
  });

  it("still stacks same-time bookings within the same event column", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          id: "booking_evt_a_1",
          eventId: "evt_a",
          title: "Alpha booking 1",
          start: new Date(2026, 3, 23, 12, 0, 0),
          end: new Date(2026, 3, 23, 12, 30, 0),
          isAvailabilityBlock: false,
        }),
        makeEvent({
          id: "booking_evt_a_2",
          eventId: "evt_a",
          title: "Alpha booking 2",
          start: new Date(2026, 3, 23, 12, 0, 0),
          end: new Date(2026, 3, 23, 12, 30, 0),
          isAvailabilityBlock: false,
        }),
      ],
      { initialView: "day", dayColumnMode: "events" },
      {
        slots: {
          event: `
            <template #event="{ event, style }">
              <div data-test="booking-block" :data-booking-id="event.id" :style="style">{{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    const blocks = wrapper.findAll("[data-test='booking-block']");
    const topValues = blocks.map((block) => Number(block.attributes("style")?.match(/top:\s*([\d.]+)px/)?.[1]));

    expect(wrapper.findAll("[data-cal-time-grid] span.grid > div[data-date]")).toHaveLength(1);
    expect(blocks).toHaveLength(2);
    expect(topValues[1]).toBeGreaterThan(topValues[0]);
  });

  it("emits view-changed when switching calendar views", async () => {
    const wrapper = await mountCalendar([]);
    const viewButton = (label) => wrapper.findAll("button").find((button) => (
      button.text().trim().toLowerCase() === label
      || button.text().trim().toLowerCase() === `common_${label}`
    ));

    await viewButton("day").trigger("click");
    await viewButton("week").trigger("click");
    await viewButton("month").trigger("click");

    expect(wrapper.emitted("view-changed")).toEqual([["day"], ["week"], ["month"]]);
  });

  it("smoothly reveals the selected date when desktop switches from Day to Week", async () => {
    setWindowWidth(1280);

    const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect;
    const originalScrollTo = window.HTMLElement.prototype.scrollTo;
    const originalClientWidth = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, "clientWidth");
    const originalScrollWidth = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, "scrollWidth");
    const scrollTo = vi.fn(function scrollToWeekDate({ left }) {
      this.scrollLeft = left;
    });

    window.HTMLElement.prototype.getBoundingClientRect = function getCalendarRect() {
      if (this.getAttribute?.("data-test") === "calendar-week-event-header-scroll") {
        return { left: 0, right: 400, top: 0, bottom: 64, width: 400, height: 64, x: 0, y: 0, toJSON: () => ({}) };
      }
      if (this.getAttribute?.("data-test") === "calendar-week-event-header-day" && this.getAttribute("data-selected") === "true") {
        return { left: 600, right: 800, top: 0, bottom: 64, width: 200, height: 64, x: 600, y: 0, toJSON: () => ({}) };
      }
      return originalGetBoundingClientRect.call(this);
    };
    Object.defineProperty(window.HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        if (this.getAttribute?.("data-test") === "calendar-week-event-header-scroll") return 400;
        return originalClientWidth?.get?.call(this) ?? 0;
      },
    });
    Object.defineProperty(window.HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        if (this.getAttribute?.("data-test") === "calendar-week-event-header-scroll") return 1400;
        return originalScrollWidth?.get?.call(this) ?? 0;
      },
    });
    window.HTMLElement.prototype.scrollTo = scrollTo;

    try {
      const wrapper = await mountCalendar(
        [],
        { initialView: "day", dayColumnMode: "events" },
      );
      const viewButton = (label) => wrapper.findAll("button").find((button) => (
        button.text().trim().toLowerCase() === label
        || button.text().trim().toLowerCase() === `common_${label}`
      ));

      await viewButton("week").trigger("click");
      await wrapper.vm.$nextTick();

      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenCalledWith({ left: 400, behavior: "smooth" });
      expect(wrapper.get("[data-test='calendar-week-event-header-day'][data-selected='true']").attributes("data-date")).toBe(localDateKey(baseDate));
    } finally {
      window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
      window.HTMLElement.prototype.scrollTo = originalScrollTo;
      if (originalClientWidth) Object.defineProperty(window.HTMLElement.prototype, "clientWidth", originalClientWidth);
      else delete window.HTMLElement.prototype.clientWidth;
      if (originalScrollWidth) Object.defineProperty(window.HTMLElement.prototype, "scrollWidth", originalScrollWidth);
      else delete window.HTMLElement.prototype.scrollWidth;
    }
  });

  it("smoothly reveals today when Today is clicked in desktop Week view", async () => {
    setWindowWidth(1280);

    const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect;
    const originalScrollTo = window.HTMLElement.prototype.scrollTo;
    const originalClientWidth = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, "clientWidth");
    const originalScrollWidth = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, "scrollWidth");
    const scrollTo = vi.fn(function scrollToToday({ left }) {
      this.scrollLeft = left;
    });

    window.HTMLElement.prototype.getBoundingClientRect = function getCalendarRect() {
      if (this.getAttribute?.("data-test") === "calendar-week-event-header-scroll") {
        return { left: 0, right: 400, top: 0, bottom: 64, width: 400, height: 64, x: 0, y: 0, toJSON: () => ({}) };
      }
      if (this.getAttribute?.("data-test") === "calendar-week-event-header-day" && this.getAttribute("data-selected") === "true") {
        return { left: 600, right: 800, top: 0, bottom: 64, width: 200, height: 64, x: 600, y: 0, toJSON: () => ({}) };
      }
      return originalGetBoundingClientRect.call(this);
    };
    Object.defineProperty(window.HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        if (this.getAttribute?.("data-test") === "calendar-week-event-header-scroll") return 400;
        return originalClientWidth?.get?.call(this) ?? 0;
      },
    });
    Object.defineProperty(window.HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        if (this.getAttribute?.("data-test") === "calendar-week-event-header-scroll") return 1400;
        return originalScrollWidth?.get?.call(this) ?? 0;
      },
    });
    window.HTMLElement.prototype.scrollTo = scrollTo;

    try {
      const wrapper = await mountCalendar(
        [],
        {
          focusDate: new Date(2026, 4, 7),
          initialView: "week",
          dayColumnMode: "events",
        },
      );

      await wrapper.get("[data-main-today]").trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted("date-selected")?.at(-1)?.[0]).toEqual(new Date(2026, 3, 23, 9, 0, 0));
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenCalledWith({ left: 400, behavior: "smooth" });
      expect(wrapper.get("[data-test='calendar-week-event-header-day'][data-selected='true']").attributes("data-today")).toBe("true");
    } finally {
      window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
      window.HTMLElement.prototype.scrollTo = originalScrollTo;
      if (originalClientWidth) Object.defineProperty(window.HTMLElement.prototype, "clientWidth", originalClientWidth);
      else delete window.HTMLElement.prototype.clientWidth;
      if (originalScrollWidth) Object.defineProperty(window.HTMLElement.prototype, "scrollWidth", originalScrollWidth);
      else delete window.HTMLElement.prototype.scrollWidth;
    }
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

  it("keeps month availability in one bottom summary and counts remaining schedules", async () => {
    const wrapper = await mountCalendar(
      [
        makeEvent({
          id: "availability_block",
          eventId: "event_1",
          title: "First availability",
          start: "2026-04-23T10:00:00",
          end: "2026-04-23T11:00:00",
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          id: "availability_block_duplicate",
          eventId: "event_1",
          title: "First availability",
          start: "2026-04-23T12:00:00",
          end: "2026-04-23T13:00:00",
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          id: "availability_block_second",
          eventId: "event_2",
          title: "Second availability",
          start: "2026-04-23T14:00:00",
          end: "2026-04-23T15:00:00",
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          id: "availability_block_third",
          eventId: "event_3",
          title: "Third availability",
          start: "2026-04-23T16:00:00",
          end: "2026-04-23T17:00:00",
          slot: "availability",
          isAvailabilityBlock: true,
        }),
        makeEvent({
          id: "month_booking",
          eventId: "event_1",
          title: "Month booking",
          start: "2026-04-23T10:30:00",
          end: "2026-04-23T11:00:00",
          slot: "event",
          isAvailabilityBlock: false,
        }),
      ],
      { initialView: "month" },
      {
        slots: {
          "event-availability": `
            <template #event-availability="{ event, view }">
              <div data-test="month-availability" :data-event-id="event.eventId">{{ view }} {{ event.title }}</div>
            </template>
          `,
          event: `
            <template #event="{ event }">
              <div data-test="month-booking">{{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    let summary = wrapper.get("[data-test='calendar-month-availability-summary']");
    expect(summary.attributes("data-availability-count")).toBe("3");
    expect(summary.findAll("[data-test='month-availability']")).toHaveLength(1);
    expect(summary.get("[data-test='month-availability']").attributes("data-event-id")).toBe("event_1");
    expect(summary.get("[data-test='calendar-month-availability-more']").text()).toBe("+2");
    const booking = wrapper.get("[data-test='month-booking']");
    expect(booking.text()).toBe("Month booking");
    expect(booking.element.closest("[data-test='calendar-month-bookings']")).not.toBeNull();
    expect(summary.element.closest("[data-test='calendar-month-bookings']")).toBeNull();

    const cell = summary.element.closest("button[data-date]");
    const dateLabel = cell.querySelector("[data-test='calendar-month-date-label']");
    const bookingContent = cell.querySelector("[data-test='calendar-month-bookings'] > div");
    cell.style.padding = "0px";
    dateLabel.style.marginBottom = "0px";
    Object.defineProperty(cell, "clientHeight", { configurable: true, value: 120 });
    Object.defineProperty(dateLabel, "offsetHeight", { configurable: true, value: 20 });
    Object.defineProperty(bookingContent, "scrollHeight", { configurable: true, value: 48 });

    wrapper.vm.recalculateMonthAvailabilityLayout();
    await wrapper.vm.$nextTick();

    summary = wrapper.get("[data-test='calendar-month-availability-summary']");
    expect(summary.attributes("data-visible-availability-count")).toBe("2");
    expect(summary.findAll("[data-test='month-availability']")).toHaveLength(2);
    expect(summary.findAll("[data-test='month-availability']").map((marker) => marker.attributes("data-event-id"))).toEqual([
      "event_1",
      "event_2",
    ]);
    expect(summary.get("[data-test='calendar-month-availability-more']").text()).toBe("+1");
  });

  it("shows hidden month booking counts on the last booking that fits", async () => {
    const bookings = Array.from({ length: 5 }, (_, index) => makeEvent({
      id: `month_fit_booking_${index + 1}`,
      eventId: `month_fit_event_${index + 1}`,
      title: `Month fit booking ${index + 1}`,
      start: `2026-04-23T${10 + index}:00:00`,
      end: `2026-04-23T${10 + index}:30:00`,
      slot: "event",
      isAvailabilityBlock: false,
    }));
    const wrapper = await mountCalendar(
      [
        ...bookings,
        makeEvent({
          id: "month_fit_availability",
          eventId: "month_fit_availability",
          title: "Month fit availability",
          start: "2026-04-23T09:00:00",
          end: "2026-04-23T17:00:00",
          slot: "availability",
          isAvailabilityBlock: true,
        }),
      ],
      { initialView: "month" },
      {
        slots: {
          event: `
            <template #event="{ event }">
              <div data-test="month-fit-booking" :data-booking-id="event.id">{{ event.title }}</div>
            </template>
          `,
          "event-availability": `
            <template #event-availability="{ event }">
              <div data-test="month-fit-availability">{{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    const dayButton = findMonthDayButton(wrapper, 23);
    const bookingArea = dayButton.get("[data-test='calendar-month-bookings']");
    const cell = dayButton.element;
    const dateLabel = cell.querySelector("[data-test='calendar-month-date-label']");
    Object.defineProperty(bookingArea.element, "clientHeight", { configurable: true, value: 48 });
    Object.defineProperty(cell, "clientHeight", { configurable: true, value: 120 });
    Object.defineProperty(dateLabel, "offsetHeight", { configurable: true, value: 20 });

    wrapper.vm.recalculateMonthAvailabilityLayout();
    await wrapper.vm.$nextTick();

    const measuredBookingArea = dayButton.get("[data-test='calendar-month-bookings']");
    const visibleRows = measuredBookingArea.findAll("[data-test='calendar-month-booking-row']");
    expect(wrapper.findAll("[data-test='calendar-month-week-row']").every((row) => (
      row.classes().includes("min-h-0") && row.classes().includes("overflow-hidden")
    ))).toBe(true);
    expect(dayButton.classes()).toContain("min-h-0");
    expect(measuredBookingArea.attributes("data-booking-count")).toBe("5");
    expect(measuredBookingArea.attributes("data-visible-booking-count")).toBe("2");
    expect(visibleRows).toHaveLength(2);
    expect(visibleRows[1].get("[data-test='calendar-month-booking-more']").text()).toBe("+3");
    expect(visibleRows[0].find("[data-test='calendar-month-booking-more']").exists()).toBe(false);

    await dayButton.trigger("click");
    const overlay = wrapper.get("[data-test='calendar-month-date-overlay']");
    expect(overlay.get("[data-test='calendar-month-overlay-bookings']").findAll("[data-test='month-fit-booking']")).toHaveLength(5);
  });

  it("opens a desktop month date overlay with every booking and availability", async () => {
    setWindowWidth(1280);
    const wrapper = await mountCalendar(
      [
        makeEvent({
          id: "month_booking_one",
          eventId: "event_1",
          title: "First booking",
          start: "2026-04-23T10:00:00",
          end: "2026-04-23T10:30:00",
          slot: "event",
          isAvailabilityBlock: false,
        }),
        makeEvent({
          id: "month_booking_two",
          eventId: "event_2",
          title: "Second booking",
          start: "2026-04-23T11:00:00",
          end: "2026-04-23T11:30:00",
          slot: "event",
          isAvailabilityBlock: false,
        }),
        ...["event_1", "event_2", "event_3"].map((eventId, index) => makeEvent({
          id: `availability_${eventId}`,
          eventId,
          title: `Availability ${index + 1}`,
          start: `2026-04-23T${12 + index}:00:00`,
          end: `2026-04-23T${13 + index}:00:00`,
          slot: "availability",
          isAvailabilityBlock: true,
        })),
      ],
      { initialView: "month" },
      {
        slots: {
          event: `
            <template #event="{ event, onClick }">
              <div data-test="overlay-booking-marker" :data-event-id="event.id" @click.stop="onClick(event)">{{ event.title }}</div>
            </template>
          `,
          "event-availability": `
            <template #event-availability="{ event }">
              <div data-test="overlay-availability-marker" :data-event-id="event.eventId">{{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    const monthView = wrapper.get("[data-test='calendar-month-view']").element;
    const dayButton = findMonthDayButton(wrapper, 23);
    const dateCellCount = wrapper.findAll("button[data-date]").length;
    Object.defineProperty(monthView, "clientWidth", { configurable: true, value: 700 });
    Object.defineProperty(monthView, "clientHeight", { configurable: true, value: 500 });
    monthView.getBoundingClientRect = () => ({ left: 0, top: 0, width: 700, height: 500, right: 700, bottom: 500 });
    dayButton.element.getBoundingClientRect = () => ({ left: 100, top: 100, width: 100, height: 100, right: 200, bottom: 200 });

    await dayButton.trigger("click");
    await wrapper.vm.$nextTick();

    let overlay = wrapper.get("[data-test='calendar-month-date-overlay']");
    expect(overlay.attributes("data-date")).toBe("2026-04-23");
    expect(overlay.get("[data-test='calendar-month-overlay-date']").text()).toBe("23");
    expect(overlay.get("[data-test='calendar-month-overlay-bookings']").findAll("[data-test='overlay-booking-marker']")).toHaveLength(2);
    expect(overlay.get("[data-test='calendar-month-overlay-availabilities']").findAll("[data-test='overlay-availability-marker']")).toHaveLength(3);
    expect(Number.parseFloat(overlay.attributes("style").match(/width:\s*([\d.]+)px/)?.[1])).toBeGreaterThan(100);
    expect(Number.parseFloat(overlay.attributes("style").match(/height:\s*([\d.]+)px/)?.[1])).toBeGreaterThan(100);
    expect(wrapper.findAll("button[data-date]")).toHaveLength(dateCellCount);

    await overlay.get("[data-test='calendar-month-overlay-close']").trigger("click");
    expect(wrapper.find("[data-test='calendar-month-date-overlay']").exists()).toBe(false);

    await dayButton.trigger("click");
    overlay = wrapper.get("[data-test='calendar-month-date-overlay']");
    await overlay.get("[data-test='overlay-booking-marker']").trigger("click");
    expect(wrapper.find("[data-test='calendar-month-date-overlay']").exists()).toBe(false);
    expect(wrapper.get("[data-test='event-details']").text()).toBe("First booking");
  });

  it("opens and toggles the desktop month overlay for availability-only dates", async () => {
    setWindowWidth(1280);
    const wrapper = await mountCalendar(
      [
        makeEvent({
          id: "availability_only_desktop",
          eventId: "availability_only_desktop",
          title: "Availability only",
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
            <template #event-availability="{ event }">
              <div data-test="availability-only-marker">{{ event.title }}</div>
            </template>
          `,
        },
      },
    );

    const dayButton = findMonthDayButton(wrapper, 23);
    const monthView = wrapper.get("[data-test='calendar-month-view']").element;
    Object.defineProperty(monthView, "clientWidth", { configurable: true, value: 700 });
    Object.defineProperty(monthView, "clientHeight", { configurable: true, value: 500 });
    monthView.getBoundingClientRect = () => ({ left: 0, top: 0, width: 700, height: 500, right: 700, bottom: 500 });
    dayButton.element.getBoundingClientRect = () => ({ left: 100, top: 100, width: 100, height: 180, right: 200, bottom: 280 });

    await dayButton.trigger("click");
    await wrapper.vm.$nextTick();

    const overlay = wrapper.get("[data-test='calendar-month-date-overlay']");
    expect(overlay.findAll("[data-test='availability-only-marker']")).toHaveLength(1);
    expect(overlay.findAll("[data-test='calendar-month-overlay-bookings'] > *")).toHaveLength(0);
    expect(overlay.attributes("style")).toContain("width: 194.4px");
    expect(overlay.attributes("style")).toContain("height: 180px");

    await dayButton.trigger("click");
    expect(wrapper.find("[data-test='calendar-month-date-overlay']").exists()).toBe(false);
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

  it("forwards mobile schedule card preview actions and closes the mobile popup", async () => {
    const bookingScheduleEvents = [
      makeEvent({
        eventId: "evt_mobile_view_card",
        title: "Mobile View Card Schedule",
        isAvailabilityBlock: false,
      }),
    ];
    const wrapper = await mountCalendar([], {
      bookingScheduleEvents,
      showBookingScheduleList: true,
    });

    await openMobilePopup(wrapper);
    await wrapper.get("[data-test='mobile-schedule-view-card']").trigger("click");

    expect(wrapper.emitted("view-schedule-card")).toEqual([[bookingScheduleEvents[0]]]);
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
