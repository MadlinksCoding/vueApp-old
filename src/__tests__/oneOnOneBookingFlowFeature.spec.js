import { flushPromises, mount } from "@vue/test-utils";
import { nextTick, reactive } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let engine;
let routeState;
let availableEvents;
let chatSocketInit;
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
        creatorPresentation: {
          avatar: null,
          name: null,
          isVerified: null,
        },
        creatorPresentationLoading: false,
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
  resolveCreatorIdFromContext: ({ preferredId, route, fallback }) => preferredId ?? route?.query?.creatorId ?? fallback,
  resolveFanIdFromContext: ({ preferredId, route, fallback }) => preferredId ?? route?.query?.userId ?? fallback,
}));

vi.mock("@/composables/useChatSocket", () => ({
  useChatSocket: () => ({
    init: chatSocketInit,
  }),
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
    props: ["step1PrimaryAction"],
    emits: ["edit-schedule"],
    template: `
      <button
        data-test="step-1"
        @click="$emit('edit-schedule', { eventId: 'evt_step1_edit', title: 'Step 1 Edit' })"
      >
        Step 1 {{ step1PrimaryAction }}
      </button>
    `,
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
  __esModule: true,
  __isTeleport: false,
  __isKeepAlive: false,
  name: "BookingFlowStep4",
  default: {
    name: "BookingFlowStep4",
    emits: ["close-popup"],
    template: "<button data-test='step-4-close' @click=\"$emit('close-popup')\">Step 4</button>",
  },
}));

