import { mount } from "@vue/test-utils";
import { nextTick, reactive } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

let engine;
let routeState;
let availableEvents;
const callFlow = vi.fn();
const showToast = vi.fn();

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

function getByPath(target, path) {
  return String(path).split(".").reduce((cursor, segment) => (
    cursor == null ? cursor : cursor[segment]
  ), target);
}

function createMockEngine() {
  const state = {
    bookingDetails: {},
    fanBooking: {
      context: {
        creatorId: null,
        fanId: null,
        selectedEventId: null,
        selectedEvent: null,
      },
      catalog: {
        events: [],
        rawEvents: [],
        bookedSlots: [],
        bookedSlotsIndex: {},
        cachedResponse: null,
        meta: {},
      },
      selection: {},
      temporaryHold: {
        temporaryHoldId: null,
        status: "none",
      },
      booking: {},
      ui: {
        catalogLoading: false,
        catalogError: "",
        previewMode: false,
        previewReadOnly: false,
      },
    },
  };

  return reactive({
    flowId: "fan-one-on-one-booking-flow",
    step: 1,
    substep: null,
    state,
    initialize: vi.fn(),
    setState: vi.fn((path, value) => {
      setByPath(state, path, value);
    }),
    getState: vi.fn((path) => getByPath(state, path)),
    callFlow,
    forceStep: vi.fn(async (step) => {
      engine.step = step;
    }),
    forceSubstep: vi.fn(async (substep) => {
      engine.substep = substep;
    }),
    goToStep: vi.fn(async (step) => {
      engine.step = step;
    }),
    callAction: vi.fn(),
  });
}

async function flushAsync() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

vi.mock("vue-router", () => ({
  useRoute: () => routeState,
}));

vi.mock("@/utils/flowStateEngine.js", () => ({
  createFlowStateEngine: () => engine,
}));

vi.mock("@/utils/toastBus.js", () => ({
  showToast,
}));

vi.mock("@/utils/contextIds.js", () => ({
  resolveCreatorIdFromContext: () => 1407,
  resolveFanIdFromContext: () => 2,
}));

vi.mock("@/components/ui/popup/PopupHandler.vue", () => ({
  default: {
    name: "PopupHandler",
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template: "<div><slot /></div>",
  },
}));

vi.mock("@/components/ui/toast/ToastHost.vue", () => ({
  default: {
    name: "ToastHost",
    template: "<div />",
  },
}));

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep1.vue", () => ({
  default: {
    name: "BookingFlowStep1",
    template: "<div data-test='step-1'>Step 1</div>",
  },
}));

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep2.vue", () => ({
  default: {
    name: "BookingFlowStep2",
    template: "<div data-test='step-2'>Step 2</div>",
  },
}));

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue", () => ({
  default: {
    name: "BookingFlowStep3",
    template: "<div data-test='step-3'>Step 3</div>",
  },
}));

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep4.vue", () => ({
  default: {
    name: "BookingFlowStep4",
    template: "<div data-test='step-4'>Step 4</div>",
  },
}));

describe("OneOnOneBookingFlowPopup", () => {
  beforeEach(() => {
    routeState = { query: {} };
    window.history.replaceState({}, "", "/");
    availableEvents = [];
    showToast.mockReset();
    callFlow.mockReset();

    engine = createMockEngine();

    callFlow.mockImplementation(async () => {
      engine.state.fanBooking.catalog.events = availableEvents.map((event) => ({ ...event }));
      return { ok: true, data: {} };
    });
  });

  it("opens on step 1 when no eventId is provided", async () => {
    availableEvents = [{ eventId: "evt_alpha", title: "Alpha Event" }];
    const { default: OneOnOneBookingFlowPopup } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue");

    const wrapper = mount(OneOnOneBookingFlowPopup, {
      props: {
        modelValue: false,
      },
    });

    await wrapper.setProps({ modelValue: true });
    await flushAsync();

    expect(engine.step).toBe(1);
    expect(engine.state.fanBooking.context.selectedEvent).toBe(null);
    expect(wrapper.find("[data-test='step-1']").exists()).toBe(true);
    expect(engine.forceStep).not.toHaveBeenCalledWith(2, expect.anything());
  });

  it("opens directly on step 2 when a valid eventId prop is provided", async () => {
    availableEvents = [{ eventId: "evt_0e8082d4-9df0-42fb-a7eb-37e9b6311826", title: "VIP Call" }];
    const { default: OneOnOneBookingFlowPopup } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue");

    const wrapper = mount(OneOnOneBookingFlowPopup, {
      props: {
        modelValue: false,
        eventId: "evt_0e8082d4-9df0-42fb-a7eb-37e9b6311826",
      },
    });

    await wrapper.setProps({ modelValue: true });
    await flushAsync();

    expect(engine.step).toBe(2);
    expect(engine.state.fanBooking.context.selectedEventId).toBe("evt_0e8082d4-9df0-42fb-a7eb-37e9b6311826");
    expect(engine.state.fanBooking.context.selectedEvent).toEqual(
      expect.objectContaining({ eventId: "evt_0e8082d4-9df0-42fb-a7eb-37e9b6311826" }),
    );
    expect(wrapper.find("[data-test='step-2']").exists()).toBe(true);
  });

  it("uses the existing route query fallback to open on step 2", async () => {
    routeState.query = { eventId: "evt_query" };
    window.history.replaceState({}, "", "/?eventId=evt_query");
    availableEvents = [{ id: "evt_query", title: "Query Event" }];
    const { default: OneOnOneBookingFlowPopup } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue");

    const wrapper = mount(OneOnOneBookingFlowPopup, {
      props: {
        modelValue: false,
      },
    });

    await wrapper.setProps({ modelValue: true });
    await flushAsync();

    expect(engine.step).toBe(2);
    expect(engine.state.fanBooking.context.selectedEventId).toBe("evt_query");
    expect(wrapper.find("[data-test='step-2']").exists()).toBe(true);
  });

  it("stays on step 1 and shows an error when the requested event is missing", async () => {
    availableEvents = [{ eventId: "evt_other", title: "Other Event" }];
    const { default: OneOnOneBookingFlowPopup } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue");

    const wrapper = mount(OneOnOneBookingFlowPopup, {
      props: {
        modelValue: false,
        eventId: "evt_missing",
      },
    });

    await wrapper.setProps({ modelValue: true });
    await flushAsync();

    expect(engine.step).toBe(1);
    expect(engine.state.fanBooking.context.selectedEventId).toBe(null);
    expect(engine.state.fanBooking.context.selectedEvent).toBe(null);
    expect(wrapper.find("[data-test='step-1']").exists()).toBe(true);
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Event Unavailable",
        message: "Selected event is no longer available.",
      }),
    );
  });
});
