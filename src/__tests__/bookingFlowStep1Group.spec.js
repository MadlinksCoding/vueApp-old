import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";
import { buildBookedSlotsIndex } from "@/services/bookings/utils/bookingSlotUtils.js";

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js", () => ({
  bookingFlowArrowUpRightIcon: "/arrow-up-right.webp",
  bookingFlowBackgroundImage: "/booking-background.webp",
  bookingFlowTokenIcon: "/token.webp",
  bookingFlowUnionIcon: "/union.webp",
}));

function setByPath(target, path, value) {
  const segments = String(path).split(".");
  let cursor = target;
  while (segments.length > 1) {
    const key = segments.shift();
    cursor[key] = cursor[key] || {};
    cursor = cursor[key];
  }
  cursor[segments[0]] = value;
}

function getByPath(target, path) {
  return String(path).split(".").reduce((cursor, segment) => (
    cursor == null ? cursor : cursor[segment]
  ), target);
}

function createEngine(state) {
  return {
    state,
    getState: vi.fn((path) => getByPath(state, path)),
    setState: vi.fn((path, value) => setByPath(state, path, value)),
    goToStep: vi.fn(),
  };
}

function localDateOffset(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function groupEvent(dateIso, overrides = {}) {
  const rawOverrides = overrides.raw || {};
  const { raw: _raw, ...eventOverrides } = overrides;
  return {
    eventId: "evt_group_card",
    id: "evt_group_card",
    title: "J&B's Cooking show",
    type: "group-event",
    eventType: "group-event",
    basePriceTokens: 500,
    sessionDurationMinutes: 60,
    localDateIso: dateIso,
    localStartHm: "10:00",
    localEndHm: "13:00",
    description: "Join us for a spectacular live stream event.",
    raw: {
      type: "group-event",
      eventType: "group-event",
      repeatRule: "doesNotRepeat",
      priceSetting: "fixedPricePerUser",
      basePriceTokens: 500,
      sessionDurationMinutes: 60,
      enableMaxUsersInGroup: true,
      maxUsersInGroup: 3,
      ...rawOverrides,
    },
    ...eventOverrides,
  };
}

async function mountStep1({ event, bookedSlots = [] }) {
  const engine = createEngine({
    fanBooking: {
      catalog: {
        events: [event],
        bookedSlotsIndex: buildBookedSlotsIndex(bookedSlots),
      },
      context: {
        isFirstBookingForCreator: false,
      },
      ui: {
        catalogLoading: false,
        catalogError: "",
      },
    },
    bookingDetails: {
      walletBalance: 0,
    },
  });
  const { default: BookingFlowStep1 } = await import("@/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep1.vue");
  const wrapper = mount(BookingFlowStep1, {
    props: {
      engine,
      embedded: true,
    },
    global: {
      provide: {
        [bookingTranslationSymbol]: createBookingTranslator(),
      },
    },
  });
  await nextTick();
  return { engine, wrapper };
}

describe("BookingFlowStep1 group cards", () => {
  it("renders fixed-price group card with limited spots and selects the upcoming slot", async () => {
    const dateIso = localDateOffset(1);
    const event = groupEvent(dateIso);
    const bookedSlots = [1, 2].map((index) => ({
      bookingId: `booking_${index}`,
      eventId: event.eventId,
      startIso: `${dateIso}T10:00:00`,
      endIso: `${dateIso}T13:00:00`,
      status: "confirmed",
    }));
    const { engine, wrapper } = await mountStep1({ event, bookedSlots });

    expect(wrapper.text()).toContain("Group Event");
    expect(wrapper.text()).toContain("Limited spots!");
    expect(wrapper.text()).toContain("2 fans already joined");
    expect(wrapper.text()).toContain("1/3 spots left!");
    expect(wrapper.text()).toContain("JOIN EVENT");

    const cta = wrapper.findAll("button").find((button) => button.text().includes("JOIN EVENT"));
    await cta.trigger("click");

    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedDate).toBe(dateIso);
    expect(engine.state.fanBooking.selection.selectedDurationMinutes).toBe(180);
    expect(engine.state.fanBooking.selection.selectedAddOns).toEqual([]);
    expect(engine.state.fanBooking.selection.personalRequestText).toBe("");
  });

  it("renders event-goal progress from booked slot contribution totals", async () => {
    const dateIso = localDateOffset(1);
    const event = groupEvent(dateIso, {
      basePriceTokens: 0,
      eventGoalTokens: 8000,
      minContributionPerUser: 500,
      raw: {
        priceSetting: "eventGoal",
        basePriceTokens: 0,
        eventGoalTokens: 8000,
        minContributionPerUser: 500,
        enableMaxUsersInGroup: false,
      },
    });
    const bookedSlots = [
      {
        bookingId: "booking_contribution",
        eventId: event.eventId,
        startIso: `${dateIso}T10:00:00`,
        endIso: `${dateIso}T13:00:00`,
        status: "confirmed",
        contributionTokens: 1000,
      },
      {
        bookingId: "booking_payment_total",
        eventId: event.eventId,
        startIso: `${dateIso}T10:00:00`,
        endIso: `${dateIso}T13:00:00`,
        status: "pending",
        paymentTotal: 200,
      },
      {
        bookingId: "booking_cancelled",
        eventId: event.eventId,
        startIso: `${dateIso}T10:00:00`,
        endIso: `${dateIso}T13:00:00`,
        status: "cancelled",
        contributionTokens: 5000,
      },
    ];
    const { wrapper } = await mountStep1({ event, bookedSlots });

    expect(wrapper.text()).toContain("Contribute Now");
    expect(wrapper.text()).toContain("Contribute 500 tokens or more to join");
    expect(wrapper.text()).toContain("1,200/8,000 Tokens");
    expect(wrapper.text()).toContain("15% event goal reached");
    expect(wrapper.text()).not.toContain("Limited spots!");
  });

  it("skips a full first group slot and selects the next available upcoming slot", async () => {
    const firstDateIso = localDateOffset(1);
    const secondDateIso = localDateOffset(2);
    const event = groupEvent(firstDateIso, {
      raw: {
        repeatRule: "daily",
        enableMaxUsersInGroup: true,
        maxUsersInGroup: 1,
      },
    });
    const { engine, wrapper } = await mountStep1({
      event,
      bookedSlots: [{
        bookingId: "booking_full_first_slot",
        eventId: event.eventId,
        startIso: `${firstDateIso}T10:00:00`,
        endIso: `${firstDateIso}T13:00:00`,
        status: "confirmed",
      }],
    });

    const cta = wrapper.findAll("button").find((button) => button.text().includes("JOIN EVENT"));
    await cta.trigger("click");

    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedDate).toBe(secondDateIso);
  });
});