describe("OneOnOneBookingFlowFeature", () => {
  beforeEach(() => {
    routeState = { query: {} };
    availableEvents = [];
    chatSocketInit = vi.fn();
    showToast.mockReset();
    callFlow.mockReset();

    engine = createMockEngine();

    callFlow.mockImplementation(async () => {
      engine.state.fanBooking.catalog.events = availableEvents.map((event) => ({ ...event }));
      return { ok: true, data: {} };
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: "success",
        user: {
          avatar: "https://example.com/creator.webp",
          display_name: "Creator Display",
          is_premium: true,
        },
      }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads booking context from explicit creator and fan props and forwards apiBaseUrl", async () => {
    availableEvents = [{ eventId: "evt_alpha", title: "Alpha Event" }];
    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");

    mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 999,
        apiBaseUrl: "https://api.example.com",
        creatorData: {
          avatar: "https://example.com/creator.webp",
          name: "Creator Display",
          isVerified: true,
        },
      },
    });

    await flushAsync();

    expect(callFlow).toHaveBeenCalledWith(
      "bookings.fetchCreatorBookingContext",
      expect.objectContaining({
        creatorId: 1407,
      }),
      expect.objectContaining({
        context: expect.objectContaining({
          creatorId: 1407,
          fanId: 999,
          apiBaseUrl: "https://api.example.com",
        }),
      }),
    );
    expect(engine.state.fanBooking.context.creatorId).toBe(1407);
    expect(engine.state.fanBooking.context.fanId).toBe(999);
    expect(engine.state.fanBooking.context.creatorPresentation).toEqual({
      avatar: "https://example.com/creator.webp",
      name: "Creator Display",
      isVerified: true,
    });
  });

  it("fetches dynamic creator profile data and stores it in creator presentation state", async () => {
    availableEvents = [{ eventId: "evt_alpha", title: "Alpha Event" }];
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn(() => fetchPromise);
    vi.stubGlobal("fetch", fetchMock);
    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");

    mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 999,
      },
    });

    await flushAsync();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost");
    expect(requestedUrl.pathname).toBe("/wp-json/api/users/get-profile-data");
    expect(requestedUrl.searchParams.get("id")).toBe("1407");
    expect(engine.state.fanBooking.context.creatorPresentationLoading).toBe(true);

    resolveFetch({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: "success",
        user: {
          avatar: "https://example.com/api-creator.webp",
          display_name: "API Creator",
          username: "api_creator",
          is_premium: true,
        },
      }),
    });
    await flushAsync();
    await flushPromises();

    expect(engine.state.fanBooking.context.creatorPresentation).toEqual({
      avatar: "https://example.com/api-creator.webp",
      name: "API Creator",
      isVerified: true,
    });
    expect(engine.state.fanBooking.context.creatorPresentationLoading).toBe(false);
  });

  it("starts on step 2 when a valid eventId prop matches the loaded catalog", async () => {
    availableEvents = [{ eventId: "evt_selected", title: "Selected Event" }];
    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");

    const wrapper = mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 12,
        eventId: "evt_selected",
      },
    });

    await flushAsync();

    expect(engine.step).toBe(2);
    expect(engine.state.fanBooking.context.selectedEventId).toBe("evt_selected");
    expect(engine.state.fanBooking.context.selectedEvent).toEqual(
      expect.objectContaining({ eventId: "evt_selected" }),
    );
    expect(callFlow).toHaveBeenCalledWith(
      "bookings.fetchCreatorBookingContext",
      expect.objectContaining({
        creatorId: 1407,
        fanId: 12,
      }),
      expect.objectContaining({
        forceRefresh: true,
        skipDestinationRead: true,
        bypassEtag: true,
      }),
    );
    expect(wrapper.find("[data-test='step-2']").exists()).toBe(true);
  });

  it("uses a fresh catalog for direct event opens even when stale state is missing the requested event", async () => {
    engine.state.fanBooking.catalog.events = [{ eventId: "evt_stale", title: "Stale Event" }];
    callFlow.mockImplementationOnce(async (_flowName, _payload, options = {}) => {
      if (options.forceRefresh === true && options.skipDestinationRead === true && options.bypassEtag === true) {
        engine.state.fanBooking.catalog.events = [{ eventId: "evt_selected", title: "Selected Event" }];
      }

      return { ok: true, data: {} };
    });

    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");

    const wrapper = mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 12,
        eventId: "evt_selected",
      },
    });

    await flushAsync();

    expect(engine.step).toBe(2);
    expect(engine.state.fanBooking.context.selectedEventId).toBe("evt_selected");
    expect(engine.state.fanBooking.context.selectedEvent).toEqual(
      expect.objectContaining({ eventId: "evt_selected" }),
    );
    expect(showToast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Event Unavailable",
      }),
    );
    expect(wrapper.find("[data-test='step-2']").exists()).toBe(true);
  });

  it("stays on step 1 and clears selected state when the requested event is missing", async () => {
    availableEvents = [{ eventId: "evt_other", title: "Other Event" }];
    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");

    const wrapper = mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 12,
        eventId: "evt_missing",
      },
    });

    await flushAsync();

    expect(engine.step).toBe(1);
    expect(engine.state.fanBooking.context.selectedEventId).toBe(null);
    expect(engine.state.fanBooking.context.selectedEvent).toBe(null);
    expect(wrapper.find("[data-test='step-1']").exists()).toBe(true);
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Event Unavailable",
      }),
    );
  });

  it("still fetches booking context when chat socket initialization throws", async () => {
    availableEvents = [{ eventId: "evt_alpha", title: "Alpha Event" }];
    chatSocketInit = vi.fn(() => {
      throw new Error("socket init failed");
    });
    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");

    mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 999,
      },
    });

    await flushAsync();

    expect(callFlow).toHaveBeenCalledWith(
      "bookings.fetchCreatorBookingContext",
      expect.objectContaining({
        creatorId: 1407,
        fanId: 999,
      }),
      expect.any(Object),
    );
  });

  it("passes the step 1 edit-schedule action through and forwards edit events", async () => {
    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");

    const wrapper = mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 12,
        previewMode: true,
        previewEvent: {
          eventId: "evt_preview_schedule",
          title: "Preview Schedule",
          type: "1on1-call",
        },
        step1PrimaryAction: "edit-schedule",
      },
    });

    await flushAsync();

    const stepOne = wrapper.get("[data-test='step-1']");
    expect(stepOne.text()).toContain("edit-schedule");

    const shell = wrapper.get("[data-test='booking-flow-shell']");
    expect(shell.classes()).toContain("relative");
    expect(shell.classes()).toContain("min-h-dvh");
    expect(shell.classes()).not.toContain("absolute");
    expect(shell.classes()).not.toContain("-translate-y-1/2");
    expect(shell.classes()).toContain("md:absolute");
    expect(shell.classes()).toContain("md:-translate-y-1/2");

    const closeButton = wrapper.get("[data-test='booking-flow-close-button']");
    expect(closeButton.classes()).toContain("w-10");
    expect(closeButton.classes()).toContain("h-10");
    expect(closeButton.classes()).toContain("bg-black/25");

    await stepOne.trigger("click");

    expect(wrapper.emitted("edit-schedule")?.[0]?.[0]).toEqual({
      eventId: "evt_step1_edit",
      title: "Step 1 Edit",
    });
  });

  it("emits close-request when the wrapper close button is clicked", async () => {
    availableEvents = [{ eventId: "evt_selected", title: "Selected Event" }];
    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");

    const wrapper = mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 12,
        eventId: "evt_selected",
      },
    });

    await flushAsync();
    await wrapper.get("[data-test='booking-flow-close-button']").trigger("click");

    expect(wrapper.emitted("close-request")).toHaveLength(1);
  });

  it("forwards step 4 close-popup as close-request", async () => {
    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");

    const wrapper = mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 12,
      },
    });

    await flushAsync();
    engine.step = 4;
    await flushAsync();
    await flushPromises();

    const asyncWrapper = wrapper.findComponent({ name: "AsyncComponentWrapper" });
    expect(asyncWrapper.exists()).toBe(true);

    const onClosePopup = asyncWrapper.vm.$.vnode.props?.onClosePopup;
    expect(typeof onClosePopup).toBe("function");
    onClosePopup();

    expect(wrapper.emitted("close-request")).toHaveLength(1);
  });
});
