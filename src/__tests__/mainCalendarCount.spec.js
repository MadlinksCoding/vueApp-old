import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

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
    template: "<div />",
  },
}));

vi.mock("@/components/calendar/CalendarMobilePopupContent.vue", () => ({
  default: {
    name: "CalendarMobilePopupContent",
    template: "<div />",
  },
}));

vi.mock("@/components/calendar/CalendarEventDetailsPopup.vue", () => ({
  default: {
    name: "CalendarEventDetailsPopup",
    template: "<div />",
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

function makeEvent(overrides = {}) {
  return {
    id: overrides.id || `${overrides.eventId || "event"}_${overrides.start || "start"}`,
    eventId: overrides.eventId || "event_1",
    title: "Event",
    start: overrides.start || "2026-04-23T10:00:00Z",
    end: overrides.end || "2026-04-23T11:00:00Z",
    eventCallType: overrides.eventCallType || "video",
    type: overrides.type || "1on1-call",
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

async function mountCalendar(events) {
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
    },
  });
}

async function openFilters(wrapper) {
  await wrapper.get("[data-test='all-events-count']").trigger("click");
}

describe("MainCalendar all events count", () => {
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

  it("ignores draft preview events", async () => {
    const wrapper = await mountCalendar([
      makeEvent({ eventId: "video_1", eventCallType: "video" }),
      makeEvent({ eventId: "draft_1", eventCallType: "video", isDraftPreview: true }),
    ]);

    expect(wrapper.get("[data-test='all-events-count']").text()).toBe("1");
  });
});
