import { flushPromises, mount } from "@vue/test-utils";
import { nextTick, reactive } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let engine;
let routeState;
let availableEvents;
let chatSocketInit;
const callFlow = vi.fn();
const showToast = vi.fn();
const stepOneMounted = vi.fn();

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
    mounted: stepOneMounted,
    props: ["step1PrimaryAction", "requestEventBooking"],
    emits: ["edit-schedule"],
    template: `
      <div><button data-test="step-1-book" @click="requestEventBooking?.()">Book call</button><button
        data-test="step-1"
        @click="$emit('edit-schedule', { eventId: 'evt_step1_edit', title: 'Step 1 Edit' })"
      >
        Step 1 {{ step1PrimaryAction }}
      </button></div>
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
  __esModule: true,
  __isTeleport: false,
  __isKeepAlive: false,
  name: "BookingFlowStep3",
  default: {
    name: "BookingFlowStep3",
    emits: ["balance-changed", "booking-created"],
    template: `
      <div data-test="step-3">
        <button data-test="step-3-top-up" @click="$emit('balance-changed', { reason: 'top-up' })">top-up</button>
        <button data-test="step-3-booking" @click="$emit('booking-created', { bookingId: 'booking_123' })">booking</button>
      </div>
    `,
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
    stepOneMounted.mockReset();
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

  function domesticMerchValidation(overrides = {}) {
    return {
      must_own_products_ok: false,
      prerequisite: {
        eligible: false, action: 'buy', type: 'product',
        product: { id: 39393, title: 'Local merch', price: 25, regular_price: 50, image_url: '/merch.jpg' },
        shipping: { required: true, is_merch: true, international: false, country_code: 'TW', country: 'Taiwan' },
        ...overrides,
      },
    };
  }

  async function mountMerchBooking(validation, { eventId = 'evt_merch', spendingRequirement = 'mustOwnProducts' } = {}) {
    availableEvents = [{ eventId: 'evt_merch', title: 'Merch call', spendingRequirement, requiredProducts: [{ id: 39393, type: 'product' }] }];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => validation });
    vi.stubGlobal('fetch', fetchMock);
    const { default: Feature } = await import('@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue');
    const wrapper = mount(Feature, { props: { creatorId: 1407, fanId: 2615, eventId, creatorData: { name: 'Creator' } } });
    await flushPromises();
    await nextTick();
    return { wrapper, fetchMock };
  }

  it('keeps the payment step and booking selection when inline login refreshes the fan', async () => {
    const { wrapper } = await mountMerchBooking(domesticMerchValidation({ eligible: true, action: 'none' }));
    try {
      engine.step = 3;
      engine.substep = 'topup';
      engine.state.bookingDetails = { selectedDate: '2026-10-21', selectedTime: { value: '01:00' }, addons: [{ title: 'Keep addon' }] };
      engine.goToStep.mockClear();
      engine.forceSubstep.mockClear();
      await wrapper.setProps({ fanId: 8136 });
      await flushPromises();
      expect(engine.step).toBe(3);
      expect(engine.substep).toBe('topup');
      expect(engine.goToStep).not.toHaveBeenCalled();
      expect(engine.forceSubstep).not.toHaveBeenCalled();
      expect(engine.state.fanBooking.context.selectedEventId).toBe('evt_merch');
      expect(engine.state.bookingDetails).toMatchObject({ selectedDate: '2026-10-21', selectedTime: { value: '01:00' }, addons: [{ title: 'Keep addon' }] });
    } finally { wrapper.unmount(); }
  });

  it('shows domestic merch shipping confirmation before the calendar and continues without creating an order', async () => {
    const { wrapper, fetchMock } = await mountMerchBooking(domesticMerchValidation());
    expect(engine.step).toBe(1);
    expect(wrapper.find('[data-test="step-2"]').exists()).toBe(false);
    const prompt = wrapper.get('[data-testid="merch-shipping-confirmation"]');
    expect(prompt.text()).toContain('Local merch');
    expect(prompt.text()).toContain('USD$25.00');
    expect(prompt.text()).toContain('50% off');
    expect(prompt.text()).toContain('Taiwan');
    expect(prompt.get('img[alt="Local merch"]').attributes('src')).toBe('/merch.jpg');
    expect(prompt.classes()).toEqual(expect.arrayContaining(['max-w-[510px]', 'md:p-5', 'gap-3', 'rounded-[15px]', 'bg-black/90']));
    expect(fetchMock).toHaveBeenCalledWith('/wp-json/api/bookings/validate', expect.objectContaining({
      credentials: 'same-origin', body: JSON.stringify({ user_id: 2615, must_own_products: [{ id: 39393, type: 'product' }], include_checkout_details: true }),
    }));
    await wrapper.get('[data-testid="merch-shipping-confirm"]').trigger('click');
    expect(engine.step).toBe(2);
    expect(wrapper.find('[data-testid="merch-shipping-confirmation"]').exists()).toBe(false);
    expect(engine.state.fanBooking.prerequisite.validation.prerequisite.product.id).toBe(39393);
    expect(callFlow.mock.calls.every(([flow]) => flow === 'bookings.fetchCreatorBookingContext')).toBe(true);
    wrapper.unmount();
  });

  it('goes back to the profile without advancing or purchasing when shipping is declined', async () => {
    const { wrapper } = await mountMerchBooking(domesticMerchValidation());
    await wrapper.get('[data-testid="merch-shipping-cancel"]').trigger('click');
    await flushPromises();
    expect(engine.step).toBe(1);
    expect(wrapper.emitted('close-request')).toHaveLength(1);
    wrapper.unmount();
  });

  it.each(['upgrade', 'downgrade'])('shows the %s notice at booking entry before choosing a slot', async (switchType) => {
    const validation = domesticMerchValidation({
      type: 'subscription', action: 'switch', shipping: { required: false },
      product: { id: 39393, title: 'Generic subscription', variation_title: 'Required Tier', price: 25, regular_price: 50, image_url: '/new-tier.jpg' },
      subscription: { period: 'month', next_payment_date: 'November 1, 2026', current_tier: { id: 91, title: 'Generic current', variation_title: 'Current Tier Name', price: 10, image_url: '/current-tier.jpg' } },
      checkout: { subscription_id: 9000, switch_type: switchType },
    });
    const { wrapper, fetchMock } = await mountMerchBooking(validation);
    const prompt = wrapper.get('[data-testid="booking-prerequisite-review"]');
    expect(engine.step).toBe(1);
    expect(prompt.text()).toContain('Current Tier Name');
    expect(prompt.text()).toContain('Required Tier');
    expect(prompt.text()).toContain('USD$25.00');
    expect(prompt.text()).toContain('50% off');
    expect(prompt.text()).toContain('November 1, 2026');
    expect(prompt.text()).toContain(switchType === 'downgrade' ? 'next billing cycle' : 'next billing date');
    expect(prompt.get('img[alt="Required Tier"]').attributes('src')).toBe('/new-tier.jpg');
    await wrapper.get('[data-testid="booking-prerequisite-review-confirm"]').trigger('click');
    expect(engine.step).toBe(2);
    expect(engine.state.fanBooking.prerequisite.confirmedSwitch).toContain('39393');
    expect(fetchMock.mock.calls.filter(([url]) => url === '/wp-json/api/bookings/validate')).toHaveLength(1);
    // The notice acknowledges the required switch; it does not execute one.
    expect(callFlow.mock.calls.every(([flow]) => flow === 'bookings.fetchCreatorBookingContext')).toBe(true);
    wrapper.unmount();
  });

  it('returns to the profile when the required tier switch is declined', async () => {
    const { wrapper } = await mountMerchBooking(domesticMerchValidation({ type: 'subscription', action: 'switch', shipping: { required: false } }));
    await wrapper.get('[data-testid="booking-prerequisite-review-cancel"]').trigger('click');
    expect(engine.step).toBe(1);
    expect(engine.state.fanBooking.prerequisite.confirmedSwitch).toBeUndefined();
    expect(wrapper.emitted('close-request')).toHaveLength(1);
    wrapper.unmount();
  });

  it('checks subscription-typed requirements and prompts on a Step 1 booking click', async () => {
    const { wrapper } = await mountMerchBooking(domesticMerchValidation({ type: 'subscription', action: 'switch', shipping: { required: false } }), { eventId: null });
    availableEvents[0].requiredProducts[0].type = 'subscription';
    engine.setState('fanBooking.context.selectedEvent', availableEvents[0]);
    await wrapper.get('[data-test="step-1-book"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="booking-prerequisite-review"]').exists()).toBe(true);
    await wrapper.get('[data-testid="booking-prerequisite-review-cancel"]').trigger('click');
    expect(engine.step).toBe(1);
    expect(wrapper.emitted('close-request')).toBeUndefined();
    wrapper.unmount();
  });

  it.each([
    ['existing owner', { eligible: true, action: 'none' }],
    ['international merch', { shipping: { required: true, is_merch: true, international: true, country: 'Taiwan' } }],
    ['virtual product', { shipping: { required: false, is_merch: true, international: false } }],
    ['non-merch product', { shipping: { required: true, is_merch: false, international: false } }],
  ])('does not interrupt booking for %s', async (_name, overrides) => {
    const { wrapper } = await mountMerchBooking(domesticMerchValidation(overrides));
    expect(engine.step).toBe(2);
    expect(wrapper.find('[data-testid="merch-shipping-confirmation"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('uses the same confirmation for a Book call click inside step 1 and returns to that card', async () => {
    const { wrapper } = await mountMerchBooking(domesticMerchValidation(), { eventId: null });
    engine.setState('fanBooking.context.selectedEvent', availableEvents[0]);
    await wrapper.get('[data-test="step-1-book"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="merch-shipping-confirmation"]').exists()).toBe(true);
    await wrapper.get('[data-testid="merch-shipping-cancel"]').trigger('click');
    expect(engine.step).toBe(1);
    expect(wrapper.emitted('close-request')).toBeUndefined();
    wrapper.unmount();
  });

  it('ignores stale attached products when the event now permits everyone', async () => {
    const { wrapper, fetchMock } = await mountMerchBooking(domesticMerchValidation(), { spendingRequirement: 'everyone' });
    expect(engine.step).toBe(2);
    expect(fetchMock.mock.calls.some(([url]) => url === '/wp-json/api/bookings/validate')).toBe(false);
    wrapper.unmount();
  });

  it('stays on the selected card when the shipping check fails and permits a retry', async () => {
    const { wrapper, fetchMock } = await mountMerchBooking(domesticMerchValidation(), { eventId: null });
    engine.setState('fanBooking.context.selectedEvent', availableEvents[0]);
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Please try again.' }) });
    await wrapper.get('[data-test="step-1-book"]').trigger('click');
    await flushPromises();
    expect(engine.step).toBe(1);
    expect(wrapper.find('[data-testid="merch-shipping-confirmation"]').exists()).toBe(false);
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Please try again.' }));
    await wrapper.get('[data-test="step-1-book"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="merch-shipping-confirmation"]').exists()).toBe(true);
    wrapper.unmount();
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

  it.each(['prop', 'query'])('never mounts Step 1 during a direct card open while catalog and prerequisite checks are pending (%s)', async (entry) => {
    let resolveCatalog;
    let resolveEligibility;
    const originalUrl = window.location.href;
    if (entry === 'query') window.history.replaceState({}, '', '?eventId=evt_selected');
    callFlow.mockImplementationOnce(() => new Promise((resolve) => { resolveCatalog = resolve; }));
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveEligibility = resolve; })));
    const { default: Feature } = await import('@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue');
    const wrapper = mount(Feature, { props: {
      creatorId: 1407, fanId: 12, creatorData: { name: 'Creator' },
      ...(entry === 'prop' ? { eventId: 'evt_selected' } : {}),
    } });
    try {
      expect(wrapper.find('[data-test="step-1"]').exists()).toBe(false);
      await flushPromises();
      expect(wrapper.find('[data-test="booking-flow-step-loading-skeleton"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="booking-flow-close-button"]').exists()).toBe(true);
      engine.state.fanBooking.catalog.events = [{ eventId: 'evt_selected', requiredProducts: [{ id: 42, type: 'media' }] }];
      resolveCatalog({ ok: true });
      await flushPromises();
      expect(wrapper.find('[data-test="booking-flow-step-loading-skeleton"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="step-1"]').exists()).toBe(false);
      resolveEligibility({ ok: true, json: async () => ({ prerequisite: { eligible: false, action: 'buy', shipping: { required: false } } }) });
      await flushPromises();
      expect(wrapper.find('[data-test="step-2"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="booking-flow-step-loading-skeleton"]').exists()).toBe(false);
      expect(stepOneMounted).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
      window.history.replaceState({}, '', originalUrl);
    }
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
        eventId: "evt_selected",
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

  it("keeps the initial multi-event catalog request creator-scoped", async () => {
    availableEvents = [{ eventId: "evt_alpha", title: "Alpha Event" }];
    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");

    mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 12,
      },
    });

    await flushAsync();

    const [, payload] = callFlow.mock.calls[0];
    expect(payload).not.toHaveProperty("eventId");
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

    const closeAnchor = wrapper.get("[data-test='booking-flow-step-one-close-anchor']");
    expect(closeAnchor.classes()).toContain("items-center");
    expect(closeAnchor.classes()).toContain("justify-center");

    const closeButton = wrapper.get("[data-test='booking-flow-close-button']");
    expect(closeButton.classes()).toContain("w-10");
    expect(closeButton.classes()).toContain("h-10");
    expect(closeButton.classes()).toContain("bg-black/25");
    expect(closeButton.element.tagName).toBe("BUTTON");

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

  it("requests parent balance refreshes for authoritative top-ups and completed bookings", async () => {
    const { default: OneOnOneBookingFlowFeature } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue");
    const wrapper = mount(OneOnOneBookingFlowFeature, {
      props: {
        creatorId: 1407,
        fanId: 12,
        previewMode: true,
        previewEvent: { eventId: "evt_preview", title: "Preview", type: "1on1-call" },
        previewStartStep: 3,
      },
    });

    await flushAsync();
    await vi.dynamicImportSettled();
    await flushAsync();
    await wrapper.get("[data-test='step-3-top-up']").trigger("click");
    await wrapper.get("[data-test='step-3-booking']").trigger("click");

    expect(wrapper.emitted("balance-refresh-request")).toEqual([
      [{ reason: "top-up" }],
      [{ reason: "booking" }],
    ]);
    expect(wrapper.emitted("booking-created")).toEqual([[{ bookingId: "booking_123" }]]);
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
    await onClosePopup();
    await flushPromises();

    expect(wrapper.emitted("close-request")).toHaveLength(1);
  });
});
