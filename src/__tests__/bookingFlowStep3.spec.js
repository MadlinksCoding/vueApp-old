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
        fanId: 2615,
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
    const requiredBookingFields = {
      eventId: selectedEvent.eventId || selectedEvent.id || "evt_123",
      creatorId: state?.fanBooking?.context?.creatorId || 793,
      startIso: "2026-03-24T10:00:00.000Z",
      endIso: "2026-03-24T10:15:00.000Z",
    };
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
        ...requiredBookingFields,
        contributionTokens: contribution,
        payment: {
          lines: [{ code: "event_goal_contribution", amount: contribution }],
          total: contribution,
        },
      };
    }

    if (selectedEvent.eventId === "evt_group_step3_discount") {
      return {
        ...requiredBookingFields,
        payment: {
          lines: [
            { code: "base", label: "Base Price", amount: 100 },
            { code: "recurring_event_discount", label: "Recurring Event Discount (25%)", amount: -25 },
            { code: "off_hour_surcharge", label: "Off-hour Surcharge (50%)", amount: 38 },
          ],
          total: 113,
        },
      };
    }

    if (selectedEvent.eventId === "evt_private_step3_discounts") {
      return {
        ...requiredBookingFields,
        payment: {
          lines: [
            { code: "base", label: "Base Price", amount: 200 },
            { code: "discount", label: "Longer Session Discount", amount: -40 },
            { code: "first_time_discount", label: "First Time Discount", amount: -20 },
          ],
          total: 140,
        },
      };
    }

    return {
      ...requiredBookingFields,
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
  __esModule: true,
  __isKeepAlive: false,
  __isTeleport: false,
  default: {
    name: "TopUpForm",
    props: ["beforeSubmit"],
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
      "showApprovalNeeded",
    ],
    template: `
      <div
        data-test="left-sidebar"
        :data-is-group-event="String(isGroupEvent)"
        :data-show-approval-needed="String(showApprovalNeeded)"
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
  bookingFlowCrossWhiteIcon: "/close.webp",
  bookingFlowExBalanceImage: "/balance.webp",
  bookingFlowMessageGreenIcon: "/message.webp",
  bookingFlowPendingIcon: "/pending.webp",
  bookingFlowProfileImage: "/profile.webp",
  bookingFlowTokenIcon: "/token.webp",
  bookingFlowVerifiedIcon: "/verified.webp",
}));

describe("BookingFlowStep3", () => {
  beforeEach(() => {
    tokenGet.mockReset();
    showToast.mockReset();
    backendJwtToken = "jwt_test";
  });

  async function mountAndSubmitStep3(engine, props = {}) {
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
        ...props,
      },
    });

    await flushAsync();
    const buttons = wrapper.findAll("button");
    await buttons[buttons.length - 1].trigger("click");
    await flushAsync();

    return wrapper;
  }

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
      userId: 2615,
      receiverId: null,
      defaultValue: null,
    });
    expect(engine.getState("bookingDetails.walletBalance")).toBe(1900);
  }, 10000);

  it("accepts invite-only event links for authenticated fans before booking", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 1900,
      },
    });
    const originalFetch = global.fetch;
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        invited: true,
        eventId: "evt_invite_step3",
        userId: 2615,
      }),
    }));
    global.fetch = fetchMock;

    try {
      const engine = createEngine();
      engine.state.fanBooking.context.inviteSecret = "invite_secret_step3";
      engine.state.fanBooking.context.selectedEvent = {
        eventId: "evt_invite_step3",
        title: "Private Invite",
        whoCanBook: "inviteOnly",
        raw: {
          whoCanBook: "inviteOnly",
          sessionDurationMinutes: 15,
        },
      };

      const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

      mount(BookingFlowStep3, {
        props: {
          engine,
          embedded: true,
          apiBaseUrl: "http://localhost:3001",
        },
      });

      await flushAsync();

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/events/invite/accept-auth",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer jwt_test",
          }),
          body: JSON.stringify({ inviteSecret: "invite_secret_step3" }),
        }),
      );
      expect(engine.getState("fanBooking.context.inviteAccepted")).toBe(true);
      expect(engine.getState("fanBooking.context.inviteAcceptedSecret")).toBe("invite_secret_step3");
    } finally {
      global.fetch = originalFetch;
    }
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
    expect(text).toContain("This booking needs to be approved by Creator Name before your session is confirmed.");
    expect(text).not.toContain("@model");
    expect(text).not.toContain("09 Dec 2026");
    expect(text).not.toContain("224.99");

    await wrapper.get("button").trigger("click");

    expect(engine.forceSubstep).toHaveBeenCalledWith(null, { intent: "change-schedule" });
    expect(engine.goToStep).toHaveBeenCalledWith(2);
  });

  it("formats compact token balances with one non-zero decimal across suffixes", async () => {
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    async function renderBalanceText(paidTokens) {
      tokenGet.mockReset();
      tokenGet.mockResolvedValue({
        data: {
          paidTokens,
          freeTokensPerBeneficiary: {},
          totalFreeTokens: 0,
        },
      });

      const engine = createEngine();
      const wrapper = mount(BookingFlowStep3, {
        props: {
          engine,
          embedded: true,
        },
      });

      await flushAsync();
      const text = wrapper.text();
      wrapper.unmount();
      return text;
    }

    const kText = await renderBalanceText(42956);
    expect(kText).toContain("42.9K");
    expect(kText).not.toContain("43K");

    const exactKText = await renderBalanceText(42000);
    expect(exactKText).toContain("42K");
    expect(exactKText).not.toContain("42.0K");

    const mText = await renderBalanceText(1250000);
    expect(mText).toContain("1.2M");
    expect(mText).not.toContain("1.0M");

    const bText = await renderBalanceText(2500000000);
    expect(bText).toContain("2.5B");
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

  it("translates temporary hold validation failures before wrapper error codes", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 300,
      },
    });
    const engine = createEngine();
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createTemporaryHold") {
        return {
          ok: false,
          error: {
            code: "HTTP_400",
            message: "validation_failed",
            details: {
              ok: false,
              error: "validation_failed",
              failures: ["booking_in_past"],
              messages: ["Backend says this booking is in the past."],
            },
          },
        };
      }

      return { ok: true, data: {} };
    });

    await mountAndSubmitStep3(engine);

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      title: "Could Not Hold Slot",
      message: "Bookings must be scheduled for a future time.",
    }));
  });

  it("enters group top-up without creating or polling a temporary hold", async () => {
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
    const buttons = wrapper.findAll("button");
    await buttons[buttons.length - 1].trigger("click");
    await flushAsync();

    const flowNames = engine.callFlow.mock.calls.map(([flowName]) => flowName);
    expect(flowNames).not.toContain("bookings.createTemporaryHold");
    expect(flowNames).not.toContain("bookings.getTemporaryHoldStatus");
    expect(engine.forceSubstep).toHaveBeenCalledWith("topup", { intent: "topup-needed" });
  });

  it("does not require an active temporary hold before group top-up submit", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 300,
      },
    });
    const engine = createEngine();
    configureEventGoalGroup(engine);
    engine.substep = "topup";

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();
    await vi.dynamicImportSettled();
    await flushAsync();

    const flowNames = engine.callFlow.mock.calls.map(([flowName]) => flowName);
    const topUpForm = wrapper.getComponent({ name: "TopUpForm" });
    expect(wrapper.find("[data-testid='temporary-hold-banner']").exists()).toBe(false);
    expect(flowNames).not.toContain("bookings.createTemporaryHold");
    expect(flowNames).not.toContain("bookings.getTemporaryHoldStatus");
    expect(topUpForm.props("beforeSubmit")()).toBe(true);
    expect(showToast).not.toHaveBeenCalled();
  });

  it("translates all known direct create-booking backend error codes", async () => {
    const cases = [
      ["missing_bearer_token", "Please log in to complete your booking."],
      ["missing_jwt_secret_key", "Could not verify your session. Please try again."],
      ["invalid_jwt_issuer", "Your session could not be verified. Please log in again."],
      ["invalid_jwt_audience", "Your session could not be verified. Please log in again."],
      ["jwt_expired", "Your session has expired. Please log in again."],
      ["invalid_jwt_user_id", "Your session could not be verified. Please log in again."],
      ["invalid_jwt_token", "Your session could not be verified. Please log in again."],
      ["missing_backend_auth_context", "Your session could not be verified. Please try again."],
      ["auth_user_resolution_failed", "Could not resolve your account for this booking. Please log in again."],
      ["missing_test_fan_id", "Could not resolve the fan account for this booking."],
      ["payload is required", "Could not complete booking because booking details were missing."],
      ["missing_required_fields", "Some booking details are missing. Please review your selection."],
      ["invalid_booking_time", "Please choose a valid booking time."],
      ["invalid_fan_timezone", "Please choose a valid fan timezone."],
      ["temporary_hold_not_found_or_expired", "Your reserved slot expired. Please choose the time again."],
      ["temporary_hold_guest_not_converted", "Please log in to finish booking your reserved slot."],
      ["temporary_hold_mismatch", "Your reserved slot no longer matches this booking. Please choose the time again."],
      ["event_not_found", "This event is no longer available."],
      ["event_not_active", "This event is no longer active."],
      ["creator_mismatch", "This booking could not be matched to the creator."],
      ["user_blocked", "You are blocked from booking this event."],
      ["already_booked_for_slot", "You have already booked this time slot."],
      ["booking_already_in_progress", "A booking is already being created for this event time. Please wait a moment and try again."],
      ["invalid_user_event_slot_guard", "Could not reserve this group slot. Please try again."],
      ["event_full", "This event is full."],
      ["slot_already_taken", "This time slot is no longer available."],
      ["daily_booking_limit_reached", "This event has reached its booking limit for that day."],
      ["token_hold_failed", "Could not reserve tokens for this booking."],
      ["token_hold_missing_txid", "Could not reserve tokens for this booking. Please try again."],
      ["invalid_payment_total", "The booking total is invalid. Please refresh and try again."],
      ["internal_error", "Could not complete booking. Please try again."],
    ];

    for (const [backendCode, expectedMessage] of cases) {
      tokenGet.mockResolvedValue({
        data: {
          balance: 3000,
        },
      });
      showToast.mockReset();
      const engine = createEngine();
      engine.callFlow.mockImplementation(async (flowName) => {
        if (flowName === "bookings.createBooking") {
          return {
            ok: false,
            error: {
              code: "CREATE_BOOKING_FAILED",
              details: {
                error: backendCode,
              },
            },
          };
        }
        return { ok: true, data: {} };
      });

      await mountAndSubmitStep3(engine);

      expect(showToast, backendCode).toHaveBeenCalledWith(expect.objectContaining({
        type: "error",
        title: "Booking Failed",
        message: expectedMessage,
      }));
    }
  });

  it("prefers structured validation errors over mapped backend booking codes", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createBooking") {
        return {
          ok: false,
          error: {
            code: "CREATE_BOOKING_FAILED",
            details: {
              error: "user_blocked",
              validation: {
                errors: [{
                  code: "subscription_required",
                  translationKey: "fan_booking_validation_subscription_required_tier",
                  params: { tier_name: "Gold" },
                }],
              },
            },
          },
        };
      }
      return { ok: true, data: {} };
    });

    await mountAndSubmitStep3(engine);

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      message: "An active subscription to Gold is required.",
    }));
  });

  it("keeps legacy validation messages ahead of backend booking code mapping", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createBooking") {
        return {
          ok: false,
          error: {
            code: "CREATE_BOOKING_FAILED",
            details: {
              error: "user_blocked",
              validation: {
                messages: ["Legacy validation copy."],
              },
            },
          },
        };
      }
      return { ok: true, data: {} };
    });

    await mountAndSubmitStep3(engine);

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      message: "Legacy validation copy.",
    }));
  });

  it("surfaces unknown backend booking codes instead of generic booking copy", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createBooking") {
        return {
          ok: false,
          error: {
            code: "CREATE_BOOKING_FAILED",
            details: {
              error: "some_new_backend_code",
            },
          },
        };
      }
      return { ok: true, data: {} };
    });

    await mountAndSubmitStep3(engine);

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      message: "some_new_backend_code",
    }));
  });

  it("prefers backend booking messages over mapped generic flow copy", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createBooking") {
        return {
          ok: false,
          error: {
            code: "CREATE_BOOKING_FAILED",
            message: "Failed to create booking.",
            details: {
              message: "This booking window closed 3 minutes ago.",
            },
          },
          meta: {
            uiErrors: ["Could not create booking. Please try again."],
          },
        };
      }
      return { ok: true, data: {} };
    });

    await mountAndSubmitStep3(engine);

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      message: "This booking window closed 3 minutes ago.",
    }));
  });

  it("uses booking backend codes instead of generic copy when no message is available", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createBooking") {
        return {
          ok: false,
          error: {
            code: "CREATE_BOOKING_FAILED",
            message: "Failed to create booking.",
            details: {},
          },
          meta: {
            uiErrors: ["Could not create booking. Please try again."],
          },
        };
      }
      return { ok: true, data: {} };
    });

    await mountAndSubmitStep3(engine);

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      message: "Booking request failed: CREATE_BOOKING_FAILED",
    }));
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
    expect(input.attributes("max")).toBe("8000");
    expect(range.attributes("max")).toBe("8000");

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

  it("allows event-goal contribution after the goal has already been reached", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    configureEventGoalGroup(engine, {
      eventGoalTokens: 1000,
      minContributionPerUser: 500,
      raw: {
        type: "group-event",
        eventType: "group-event",
        priceSetting: "eventGoal",
        eventGoalTokens: 1000,
        minContributionPerUser: 500,
        sessionDurationMinutes: 180,
      },
    });
    engine.state.bookingDetails.contributionTokens = 500;
    engine.state.bookingDetails.totalPrice = 500;
    engine.state.fanBooking.selection.contributionTokens = 500;
    engine.state.fanBooking.catalog.bookedSlotsIndex = {
      evt_goal_step3: {
        "2026-03-24": [{
          bookingId: "booking_goal_reached",
          startIso: "2026-03-24T10:00:00",
          endIso: "2026-03-24T13:00:00",
          startMs: new Date("2026-03-24T10:00:00").getTime(),
          endMs: new Date("2026-03-24T13:00:00").getTime(),
          status: "confirmed",
          contributionTokens: 1500,
        }],
      },
    };

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();

    const input = wrapper.get("#step3-event-goal-contribution");
    const range = wrapper.get("[data-testid='step3-event-goal-contribution-range']");

    expect(wrapper.get("[data-test='left-sidebar']").attributes("data-event-goal-percent")).toBe("100");
    expect(wrapper.text()).toContain("0 tokens remaining");
    expect(input.attributes("max")).toBe("3000");
    expect(range.attributes("max")).toBe("3000");
    expect(range.attributes("disabled")).toBeUndefined();
    expect(wrapper.find("[data-testid='step3-event-goal-contribution-error']").exists()).toBe(false);
    expect(wrapper.find("button[disabled]").exists()).toBe(false);

    await input.setValue("2000");
    await flushAsync();

    expect(engine.state.bookingDetails.contributionTokens).toBe(2000);
    expect(engine.state.fanBooking.selection.contributionTokens).toBe(2000);
  });

  it("hides schedule change and approval text for group bookings", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    configureEventGoalGroup(engine, {
      allowInstantBooking: false,
      raw: {
        type: "group-event",
        eventType: "group-event",
        priceSetting: "eventGoal",
        eventGoalTokens: 8000,
        minContributionPerUser: 500,
        sessionDurationMinutes: 180,
        allowInstantBooking: false,
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

    expect(wrapper.text()).toContain("BOOKING SCHEDULE");
    expect(wrapper.text()).toContain("March 24, 2026");
    expect(wrapper.text()).not.toContain("Change Schedule");
    expect(wrapper.text()).not.toContain("This booking needs to be approved by Creator Name before your session is confirmed.");
    expect(wrapper.get("[data-test='left-sidebar']").attributes("data-show-approval-needed")).toBe("false");
  });

  it("renders recurring group discount and off-hour surcharge payment lines", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    engine.state.bookingDetails = {
      ...engine.state.bookingDetails,
      selectedTime: {
        value: "20:00",
        startHm: "20:00",
        endHm: "23:00",
        offHours: true,
      },
      selectedDuration: { value: 180, price: 100 },
      totalPrice: 113,
      formattedTimeRange: "8:00 PM-11:00 PM",
    };
    engine.state.fanBooking.context.selectedEvent = {
      eventId: "evt_group_step3_discount",
      id: "evt_group_step3_discount",
      type: "group-event",
      eventType: "group-event",
      title: "Fixed Group",
      creatorName: "Creator Name",
      priceSetting: "fixedPricePerUser",
      basePriceTokens: 100,
      raw: {
        type: "group-event",
        eventType: "group-event",
        priceSetting: "fixedPricePerUser",
        basePriceTokens: 100,
        sessionDurationMinutes: 180,
      },
    };

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();

    const text = wrapper.text();
    expect(text).toContain("Recurring Event Discount (25%)");
    expect(text).toContain("Off-hour Surcharge (50%)");
    expect(text).toContain("113");
    expect(text).toContain("USD$ 6.78");
    expect(text.indexOf("Recurring Event Discount (25%)")).toBeLessThan(text.indexOf("Off-hour Surcharge (50%)"));
    expect(text.indexOf("Off-hour Surcharge (50%)")).toBeLessThan(text.indexOf("Session Total"));
  });

  it("continues rendering longer-session and first-time discount payment lines", async () => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const engine = createEngine();
    engine.state.bookingDetails = {
      ...engine.state.bookingDetails,
      selectedDuration: { value: 60, price: 200 },
      totalPrice: 140,
    };
    engine.state.fanBooking.context.selectedEvent = {
      eventId: "evt_private_step3_discounts",
      id: "evt_private_step3_discounts",
      type: "1on1-call",
      title: "Private Discounts",
      creatorName: "Creator Name",
      basePriceTokens: 100,
      raw: {
        type: "1on1-call",
        basePriceTokens: 100,
        sessionDurationMinutes: 30,
      },
    };

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();

    const text = wrapper.text();
    expect(text).toContain("Longer Session Discount");
    expect(text).toContain("First Time Discount");
    expect(text).toContain("140");
    expect(text).toContain("USD$ 8.40");
  });

  it("shows the captured booking payment total on the success screen", async () => {
    const engine = createEngine();
    engine.state.bookingDetails.totalPrice = 100;
    engine.state.fanBooking.booking = {
      bookingId: "booking_discounted",
      result: {
        bookingId: "booking_discounted",
        item: {
          bookingId: "booking_discounted",
          approvalStatus: "auto",
          payment: {
            total: 75,
            lines: [
              { code: "base", label: "Base Price", amount: 100 },
              { code: "recurring_event_discount", label: "Recurring Event Discount (25%)", amount: -25 },
            ],
          },
        },
      },
    };

    const { default: BookingFlowStep4 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep4.vue");
    const wrapper = mount(BookingFlowStep4, {
      props: {
        engine,
        embedded: true,
      },
    });

    await flushAsync();

    expect(wrapper.text()).toContain("Total: 75 tokens");
    expect(wrapper.text()).not.toContain("Total: 100 tokens");
  });
});
