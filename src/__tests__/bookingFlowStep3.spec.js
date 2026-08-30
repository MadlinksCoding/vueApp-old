import { mount } from "@vue/test-utils";
import { nextTick, reactive } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

const tokenGet = vi.fn();
const showToast = vi.fn();
const fetchUserProfileData = vi.fn();
const resolveParentUserData = vi.fn();
const flowRun = vi.fn();
const sendChatMessage = vi.fn();
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

function matchingTemporaryHold(temporaryHoldId, { userId = 2615 } = {}) {
  return {
    temporaryHoldId,
    eventId: "evt_123",
    userId,
    startIso: "2026-03-24T10:00:00.000Z",
    endIso: "2026-03-24T10:15:00.000Z",
    status: "active",
    expiresAt: new Date(Date.now() + 600000).toISOString(),
    secondsRemaining: 600,
  };
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

vi.mock("@/services/users/userProfileApi.js", () => ({
  fetchUserProfileData,
}));

vi.mock("@/utils/resolveParentUserData.js", () => ({
  resolveParentUserData,
}));

vi.mock("@/services/flow-system/FlowHandler", () => ({
  default: {
    run: flowRun,
  },
}));

vi.mock("@/composables/useChatSocket", () => ({
  useChatSocket: () => ({ sendChatMessage }),
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
            { code: "off_hour_surcharge", label: "Off-hour Surcharge", amount: 38 },
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

    if (selectedEvent.eventId === "evt_private_recording_summary") {
      return {
        ...requiredBookingFields,
        additionalRequests: { recording: true },
        requestedAddOns: [{ title: "Record review notes" }],
        payment: {
          lines: [
            { code: "base", label: "Base Price", amount: 60 },
            { code: "recording", label: "Recording", amount: 50 },
            { code: "addon", label: "Add-on: Record review notes", amount: 10 },
          ],
          total: 120,
        },
      };
    }

    return {
      ...requiredBookingFields,
      payment: {
        paymentPolicyVersion: 2,
        lines: [{ code: "base", amount: 1000 }],
        total: 1000,
        allocations: {
          service: 900 - (raw.enableCancellationFee ? Number(raw.cancellationFeeTokens || 0) : 0),
          bookingFee: 100,
          cancellationFee: raw.enableCancellationFee ? Number(raw.cancellationFeeTokens || 0) : 0,
        },
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
      "isFirstBookingForCreator",
    ],
    template: `
      <div
        data-test="left-sidebar"
        :data-is-group-event="String(isGroupEvent)"
        :data-show-approval-needed="String(showApprovalNeeded)"
        :data-first-booking="String(isFirstBookingForCreator)"
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
  bookingFlowMessageGreenIcon: "/message.webp",
  bookingFlowMessageGreenIconv2: "/message-v2.webp",
  bookingFlowPendingIcon: "/pending.webp",
  bookingFlowSuccessIcon: "/success.webp",
  bookingFlowProfileImage: "/profile.webp",
  bookingFlowTokenIcon: "/token.webp",
  bookingFlowVerifiedIcon: "/verified.webp",
  bookingFlowBackarrowIcon: "/backarrow.webp",
  bookingFlowTruckIcon: "/truck.webp",
}));

describe("BookingFlowStep3", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
	vi.unstubAllEnvs();
    tokenGet.mockReset();
    showToast.mockReset();
    fetchUserProfileData.mockReset();
    fetchUserProfileData.mockResolvedValue(null);
    resolveParentUserData.mockReset();
    resolveParentUserData.mockReturnValue({
      userAvatar: "https://example.test/current-user-avatar.jpg",
    });
    flowRun.mockReset();
    flowRun.mockResolvedValue({ ok: false, data: {} });
    sendChatMessage.mockReset();
    backendJwtToken = "jwt_test";
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  async function mountAndSubmitStep3(engine, props = {}, translations = {}) {
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: {
        engine,
        embedded: true,
        ...props,
      },
      global: {
        provide: {
          [bookingTranslationSymbol]: createBookingTranslator({ translations }),
        },
      },
    });

    await flushAsync();
    const policyCheckbox = wrapper.find("[data-testid='booking-attendance-policy-agreement'] input[type='checkbox']");
    if (policyCheckbox.exists()) {
      await policyCheckbox.setValue(true);
    }
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

  it("uses the injected WordPress avatar without fetching profile data", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    resolveParentUserData.mockReturnValue({
      userAvatar: "https://example.test/fans/current-avatar.jpg",
      user: { color_scheme: "#4361ee" },
    });
    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    const avatarCard = wrapper.get("[data-testid='booking-balance-avatar-card']");
    expect(wrapper.find("[data-testid='booking-balance-placeholder-card']").exists()).toBe(false);
    expect(avatarCard.attributes("style")).toContain("https://example.test/fans/current-avatar.jpg");
    expect(avatarCard.element.style.backgroundSize).toBe("cover");
    expect(avatarCard.element.style.backgroundPosition).toBe("center");
    expect(avatarCard.element.style.backgroundColor).toBe("");
    expect(avatarCard.text()).toContain("1.9K");
    expect(avatarCard.text()).toContain("900");
    expect(fetchUserProfileData).not.toHaveBeenCalled();
  });

  it("uses the injected color for an SVG WordPress avatar without fetching", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    resolveParentUserData.mockReturnValue({
      userAvatar: "https://example.test/fans/current-avatar.SVG?version=2#profile",
      user: { color_scheme: "  #4361ee  " },
    });
    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    const avatarCard = wrapper.get("[data-testid='booking-balance-avatar-card']");
    expect(avatarCard.attributes("style")).toContain("current-avatar.SVG?version=2#profile");
    expect(avatarCard.element.style.backgroundSize).toBe("48% 100%");
    expect(avatarCard.element.style.backgroundPosition).toBe("right");
    expect(avatarCard.element.style.backgroundColor).toBe("rgb(67, 97, 238)");
    expect(fetchUserProfileData).not.toHaveBeenCalled();
  });

  it("fills a missing SVG color from the profile endpoint without replacing the injected avatar", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    resolveParentUserData.mockReturnValue({
      userAvatar: "https://example.test/fans/injected-avatar.svg",
      user: { color_scheme: null },
    });
    fetchUserProfileData.mockResolvedValue({
      avatar: "https://example.test/fans/endpoint-avatar.svg",
      color_scheme: "#ff76dd",
    });
    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    const avatarCard = wrapper.get("[data-testid='booking-balance-avatar-card']");
    expect(fetchUserProfileData).toHaveBeenCalledWith(2615, {
      signal: expect.any(AbortSignal),
    });
    expect(avatarCard.attributes("style")).toContain("injected-avatar.svg");
    expect(avatarCard.attributes("style")).not.toContain("endpoint-avatar.svg");
    expect(avatarCard.element.style.backgroundColor).toBe("rgb(255, 118, 221)");
  });

  it("uses the generic card for an injected placeholder avatar without fetching", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    resolveParentUserData.mockReturnValue({
      userAvatar: "https://example.test/avatars/PLACEHOLDER-user.png",
    });
    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    const genericCard = wrapper.get("[data-testid='booking-balance-placeholder-card']");
    expect(wrapper.find("[data-testid='booking-balance-avatar-card']").exists()).toBe(false);
    expect(genericCard.text()).toContain("1.9K");
    expect(genericCard.text()).toContain("900");
    expect(fetchUserProfileData).not.toHaveBeenCalled();
  });

  it("fetches an SVG avatar and color using the engine fan id when WordPress has no avatar", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    resolveParentUserData.mockReturnValue({});
    fetchUserProfileData.mockResolvedValue({
      avatar_url: "https://example.test/fans/profile-avatar.svg",
      color_scheme: "#4361ee",
    });
    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    expect(fetchUserProfileData).toHaveBeenCalledWith(2615, {
      signal: expect.any(AbortSignal),
    });
    const avatarCard = wrapper.get("[data-testid='booking-balance-avatar-card']");
    expect(avatarCard.attributes("style")).toContain("https://example.test/fans/profile-avatar.svg");
    expect(avatarCard.element.style.backgroundColor).toBe("rgb(67, 97, 238)");
    expect(wrapper.find("[data-testid='booking-balance-placeholder-card']").exists()).toBe(false);
  });

  it.each([
    ["empty", ""],
    ["null", null],
    ["invalid", "blue"],
  ])("omits an %s color for an SVG avatar", async (_label, colorScheme) => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    resolveParentUserData.mockReturnValue({
      userAvatar: "https://example.test/fans/current-avatar.svg",
      user: { color_scheme: colorScheme },
    });
    fetchUserProfileData.mockResolvedValue({ color_scheme: colorScheme });
    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    expect(wrapper.get("[data-testid='booking-balance-avatar-card']").element.style.backgroundColor).toBe("");
    wrapper.unmount();
  });

  it("ignores the endpoint color for a raster avatar", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    resolveParentUserData.mockReturnValue({});
    fetchUserProfileData.mockResolvedValue({
      avatar: "https://example.test/fans/profile-avatar.png",
      color_scheme: "#4361ee",
    });
    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    const avatarCard = wrapper.get("[data-testid='booking-balance-avatar-card']");
    expect(avatarCard.attributes("style")).toContain("profile-avatar.png");
    expect(avatarCard.element.style.backgroundSize).toBe("cover");
    expect(avatarCard.element.style.backgroundPosition).toBe("center");
    expect(avatarCard.element.style.backgroundColor).toBe("");
  });

  it("retains an injected SVG avatar when its color fallback fails", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    resolveParentUserData.mockReturnValue({
      userAvatar: "https://example.test/fans/current-avatar.svg",
      user: { color_scheme: "" },
    });
    fetchUserProfileData.mockRejectedValue(new Error("profile unavailable"));
    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    const avatarCard = wrapper.get("[data-testid='booking-balance-avatar-card']");
    expect(avatarCard.attributes("style")).toContain("current-avatar.svg");
    expect(avatarCard.element.style.backgroundColor).toBe("");
    expect(showToast).not.toHaveBeenCalled();
  });

  it.each([
    ["placeholder response", { avatar: "https://example.test/placeholder.png" }, null],
    ["missing response", null, null],
    ["failed response", null, new Error("profile unavailable")],
  ])("keeps the generic card for a %s", async (_label, profile, failure) => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    resolveParentUserData.mockReturnValue({});
    if (failure) fetchUserProfileData.mockRejectedValue(failure);
    else fetchUserProfileData.mockResolvedValue(profile);
    const engine = createEngine();
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    expect(wrapper.find("[data-testid='booking-balance-avatar-card']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='booking-balance-placeholder-card']").exists()).toBe(true);
    expect(showToast).not.toHaveBeenCalled();
  });

  it("refreshes the profile avatar and color after authenticated fan context is applied", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    resolveParentUserData.mockReturnValue({});
    fetchUserProfileData.mockImplementation(async (userId) => (
      userId === 8123
        ? {
            userAvatar: "https://example.test/fans/authenticated-avatar.svg",
            color_scheme: "#4361ee",
          }
        : null
    ));
    const engine = createEngine();
    engine.substep = "topup";
    engine.callFlow.mockResolvedValue({ ok: true, data: {} });
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();
    await vi.dynamicImportSettled();
    await flushAsync();

    await wrapper.getComponent({ name: "TopUpForm" }).vm.$emit("auth-updated", {
      userId: 8123,
      backendJwtToken: "jwt_authenticated",
    });
    await flushAsync();

    engine.substep = "summary";
    await flushAsync();

    expect(engine.getState("fanBooking.context.fanId")).toBe(8123);
    expect(fetchUserProfileData).toHaveBeenCalledWith(8123, {
      signal: expect.any(AbortSignal),
    });
    const avatarCard = wrapper.get("[data-testid='booking-balance-avatar-card']");
    expect(avatarCard.attributes("style")).toContain("https://example.test/fans/authenticated-avatar.svg");
    expect(avatarCard.element.style.backgroundColor).toBe("rgb(67, 97, 238)");
  });

  it("translates the attendance policy and hidden available-balance row with dynamic amounts", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    const engine = createEngine();
    const translator = createBookingTranslator({
      locale: "zh",
      translations: {
        fan_booking_available_balance_after_booking: "预订后可用余额",
        fan_booking_attendance_policy_acknowledgment: "我理解并同意以下政策：",
        fan_booking_attendance_policy_grace_period: "预定开始后有五分钟宽限期。",
        fan_booking_attendance_policy_creator_no_show: "创作者未到场时全额退款。",
        fan_booking_attendance_policy_fan_no_show: "粉丝未到场时视为弃权。",
      },
    });
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, {
      props: { engine, embedded: true },
      global: {
        provide: {
          [bookingTranslationSymbol]: translator,
        },
      },
    });
    await flushAsync();

    const policy = wrapper.get("[data-testid='booking-attendance-policy-agreement']");
    expect(policy.text()).toContain("我理解并同意以下政策：");
    expect(policy.text()).toContain("预定开始后有五分钟宽限期。");
    expect(policy.text()).toContain("创作者未到场时全额退款。");
    expect(policy.text()).toContain("粉丝未到场时视为弃权。");
    expect(policy.findAll("ol > li")).toHaveLength(3);
    const availableBalance = wrapper.get("[data-testid='booking-balance-available-after-booking']");
    expect(availableBalance.text()).toContain("预订后可用余额");
    expect(availableBalance.text()).toContain("900");
    expect(availableBalance.text()).not.toContain("29,100");
  });

  it("opens the attendance popup for an unchecked private booking and resumes once after confirmation", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    const engine = createEngine();
    engine.callFlow.mockResolvedValue({ ok: true, data: { bookingId: "booking_policy_confirmed" } });
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    const actionButton = wrapper.findAll("button").at(-1);
    await actionButton.trigger("click");
    await flushAsync();

    const popup = wrapper.getComponent({ name: "ReadAndUnderstandPopup" });
    expect(popup.props("modelValue")).toBe(true);
    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createBooking")).toHaveLength(0);

    popup.vm.$emit("confirm");
    popup.vm.$emit("confirm");
    await flushAsync();

    expect(wrapper.get("[data-testid='booking-attendance-policy-agreement'] input").element.checked).toBe(true);
    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createBooking")).toHaveLength(1);
  });

  it("closes an unchecked attendance popup without continuing", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    const engine = createEngine();
    engine.callFlow.mockResolvedValue({ ok: true, data: {} });
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    await wrapper.findAll("button").at(-1).trigger("click");
    await flushAsync();
    const popup = wrapper.getComponent({ name: "ReadAndUnderstandPopup" });
    popup.vm.$emit("update:modelValue", false);
    await flushAsync();

    expect(popup.props("modelValue")).toBe(false);
    expect(wrapper.get("[data-testid='booking-attendance-policy-agreement'] input").element.checked).toBe(false);
    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createBooking")).toHaveLength(0);
  });

  it("bypasses the popup when the private attendance policy is checked", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    const engine = createEngine();
    engine.callFlow.mockResolvedValue({ ok: true, data: { bookingId: "booking_policy_checked" } });
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    await wrapper.get("[data-testid='booking-attendance-policy-agreement'] input").setValue(true);
    await wrapper.findAll("button").at(-1).trigger("click");
    await flushAsync();

    expect(wrapper.getComponent({ name: "ReadAndUnderstandPopup" }).props("modelValue")).toBe(false);
    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createBooking")).toHaveLength(1);
  });

  it("confirms the attendance policy before entering private top-up", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 300 } });
    const engine = createEngine();
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createTemporaryHold") {
        engine.state.fanBooking.temporaryHold.temporaryHoldId = "temphold_policy_topup";
        engine.state.fanBooking.temporaryHold.status = "active";
        engine.state.fanBooking.temporaryHold.expiresAt = new Date(Date.now() + 600000).toISOString();
        return { ok: true, data: { temporaryHoldId: "temphold_policy_topup" } };
      }
      if (flowName === "bookings.getTemporaryHoldStatus") {
        const hold = matchingTemporaryHold("temphold_policy_topup");
        return { ok: true, data: { ...hold, temporaryHold: hold } };
      }
      return { ok: true, data: {} };
    });
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    await wrapper.findAll("button").at(-1).trigger("click");
    await flushAsync();
    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createTemporaryHold")).toHaveLength(0);

    wrapper.getComponent({ name: "ReadAndUnderstandPopup" }).vm.$emit("confirm");
    await flushAsync();

    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createTemporaryHold")).toHaveLength(1);
    expect(engine.forceSubstep).toHaveBeenCalledWith("topup", { intent: "topup-needed" });
  });

  it("keeps the attendance policy accepted when a private booking fails and is retried", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    const engine = createEngine();
    engine.callFlow.mockResolvedValue({ ok: false, error: { code: "internal_error" } });
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    const policyCheckbox = wrapper.get("[data-testid='booking-attendance-policy-agreement'] input");
    await policyCheckbox.setValue(true);
    const actionButton = wrapper.findAll("button").at(-1);
    await actionButton.trigger("click");
    await flushAsync();
    await actionButton.trigger("click");
    await flushAsync();

    expect(policyCheckbox.element.checked).toBe(true);
    expect(wrapper.getComponent({ name: "ReadAndUnderstandPopup" }).props("modelValue")).toBe(false);
    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createBooking")).toHaveLength(2);
  });

  it("does not show the private attendance acknowledgment for group events", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 3000 } });
    const engine = createEngine();
    configureEventGoalGroup(engine);
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    expect(wrapper.find("[data-testid='booking-attendance-policy-agreement']").exists()).toBe(false);
  });

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
    engine.state.fanBooking.context.isFirstBookingForCreator = true;
    engine.state.bookingDetails.displayTimezoneOffsetMinutes = 480;
    engine.state.bookingDetails.displayTimezoneLabel = "GMT+08:00";
    engine.state.fanBooking.temporaryHold = {
      temporaryHoldId: "temphold_change_schedule",
      status: "active",
      guestHoldToken: null,
    };
    engine.callFlow.mockResolvedValue({ ok: true, data: {} });
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
    expect(text).toContain("GMT+08:00 10:00 AM-10:15 AM");
    expect(wrapper.get("[data-test='left-sidebar']").attributes("data-first-booking")).toBe("true");
    expect(text).toContain("Creator Name");
    expect(text).toContain("15 Minute x 2 sessions (30 Min.)");
    expect(text).toContain("1,000");
    expect(text).not.toContain("USD$ 60.00");
    expect(text).not.toContain("=USD$ 6.00");
    expect(text).toContain("This booking needs to be approved by Creator Name before your session is confirmed.");
    expect(text).not.toContain("@model");
    expect(text).not.toContain("09 Dec 2026");
    expect(text).not.toContain("224.99");

    await wrapper.get("button").trigger("click");
    await vi.waitFor(() => {
      expect(engine.goToStep).toHaveBeenCalledWith(2);
    });

    expect(engine.callFlow).toHaveBeenCalledWith(
      "bookings.releaseTemporaryHold",
      { temporaryHoldId: "temphold_change_schedule" },
      expect.objectContaining({ context: expect.objectContaining({ requestTimeoutMs: 3000 }) }),
    );
    expect(engine.forceSubstep).toHaveBeenCalledWith(null, { intent: "change-schedule" });
    expect(engine.goToStep).toHaveBeenCalledWith(2);
  });

  it("navigates back to previous step when back button is clicked", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 1900 } });
    const engine = createEngine();
    engine.state.fanBooking.temporaryHold = {
      temporaryHoldId: "temphold_back",
      status: "active",
      guestHoldToken: null,
    };
    engine.callFlow.mockResolvedValue({ ok: true, data: {} });
    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");

    const wrapper = mount(BookingFlowStep3, {
      props: { engine, embedded: true },
    });

    await flushAsync();

    const backButton = wrapper.findAll("button").find(b => b.text().includes("Back") || b.text().includes("fan_booking_back"));
    expect(backButton.exists()).toBe(true);

    await backButton.trigger("click");
    await vi.waitFor(() => {
      expect(engine.goToStep).toHaveBeenCalledWith(2);
    });

    expect(engine.callFlow).toHaveBeenCalledWith(
      "bookings.releaseTemporaryHold",
      { temporaryHoldId: "temphold_back" },
      expect.any(Object),
    );
    expect(engine.forceSubstep).toHaveBeenCalledWith(null, { intent: "back" });
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
    expect(wrapper.text()).toContain("TOP-UP & PAY");
  });

  it("keeps the included cancellation allocation inside the maximum held balance", async () => {
    tokenGet.mockResolvedValue({
      data: {
        paidTokens: 1100,
        freeTokensPerBeneficiary: {},
        totalFreeTokens: 0,
      },
    });
    const engine = createEngine();
    engine.state.fanBooking.context.selectedEvent.raw.enableCancellationFee = true;
    engine.state.fanBooking.context.selectedEvent.raw.cancellationFeeTokens = 200;

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: { engine, embedded: true },
    });

    await flushAsync();

    expect(wrapper.text()).toContain("Cancellation allocation included");
    expect(wrapper.text()).not.toContain("Maximum temporarily held");
    expect(wrapper.text()).toContain("1,000");
    expect(wrapper.text()).not.toContain("1,200");
    expect(wrapper.text()).not.toContain("TOP UP NEEDED");
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
        const hold = matchingTemporaryHold("temphold_evt_123_1_1", { userId: 0 });
        return {
          ok: true,
          data: {
            ...hold,
            temporaryHold: hold,
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
    await wrapper.get("[data-testid='booking-attendance-policy-agreement'] input").setValue(true);
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

  it("revalidates and reuses the same hold after a failed payment retry", async () => {
    tokenGet
      .mockResolvedValueOnce({ data: { balance: 300 } })
      .mockResolvedValue({ data: { balance: 1000 } });
    const engine = createEngine();
    let statusChecks = 0;
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createTemporaryHold") {
        return { ok: true, data: { temporaryHoldId: "temphold_retry" } };
      }
      if (flowName === "bookings.getTemporaryHoldStatus") {
        statusChecks += 1;
        const hold = matchingTemporaryHold("temphold_retry");
        return { ok: true, data: { ...hold, temporaryHold: hold } };
      }
      if (flowName === "bookings.createBooking") {
        return { ok: true, data: { bookingId: "booking_after_payment_retry", eventId: "evt_123" } };
      }
      return { ok: true, data: {} };
    });

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();
    await wrapper.get("[data-testid='booking-attendance-policy-agreement'] input").setValue(true);
    await wrapper.findAll("button").at(-1).trigger("click");
    await vi.waitFor(() => {
      expect(engine.forceSubstep).toHaveBeenCalledWith("topup", { intent: "topup-needed" });
    });

    engine.substep = "topup";
    await vi.dynamicImportSettled();
    await flushAsync();
    wrapper.getComponent({ name: "TopUpForm" }).vm.$emit("payment-failed");
    engine.substep = "summary";
    await flushAsync();

    await wrapper.findAll("button").at(-1).trigger("click");
    await vi.waitFor(() => {
      expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.getTemporaryHoldStatus").length).toBeGreaterThanOrEqual(2);
    });
    engine.substep = "topup";
    await flushAsync();
    wrapper.getComponent({ name: "TopUpForm" }).vm.$emit("success", {
      userId: 2615,
      backendJwtToken: "jwt_after_retry",
    });
    await vi.waitFor(() => {
      expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createBooking")).toHaveLength(1);
    });

    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createTemporaryHold")).toHaveLength(1);
    expect(statusChecks).toBeGreaterThanOrEqual(3);
    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createBooking")).toHaveLength(1);
    expect(engine.goToStep).toHaveBeenCalledWith(4);
  });

  it("releases and replaces a recovered hold whose booking fingerprint does not match", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 300 } });
    const engine = createEngine();
    engine.state.fanBooking.temporaryHold = {
      temporaryHoldId: "temphold_wrong_slot",
      status: "active",
      expiresAt: new Date(Date.now() + 600000).toISOString(),
      secondsRemaining: 600,
    };
    engine.callFlow.mockImplementation(async (flowName, payload) => {
      if (flowName === "bookings.getTemporaryHoldStatus" && payload?.temporaryHoldId === "temphold_wrong_slot") {
        const hold = {
          ...matchingTemporaryHold("temphold_wrong_slot"),
          startIso: "2026-03-24T11:00:00.000Z",
          endIso: "2026-03-24T11:15:00.000Z",
        };
        return { ok: true, data: { ...hold, temporaryHold: hold } };
      }
      if (flowName === "bookings.releaseTemporaryHold") return { ok: true, data: {} };
      if (flowName === "bookings.createTemporaryHold") {
        return { ok: true, data: { temporaryHoldId: "temphold_replacement" } };
      }
      if (flowName === "bookings.getTemporaryHoldStatus") {
        const hold = matchingTemporaryHold("temphold_replacement");
        return { ok: true, data: { ...hold, temporaryHold: hold } };
      }
      return { ok: true, data: {} };
    });

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();
    await wrapper.get("[data-testid='booking-attendance-policy-agreement'] input").setValue(true);
    await wrapper.findAll("button").at(-1).trigger("click");
    await vi.waitFor(() => {
      expect(engine.forceSubstep).toHaveBeenCalledWith("topup", { intent: "topup-needed" });
    });

    const lifecycleCalls = engine.callFlow.mock.calls
      .filter(([name]) => [
        "bookings.getTemporaryHoldStatus",
        "bookings.releaseTemporaryHold",
        "bookings.createTemporaryHold",
      ].includes(name))
      .map(([name]) => name);
    expect(lifecycleCalls).toEqual([
      "bookings.getTemporaryHoldStatus",
      "bookings.releaseTemporaryHold",
      "bookings.createTemporaryHold",
      "bookings.getTemporaryHoldStatus",
    ]);
    expect(engine.getState("fanBooking.temporaryHold.temporaryHoldId")).toBe("temphold_replacement");
    expect(engine.forceSubstep).toHaveBeenCalledWith("topup", { intent: "topup-needed" });
  });

  it("keeps purchased tokens and returns to scheduling when post-top-up hold repair fails", async () => {
    tokenGet
      .mockResolvedValueOnce({ data: { balance: 300 } })
      .mockResolvedValue({ data: { balance: 1000 } });
    const engine = createEngine();
    let createAttempts = 0;
    let statusChecks = 0;
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createTemporaryHold") {
        createAttempts += 1;
        return createAttempts === 1
          ? { ok: true, data: { temporaryHoldId: "temphold_post_topup" } }
          : { ok: false, error: { code: "slot_already_held", message: "This slot is already temporarily held" } };
      }
      if (flowName === "bookings.getTemporaryHoldStatus") {
        statusChecks += 1;
        const hold = statusChecks <= 2
          ? matchingTemporaryHold("temphold_post_topup")
          : {
              ...matchingTemporaryHold("temphold_post_topup"),
              eventId: "evt_other",
            };
        return { ok: true, data: { ...hold, temporaryHold: hold } };
      }
      if (flowName === "bookings.releaseTemporaryHold") return { ok: true, data: {} };
      if (flowName === "bookings.createBooking") {
        return { ok: true, data: { bookingId: "must_not_be_created" } };
      }
      return { ok: true, data: {} };
    });

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();
    await wrapper.get("[data-testid='booking-attendance-policy-agreement'] input").setValue(true);
    await wrapper.findAll("button").at(-1).trigger("click");
    await vi.waitFor(() => {
      expect(engine.forceSubstep).toHaveBeenCalledWith("topup", { intent: "topup-needed" });
    });
    engine.substep = "topup";
    await vi.dynamicImportSettled();
    await flushAsync();

    wrapper.getComponent({ name: "TopUpForm" }).vm.$emit("success", {
      userId: 2615,
      backendJwtToken: "jwt_after_topup",
    });
    await vi.waitFor(() => {
      expect(engine.goToStep).toHaveBeenCalledWith(2);
    });

    expect(createAttempts).toBe(2);
    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createBooking")).toHaveLength(0);
    expect(engine.forceSubstep.mock.calls.filter(([substep]) => substep === "topup")).toHaveLength(1);
    expect(engine.goToStep).toHaveBeenCalledWith(2);
    expect(engine.getState("bookingDetails.walletBalance")).toBe(1000);
    expect(wrapper.emitted("balance-changed")).toEqual([[{ reason: "top-up" }]]);
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

  it("waits for the authoritative top-up balance before creating the booking", async () => {
    tokenGet
      .mockResolvedValueOnce({ data: { balance: 300 } })
      .mockResolvedValueOnce({ data: { balance: 300 } })
      .mockRejectedValueOnce(new Error("temporary token service error"))
      .mockResolvedValueOnce({ data: { balance: 500 } });

    const engine = createEngine();
    configureEventGoalGroup(engine);
    engine.substep = "topup";
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createBooking") {
        return { ok: true, data: { bookingId: "booking_after_topup", eventId: "evt_123" } };
      }
      return { ok: true, data: {} };
    });

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();
    await vi.dynamicImportSettled();
    await flushAsync();
    vi.useFakeTimers();

    wrapper.getComponent({ name: "TopUpForm" }).vm.$emit("success", {
      userId: 2615,
      backendJwtToken: "jwt_after_topup",
    });
    await flushAsync();

    expect(engine.callFlow.mock.calls.some(([name]) => name === "bookings.createBooking")).toBe(false);

    await vi.advanceTimersByTimeAsync(1000);
    await flushAsync();
    expect(engine.callFlow.mock.calls.some(([name]) => name === "bookings.createBooking")).toBe(false);

    await vi.advanceTimersByTimeAsync(1000);
    await flushAsync();

    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createBooking")).toHaveLength(1);
    expect(engine.goToStep).toHaveBeenCalledWith(4);
    expect(engine.getState("bookingDetails.walletBalance")).toBe(0);
    expect(wrapper.emitted("balance-changed")).toEqual([[{ reason: "top-up" }]]);
  });

  it("keeps a timed-out top-up retryable without requesting another payment", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 300 } });

    const engine = createEngine();
    configureEventGoalGroup(engine);
    engine.substep = "topup";
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createBooking") {
        return { ok: true, data: { bookingId: "booking_after_delayed_topup", eventId: "evt_123" } };
      }
      return { ok: true, data: {} };
    });

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();
    await vi.dynamicImportSettled();
    await flushAsync();
    vi.useFakeTimers();

    wrapper.getComponent({ name: "TopUpForm" }).vm.$emit("success", {
      userId: 2615,
      backendJwtToken: "jwt_after_topup",
    });
    await flushAsync();
    await vi.advanceTimersByTimeAsync(15000);
    await flushAsync();

    expect(engine.callFlow.mock.calls.some(([name]) => name === "bookings.createBooking")).toBe(false);
    expect(engine.forceSubstep).toHaveBeenCalledWith("summary", { intent: "topup-balance-sync-delayed" });
    expect(showToast).toHaveBeenCalledWith({
      type: "warning",
      title: "Top-up Successful",
      message: "Your payment succeeded, but your token balance is still updating. Please wait a moment, then complete your booking again. You will not be charged twice.",
    });
    expect(engine.getState("bookingDetails.walletBalance")).toBe(500);
    expect(wrapper.emitted("balance-changed")).toBeUndefined();

    tokenGet.mockResolvedValue({ data: { balance: 500 } });
    engine.substep = "summary";
    await flushAsync();
    const buttons = wrapper.findAll("button");
    await buttons[buttons.length - 1].trigger("click");
    await flushAsync();

    expect(engine.callFlow.mock.calls.filter(([name]) => name === "bookings.createBooking")).toHaveLength(1);
    expect(engine.goToStep).toHaveBeenCalledWith(4);
    expect(wrapper.emitted("balance-changed")).toEqual([[{ reason: "top-up" }]]);
  });

  it("cancels top-up balance polling when the component unmounts", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 300 } });

    const engine = createEngine();
    configureEventGoalGroup(engine);
    engine.substep = "topup";
    engine.callFlow.mockResolvedValue({ ok: true, data: {} });

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();
    await vi.dynamicImportSettled();
    await flushAsync();
    vi.useFakeTimers();

    wrapper.getComponent({ name: "TopUpForm" }).vm.$emit("success", {
      userId: 2615,
      backendJwtToken: "jwt_after_topup",
    });
    await flushAsync();
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(15000);
    await flushAsync();

    expect(engine.callFlow.mock.calls.some(([name]) => name === "bookings.createBooking")).toBe(false);
    expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: "Top-up Successful",
    }));
  });

  it("translates all known direct create-booking backend error codes", async () => {
    const cases = [
      ["missing_bearer_token", "Please log in to complete your booking."],
      ["missing_jwt_secret_key", "Could not verify your session. Please try again."],
      ["invalid_jwt_issuer", "Your session could not be verified. Please log in again."],
      ["invalid_jwt_audience", "Your session could not be verified. Please log in again."],
      ["jwt_missing_exp", "JWT is missing exp"],
      ["jwt_invalid_exp", "JWT exp is invalid"],
      ["jwt_expired", "JWT is expired"],
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
      ["slot_already_taken", "This slot has already been booked. Try booking a different slot"],
      ["slot_already_booked", "This slot has already been booked. Try booking a different slot"],
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

  it.each([
    ["booking_overlaps_existing"],
    ["booking_buffer_after_booked_required"],
  ])("handles stale slot validation code %s by returning to Step 2", async (validationCode) => {
    tokenGet.mockResolvedValue({
      data: {
        balance: 3000,
      },
    });
    const refreshBookingContext = vi.fn(async () => ({ ok: true }));
    const engine = createEngine();
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createBooking") {
        return {
          ok: false,
          error: {
            code: "CREATE_BOOKING_FAILED",
            details: {
              error: "validation_failed",
              validation: {
                errors: [{
                  code: validationCode,
                  translationKey: validationCode === "booking_overlaps_existing"
                    ? "fan_booking_validation_booking_overlaps_existing"
                    : "fan_booking_validation_booking_buffer_after_booked_required",
                  params: { buffer_minutes: 15 },
                }],
              },
            },
          },
        };
      }
      return { ok: true, data: {} };
    });

    await mountAndSubmitStep3(engine, { refreshBookingContext });

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      title: "Booking Failed",
      message: "This slot has already been booked. Try booking a different slot",
    }));
    expect(refreshBookingContext).toHaveBeenCalledWith({
      silent: true,
      preserveSelectedEvent: true,
    });
    expect(engine.goToStep).toHaveBeenCalledWith(2);
    expect(engine.state.bookingDetails.selectedTime).toBeNull();
    expect(engine.state.fanBooking.selection.selectedSlot).toBeNull();
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

    await mountAndSubmitStep3(engine, {}, {
      fan_booking_request_failed_with_code: "Échec de la demande : {code}",
    });

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      message: "Échec de la demande : CREATE_BOOKING_FAILED",
    }));
  });

  it("translates event-specific booking chat metadata and request messages", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 3000 } });
    const engine = createEngine();
    engine.state.fanBooking.context.creatorId = 793;
    engine.state.fanBooking.booking.result = {
      item: {
        startAtIso: "2026-03-24T10:00:00.000Z",
        endAtIso: "2026-03-24T10:15:00.000Z",
      },
    };
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createBooking") {
        return {
          ok: true,
          data: {
            bookingId: "booking_translated_chat",
            eventId: "evt_123",
          },
        };
      }
      return { ok: true, data: {} };
    });
    flowRun.mockImplementation(async (flowName) => {
      if (flowName === "chat.fetchUserChats") return { ok: true, data: { items: [] } };
      if (flowName === "chat.createChat") return { ok: true, data: { chatId: "chat_translated" } };
      if (flowName === "chat.sendBookingRequestMessage") {
        return { ok: true, data: { item: { message_id: "message_translated" } } };
      }
      return { ok: true, data: {} };
    });
    const originalSendBeacon = navigator.sendBeacon;
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn(() => true),
    });

    try {
      await mountAndSubmitStep3(engine, {}, {
        fan_booking_request_description: "Demande de réservation pour {event}",
        fan_booking_request_message_on_date: "Demande pour \"{event}\" le {date}",
      });
      for (let pass = 0; pass < 6; pass += 1) await flushAsync();

      expect(flowRun).toHaveBeenCalledWith("chat.createChat", expect.objectContaining({
        name: "Test Event",
        description: "Demande de réservation pour Test Event",
        metadata: expect.objectContaining({
          booking_translated_chat: expect.objectContaining({
            eventId: "evt_123",
            description: "Demande de réservation pour Test Event",
          }),
        }),
      }));
      expect(flowRun).toHaveBeenCalledWith("chat.sendBookingRequestMessage", expect.objectContaining({
        text: "Demande pour \"Test Event\" le 2026-03-24T10:00:00.000Z",
      }));
    } finally {
      Object.defineProperty(navigator, "sendBeacon", {
        configurable: true,
        value: originalSendBeacon,
      });
    }
  });

  it("translates generic booking chat fallbacks when the event title is missing", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 3000 } });
    const engine = createEngine();
    engine.state.fanBooking.context.creatorId = 793;
    engine.state.fanBooking.context.selectedEvent.title = "";
    engine.callFlow.mockImplementation(async (flowName) => {
      if (flowName === "bookings.createBooking") {
        return {
          ok: true,
          data: {
            bookingId: "booking_generic_chat",
            eventId: "evt_123",
          },
        };
      }
      return { ok: true, data: {} };
    });
    flowRun.mockImplementation(async (flowName) => {
      if (flowName === "chat.fetchUserChats") return { ok: true, data: { items: [] } };
      if (flowName === "chat.createChat") return { ok: true, data: { chatId: "chat_generic" } };
      if (flowName === "chat.sendBookingRequestMessage") {
        return { ok: true, data: { item: { message_id: "message_generic" } } };
      }
      return { ok: true, data: {} };
    });
    const originalSendBeacon = navigator.sendBeacon;
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn(() => true),
    });

    try {
      await mountAndSubmitStep3(engine, {}, {
        fan_booking_request: "Demande de réservation",
        fan_booking_chat_name: "Discussion de réservation",
      });
      for (let pass = 0; pass < 6; pass += 1) await flushAsync();

      expect(flowRun).toHaveBeenCalledWith("chat.createChat", expect.objectContaining({
        name: "Discussion de réservation",
        description: "Demande de réservation",
      }));
      expect(flowRun).toHaveBeenCalledWith("chat.sendBookingRequestMessage", expect.objectContaining({
        text: "Demande de réservation",
      }));
    } finally {
      Object.defineProperty(navigator, "sendBeacon", {
        configurable: true,
        value: originalSendBeacon,
      });
    }
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
    expect(wrapper.text()).toContain("TOP-UP & PAY");
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
        recurringDiscountPercentOfBase: 25,
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
    expect(text).toContain("Off-hour Surcharge");
    expect(text).toContain("113");
    expect(text).not.toContain("USD$ 6.78");
    expect(text.indexOf("Recurring Event Discount (25%)")).toBeLessThan(text.indexOf("Off-hour Surcharge"));
    expect(text.indexOf("Off-hour Surcharge")).toBeLessThan(text.indexOf("Session Total"));
  });

  it("renders payment codes and active tooltips with locale translations", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 3000 } });
    const engine = createEngine();
    engine.state.bookingDetails = {
      ...engine.state.bookingDetails,
      selectedTime: { value: "20:00", startHm: "20:00", endHm: "23:00", offHours: true },
      selectedDuration: { value: 180, price: 100 },
      totalPrice: 113,
    };
    engine.state.fanBooking.context.selectedEvent = {
      eventId: "evt_group_step3_discount",
      type: "group-event",
      title: "Fixed Group",
      priceSetting: "fixedPricePerUser",
      raw: {
        type: "group-event",
        priceSetting: "fixedPricePerUser",
        basePriceTokens: 100,
        sessionDurationMinutes: 180,
        recurringDiscountPercentOfBase: 25,
      },
    };
    const translator = createBookingTranslator({
      locale: "zh",
      translations: {
        fan_booking_recurring_event_discount: "回头客活动折扣（{percent}%）",
        fan_booking_off_hour_surcharge: "非工作时间附加费",
        fan_booking_discount_tooltip: "创作者可以为粉丝提供不同折扣。",
        fan_booking_extra_fee_tooltip: "部分创作者可能收取不可退还的附加费。",
      },
    });

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: { engine, embedded: true },
      global: {
        provide: {
          [bookingTranslationSymbol]: translator,
        },
      },
    });
    await flushAsync();

    const text = wrapper.text();
    expect(text).toContain("回头客活动折扣（25%）");
    expect(text).toContain("非工作时间附加费");
    expect(text).toContain("创作者可以为粉丝提供不同折扣。");
    expect(text).not.toContain("Recurring Event Discount (25%)");
    expect(text).not.toContain("Off-hour Surcharge");
  });

  it("uses booking deposit terminology and translates its conditionally refundable tooltip", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 3000 } });
    const engine = createEngine();
    engine.state.fanBooking.context.selectedEvent.raw.enableBookingFee = true;
    engine.state.fanBooking.context.selectedEvent.raw.bookingFeeTokens = 25;
    const translator = createBookingTranslator({
      locale: "zh",
      translations: {
        fan_booking_extra_fee_tooltip: "部分创作者可能收取不可退还的附加费。",
      },
    });

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, {
      props: { engine, embedded: true },
      global: {
        provide: {
          [bookingTranslationSymbol]: translator,
        },
      },
    });
    await flushAsync();

    expect(wrapper.text()).toContain("部分创作者可能收取不可退还的附加费。");
    expect(wrapper.text()).toContain("Booking deposit included");
    expect(wrapper.text()).not.toContain("Booking fee included");
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
    expect(text).not.toContain("USD$ 8.40");
  });

  it("renders translated recording metadata while using the canonical mapped total", async () => {
    tokenGet.mockResolvedValue({ data: { balance: 3000 } });
    const engine = createEngine();
    engine.state.bookingDetails = {
      ...engine.state.bookingDetails,
      selectedDuration: { value: 30, price: 60 },
      addons: [
        { id: "evt_private_recording_summary_recording", kind: "recording", name: "录制我们的会话", price: 50 },
        { id: "addon_record_review", kind: "addon", name: "Record review notes", price: 10 },
      ],
      totalPrice: 120,
    };
    engine.state.fanBooking.context.selectedEvent = {
      eventId: "evt_private_recording_summary",
      type: "1on1-call",
      title: "Private Recording",
      basePriceTokens: 60,
      raw: {
        type: "1on1-call",
        basePriceTokens: 60,
        sessionDurationMinutes: 30,
        allowFanRecordingEnabled: true,
        allowFanRecordingTokens: 50,
      },
    };

    const { default: BookingFlowStep3 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue");
    const wrapper = mount(BookingFlowStep3, { props: { engine, embedded: true } });
    await flushAsync();

    const addOns = wrapper.findAll("[data-testid='booking-flow-summary-addon']");
    expect(addOns).toHaveLength(2);
    expect(addOns[0].attributes("data-addon-kind")).toBe("recording");
    expect(addOns[0].text()).toContain("录制我们的会话");
    expect(wrapper.text()).toContain("120");
    expect(wrapper.text()).not.toContain("USD$ 7.20");
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
