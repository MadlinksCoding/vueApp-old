import { mount } from "@vue/test-utils";
import { nextTick, reactive } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tokenGet = vi.fn();
const showToast = vi.fn();
let backendJwtToken = "jwt_test";

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

function createEngine() {
  const state = reactive({
    bookingDetails: {
      selectedDate: new Date("2026-03-24T00:00:00"),
      selectedTime: { value: "10:00", startHm: "10:00", offHours: false },
      selectedDuration: { value: 30, price: 1000 },
      addons: [],
      otherRequest: "",
      totalPrice: 1000,
      walletBalance: 0,
      formattedTimeRange: "10:00 AM-10:15 AM",
      headerDateDisplay: "March 24, 2026",
      selectedDateDisplay: "March 24, 2026",
    },
    fanBooking: {
      context: {
        creatorId: null,
        fanId: 2516,
        selectedEvent: {
          eventId: "evt_123",
          title: "Test Event",
          creatorName: "Creator Name",
          raw: {
            sessionDurationMinutes: 15,
          },
        },
      },
      temporaryHold: {
        temporaryHoldId: null,
        status: "none",
        expiresAt: null,
        secondsRemaining: 0,
      },
      booking: {},
    },
  });

  return reactive({
    state,
    substep: null,
    getState: vi.fn((path) => getByPath(state, path)),
    setState: vi.fn((path, value) => setByPath(state, path, value)),
    goToStep: vi.fn(),
    forceSubstep: vi.fn(async () => {}),
    callFlow: vi.fn(),
  });
}

function configureEventGoalGroup(engine, overrides = {}) {
  engine.state.bookingDetails = {
    ...engine.state.bookingDetails,
    selectedTime: {
      value: "10:00",
      startHm: "10:00",
      endHm: "13:00",
      offHours: false,
    },
    selectedDuration: { value: 180, price: 500 },
    contributionTokens: 500,
    totalPrice: 500,
    walletBalance: 0,
    formattedTimeRange: "10:00am-1:00pm",
  };
  engine.state.fanBooking.catalog = {
    bookedSlotsIndex: {
      evt_goal_step3: {
        "2026-03-24": [{
          bookingId: "booking_existing_contribution",
          startIso: "2026-03-24T10:00:00",
          endIso: "2026-03-24T13:00:00",
          startMs: new Date("2026-03-24T10:00:00").getTime(),
          endMs: new Date("2026-03-24T13:00:00").getTime(),
          status: "confirmed",
          contributionTokens: 1000,
        }],
      },
    },
  };
  engine.state.fanBooking.context.selectedEvent = {
    eventId: "evt_goal_step3",
    id: "evt_goal_step3",
    type: "group-event",
    eventType: "group-event",
    title: "Group Goal",
    creatorName: "Creator Name",
    priceSetting: "eventGoal",
    eventGoalTokens: 8000,
    minContributionPerUser: 500,
    raw: {
      type: "group-event",
      eventType: "group-event",
      priceSetting: "eventGoal",
      eventGoalTokens: 8000,
      minContributionPerUser: 500,
      sessionDurationMinutes: 180,
    },
    ...overrides,
  };
  engine.state.fanBooking.selection = {
    contributionTokens: 500,
    selectedDurationMinutes: 180,
  };
}

async function flushAsync() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

vi.mock("@/utils/TokenHandler.js", () => ({
  default: {
    get: tokenGet,
  },
}));

vi.mock("@/utils/toastBus.js", () => ({
  showToast,
}));

vi.mock("@/utils/backendJwt.js", () => ({
  getBackendJwtToken: () => backendJwtToken,
  setBackendJwtToken: vi.fn((token) => {
    backendJwtToken = token;
    return token;
  }),
}));

vi.mock("@/services/bookings/mappers/createBookingMapper.js", () => ({
  mapCreateBookingToRequest: (state = {}) => {
    const selectedEvent = state?.fanBooking?.context?.selectedEvent || {};
    const raw = selectedEvent.raw || {};
    const isEventGoalGroup = String(selectedEvent.type || raw.type || "").toLowerCase() === "group-event"
      && String(selectedEvent.priceSetting || raw.priceSetting || "").toLowerCase() === "eventgoal";
    if (isEventGoalGroup) {
      const contribution = Number(
        state?.bookingDetails?.contributionTokens
          ?? state?.fanBooking?.selection?.contributionTokens
          ?? raw.minContributionPerUser
          ?? 1,
      );
      return {
        contributionTokens: contribution,
        payment: {
          lines: [{ code: "event_goal_contribution", amount: contribution }],
          total: contribution,
        },
      };
    }

    return {
      payment: {
        lines: [
          { code: "base", amount: 900 },
          { code: "booking_fee", amount: 100 },
        ],
        total: 1000,
      },
    };
  },
}));

