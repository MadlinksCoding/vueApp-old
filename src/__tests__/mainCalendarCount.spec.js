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
    props: ["view", "eventsData", "canCreateEvents"],
    emits: ["join-click", "event-click", "menu-action", "open-new-events"],
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

async function mountCalendar(events, extraProps = {}) {
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
  });
}

async function openFilters(wrapper) {
  await wrapper.get("[data-test='all-events-count']").trigger("click");
}

async function openMobilePopup(wrapper) {
  const mobileActions = wrapper.findAll(".cursor-pointer.flex.xl\\:hidden");
  await mobileActions[mobileActions.length - 1].trigger("click");
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
