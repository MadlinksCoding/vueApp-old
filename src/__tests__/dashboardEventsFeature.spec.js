import { mount } from "@vue/test-utils";
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
    state: {
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
    },
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
}));

vi.mock("@/components/calendar/MainCalendar.vue", () => ({
  default: {
    name: "MainCalendar",
    template: "<div class='main-calendar-stub'><slot /></div>",
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
    emits: ["join-click", "reply-click", "event-click", "menu-action"],
    template: `
      <div>
        <button
          data-test="widget-join"
          @click="$emit('join-click', { sourceEvent: { bookingId: 77, start: '2026-03-23T10:00:00Z', end: '2026-03-23T10:30:00Z', status: 'confirmed', raw: { enableCallReminderMinutesBefore: true, callReminderMinutesBefore: 15, extensions: [{ status: 'held', endAtIso: '2026-03-23T10:45:00Z' }] } } })"
        >
          Join
        </button>
      </div>
    `,
  },
}));

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
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
});