vi.mock("@/utils/contextIds.js", () => ({
  resolveCreatorIdFromContext: ({ fallback }) => fallback,
  resolveFanIdFromContext: ({ fallback }) => fallback,
}));

vi.mock("@/components/FanBookingFlow/HelperComponents/TopUpForm.vue", () => ({
  default: {
    name: "TopUpForm",
    template: "<div data-test='top-up-form' />",
  },
}));

vi.mock("@/components/FanBookingFlow/HelperComponents/OneOnOneBookingFlowLeftSideBar.vue", () => ({
  default: {
    name: "OneOnOneBookingFlowLeftSideBar",
    props: [
      "isGroupEvent",
      "priceSetting",
      "eventGoalReachedTokens",
      "eventGoalTokens",
      "eventGoalPercent",
      "groupPerformers",
      "titleDisplay",
    ],
    template: `
      <div
        data-test="left-sidebar"
        :data-is-group-event="String(isGroupEvent)"
        :data-price-setting="priceSetting"
        :data-event-goal-reached-tokens="eventGoalReachedTokens"
        :data-event-goal-tokens="eventGoalTokens"
        :data-event-goal-percent="eventGoalPercent"
        :data-performer-count="Array.isArray(groupPerformers) ? groupPerformers.length : 0"
      >{{ titleDisplay }}</div>
    `,
  },
}));

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js", () => ({
  bookingFlowArrowRightIcon: "/arrow.webp",
  bookingFlowBackgroundImage: "/background.webp",
  bookingFlowExBalanceImage: "/balance.webp",
  bookingFlowProfileImage: "/profile.webp",
  bookingFlowTokenIcon: "/token.webp",
}));

describe("BookingFlowStep3", () => {
  beforeEach(() => {
    tokenGet.mockReset();
    showToast.mockReset();
    backendJwtToken = "jwt_test";
  });

  it("checks balance using engine context ids even if the shared resolver falls back", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 1900,
      },
    });

    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();

    expect(tokenGet).toHaveBeenCalledWith({
      userId: 2516,
      receiverId: null,
      defaultValue: null,
    });
    expect(engine.getState("bookingDetails.walletBalance")).toBe(1900);
  });

  it("renders dynamic booking summary details and navigates back to step 2 when changing schedule", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 1900,
      },
    });

    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();

    const text = wrapper.text();
    expect(text).toContain("March 24, 2026");
    expect(text).toContain("Creator Name");
    expect(text).toContain("15 Minute x 2 sessions (30 Min.)");
    expect(text).toContain("1,000");
    expect(text).toContain("USD$ 60.00");
    expect(text).not.toContain("@model");
    expect(text).not.toContain("09 Dec 2026");
    expect(text).not.toContain("224.99");

    await wrapper.get("button").trigger("click");

    expect(engine.forceSubstep).toHaveBeenCalledWith(null, { intent: "change-schedule" });
    expect(engine.goToStep).toHaveBeenCalledWith(2);
  });

  it("defaults guests to top-up without checking token balance", async () => {
    backendJwtToken = "";
    const engine = createEngine();
    engine.state.fanBooking.context.fanId = 0;
    engine.state.bookingDetails.walletBalance = 400;

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();

    expect(tokenGet).not.toHaveBeenCalled();
    expect(engine.getState("bookingDetails.walletBalance")).toBe(0);
    expect(wrapper.text()).toContain("TOP UP NEEDED");
    expect(wrapper.text()).toContain("TOP-UP AND PAY");
  });

  it("creates guest temporary holds with guest session identity and no auth header", async () => {
    backendJwtToken = "";
    const engine = createEngine();
    engine.state.fanBooking.context.fanId = 0;
    engine.callFlow.mockImplementation(async (flowName, _payload, options) => {
      if (flowName === "bookings.createTemporaryHold") {
        engine.state.fanBooking.temporaryHold.temporaryHoldId = "temphold_evt_123_1_1";
        engine.state.fanBooking.temporaryHold.guestHoldToken = "guest_hold_token";
        engine.state.fanBooking.temporaryHold.status = "active";
        engine.state.fanBooking.temporaryHold.expiresAt = new Date(Date.now() + 600000).toISOString();
        return {
          ok: true,
          data: {
            temporaryHoldId: "temphold_evt_123_1_1",
            guestHoldToken: "guest_hold_token",
          },
          options,
        };
      }

      if (flowName === "bookings.getTemporaryHoldStatus") {
        return {
          ok: true,
          data: {
            temporaryHoldId: "temphold_evt_123_1_1",
            status: "active",
            expiresAt: new Date(Date.now() + 600000).toISOString(),
            secondsRemaining: 600,
          },
        };
      }

      return { ok: true, data: {} };
    });

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();
    const buttons = wrapper.findAll("button");
    await buttons[buttons.length - 1].trigger("click");
    await flushAsync();

    expect(engine.callFlow).toHaveBeenCalledWith(
      "bookings.createTemporaryHold",
      null,
      expect.objectContaining({
        context: expect.objectContaining({
          userId: 0,
          fanId: 0,
          guestSessionId: expect.any(Number),
          isGuestHold: true,
          requestHeaders: { Authorization: null },
        }),
      }),
    );
    expect(engine.forceSubstep).toHaveBeenCalledWith("topup", { intent: "topup-needed" });
  });

  it("renders event-goal group contribution controls in step 3 and updates booking state", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    configureEventGoalGroup(engine);

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();

    expect(wrapper.text()).toContain("Your Contribution (500 Tokens minimum)");
    const input = wrapper.get("#step3-event-goal-contribution");
    const range = wrapper.get("[data-testid='step3-event-goal-contribution-range']");
    expect(input.attributes("min")).toBe("500");
    expect(input.attributes("max")).toBe("7000");
    expect(range.attributes("max")).toBe("7000");

    await input.setValue("4000");
    await flushAsync();

    expect(engine.state.bookingDetails.contributionTokens).toBe(4000);
    expect(engine.state.fanBooking.selection.contributionTokens).toBe(4000);
    expect(wrapper.text()).toContain("4,000");
  });

  it("passes group event-goal progress into the sidebar", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    configureEventGoalGroup(engine, {
      coHosts: [
        {
          name: "Buff Bunny",
          avatar: "/buff.webp",
          isVerified: true,
        },
      ],
      raw: {
        type: "group-event",
        eventType: "group-event",
        priceSetting: "eventGoal",
        eventGoalTokens: 8000,
        minContributionPerUser: 500,
        sessionDurationMinutes: 180,
      },
    });

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();

    const sidebar = wrapper.get("[data-test='left-sidebar']");
    expect(sidebar.attributes("data-is-group-event")).toBe("true");
    expect(sidebar.attributes("data-price-setting")).toBe("eventGoal");
    expect(sidebar.attributes("data-event-goal-reached-tokens")).toBe("1000");
    expect(sidebar.attributes("data-event-goal-tokens")).toBe("8000");
    expect(sidebar.attributes("data-event-goal-percent")).toBe("12");
    expect(sidebar.attributes("data-performer-count")).toBe("1");
    expect(sidebar.text()).toContain("Group Goal");
  });

  it("allows event-goal contribution above wallet balance so step 3 can top up", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 300,
      },
    });
    const engine = createEngine();
    configureEventGoalGroup(engine);

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();
    await wrapper.get("#step3-event-goal-contribution").setValue("4000");
    await flushAsync();

    expect(engine.state.bookingDetails.contributionTokens).toBe(4000);
    expect(wrapper.text()).toContain("TOP UP NEEDED");
    expect(wrapper.text()).toContain("TOP-UP AND PAY");
  });

  it("returns group bookings to step 1 when changing schedule", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    configureEventGoalGroup(engine);

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();
    await wrapper.findAll("button").find((button) => button.text().includes("Change Schedule")).trigger("click");

    expect(engine.forceSubstep).toHaveBeenCalledWith(null, { intent: "change-schedule" });
    expect(engine.goToStep).toHaveBeenCalledWith(1);
  });
});
