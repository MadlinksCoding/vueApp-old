import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";
import { buildBookedSlotsIndex } from "@/services/bookings/utils/bookingSlotUtils.js";

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js", () => ({
  bookingFlowArrowUpRightIcon: "/arrow-up-right.webp",
  bookingFlowBackgroundImage: "/booking-background.webp",
  bookingFlowTokenIcon: "/token.webp",
  bookingFlowUnionBlackIcon: "/union-black-gray.svg",
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

function expectedDateLabel(dateIso) {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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
      dateFrom: dateIso,
      priceSetting: "fixedPricePerUser",
      basePriceTokens: 500,
      sessionDurationMinutes: 60,
      enableMaxAttendees: true,
      maxAttendees: 3,
      ...rawOverrides,
    },
    ...eventOverrides,
  };
}

async function mountStep1({
  event,
  bookedSlots = [],
  contextFanId = 2615,
  rootFanId = undefined,
  rootUserId = undefined,
  step1PrimaryAction = "book",
}) {
  const engine = createEngine({
    ...(rootFanId !== undefined ? { fanId: rootFanId } : {}),
    ...(rootUserId !== undefined ? { userId: rootUserId } : {}),
    fanBooking: {
      catalog: {
        events: [event],
        bookedSlotsIndex: buildBookedSlotsIndex(bookedSlots),
      },
      context: {
        ...(contextFanId !== undefined ? { fanId: contextFanId } : {}),
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
      step1PrimaryAction,
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T23:00:00+06:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("renders edit booking schedule CTA in creator preview mode without booking navigation", async () => {
    const dateIso = localDateOffset(1);
    const event = groupEvent(dateIso, {
      type: "group",
      raw: {
        type: "group",
        eventType: "group-event",
      },
    });
    const { engine, wrapper } = await mountStep1({
      event,
      step1PrimaryAction: "edit-schedule",
    });

    const editButton = wrapper.get("[data-test='booking-step1-edit-schedule']");
    expect(editButton.text()).toContain("EDIT BOOKING SCHEDULE");
    expect(wrapper.text()).not.toContain("JOIN EVENT");

    await editButton.trigger("click");

    expect(wrapper.emitted("edit-schedule")?.[0]?.[0]).toEqual(expect.objectContaining({
      eventId: event.eventId,
      title: event.title,
    }));
    expect(engine.goToStep).not.toHaveBeenCalled();
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
        enableMaxAttendees: false,
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

  it("shows over-goal contribution totals while capping progress at 100 percent", async () => {
    const dateIso = localDateOffset(1);
    const event = groupEvent(dateIso, {
      basePriceTokens: 0,
      eventGoalTokens: 1000,
      minContributionPerUser: 100,
      raw: {
        priceSetting: "eventGoal",
        basePriceTokens: 0,
        eventGoalTokens: 1000,
        minContributionPerUser: 100,
        enableMaxAttendees: false,
      },
    });
    const bookedSlots = [
      {
        bookingId: "booking_goal_over_1",
        eventId: event.eventId,
        startIso: `${dateIso}T10:00:00`,
        endIso: `${dateIso}T13:00:00`,
        status: "confirmed",
        contributionTokens: 1000,
      },
      {
        bookingId: "booking_goal_over_2",
        eventId: event.eventId,
        startIso: `${dateIso}T10:00:00`,
        endIso: `${dateIso}T13:00:00`,
        status: "pending",
        contributionTokens: 250,
      },
      {
        bookingId: "booking_goal_over_cancelled",
        eventId: event.eventId,
        startIso: `${dateIso}T10:00:00`,
        endIso: `${dateIso}T13:00:00`,
        status: "cancelled",
        contributionTokens: 5000,
      },
    ];

    const { wrapper } = await mountStep1({ event, bookedSlots });

    expect(wrapper.text()).toContain("1,250/1,000 Tokens");
    expect(wrapper.text()).toContain("100% event goal reached");
    expect(wrapper.text()).not.toContain("125% event goal reached");
    expect(wrapper.text()).not.toContain("6,250/1,000 Tokens");
  });

  it("skips a full first group slot and selects the next available upcoming slot", async () => {
    const firstDateIso = localDateOffset(1);
    const secondDateIso = localDateOffset(2);
    const event = groupEvent(firstDateIso, {
      raw: {
        repeatRule: "daily",
        enableMaxAttendees: true,
        maxAttendees: 1,
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

  it("shows the scheduled time and Fully Booked CTA for a full non-repeating fixed-price group", async () => {
    const dateIso = localDateOffset(1);
    const event = groupEvent(dateIso, {
      raw: {
        repeatRule: "doesNotRepeat",
        enableMaxAttendees: true,
        maxAttendees: 2,
      },
    });
    const { engine, wrapper } = await mountStep1({
      event,
      bookedSlots: [2616, 2617].map((userId) => ({
        bookingId: `booking_full_${userId}`,
        eventId: event.eventId,
        userId,
        startIso: `${dateIso}T10:00:00`,
        endIso: `${dateIso}T13:00:00`,
        status: "confirmed",
      })),
    });

    expect(wrapper.text()).toContain(expectedDateLabel(dateIso));
    expect(wrapper.text()).toContain("10:00am-1:00pm");
    expect(wrapper.text()).toContain("2 fans already joined");
    expect(wrapper.text()).toContain("0/2 spots left!");

    const cta = wrapper.findAll("button").find((button) => button.text().includes("Fully Booked"));
    expect(cta.exists()).toBe(true);
    expect(cta.attributes("disabled")).toBeDefined();
    await cta.trigger("click");

    expect(engine.goToStep).not.toHaveBeenCalled();
  });

  it("shows Fully Booked for a full non-repeating event-goal group with attendee cap", async () => {
    const dateIso = localDateOffset(1);
    const event = groupEvent(dateIso, {
      basePriceTokens: 0,
      eventGoalTokens: 8000,
      minContributionPerUser: 500,
      raw: {
        repeatRule: "doesNotRepeat",
        priceSetting: "eventGoal",
        basePriceTokens: 0,
        eventGoalTokens: 8000,
        minContributionPerUser: 500,
        enableMaxAttendees: true,
        maxAttendees: 1,
      },
    });
    const { engine, wrapper } = await mountStep1({
      event,
      bookedSlots: [{
        bookingId: "booking_goal_full",
        eventId: event.eventId,
        userId: 2616,
        startIso: `${dateIso}T10:00:00`,
        endIso: `${dateIso}T13:00:00`,
        status: "confirmed",
        contributionTokens: 1000,
      }],
    });

    expect(wrapper.text()).toContain(expectedDateLabel(dateIso));
    expect(wrapper.text()).toContain("10:00am-1:00pm");
    expect(wrapper.text()).toContain("Fully Booked");
    expect(wrapper.text()).toContain("1,000/8,000 Tokens");

    const cta = wrapper.findAll("button").find((button) => button.text().includes("Fully Booked"));
    expect(cta.exists()).toBe(true);
    expect(cta.attributes("disabled")).toBeDefined();
    await cta.trigger("click");

    expect(engine.goToStep).not.toHaveBeenCalled();
  });

  it("keeps the group CTA enabled when another fan booked the displayed slot and capacity remains", async () => {
    const dateIso = localDateOffset(1);
    const event = groupEvent(dateIso, {
      raw: {
        repeatRule: "doesNotRepeat",
        enableMaxAttendees: true,
        maxAttendees: 2,
      },
    });
    const { engine, wrapper } = await mountStep1({
      event,
      bookedSlots: [{
        bookingId: "booking_other_fan",
        eventId: event.eventId,
        userId: 2616,
        startIso: `${dateIso}T10:00:00`,
        endIso: `${dateIso}T13:00:00`,
        status: "confirmed",
      }],
    });

    expect(wrapper.text()).toContain("1/2 spots left!");

    const cta = wrapper.findAll("button").find((button) => button.text().includes("JOIN EVENT"));
    expect(cta.attributes("disabled")).toBeUndefined();
    await cta.trigger("click");

    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedDate).toBe(dateIso);
  });

  it("disables the group CTA when the current fan already booked the displayed slot", async () => {
    const dateIso = localDateOffset(1);
    const event = groupEvent(dateIso, {
      raw: {
        repeatRule: "doesNotRepeat",
        enableMaxAttendees: true,
        maxAttendees: 2,
      },
    });
    const { engine, wrapper } = await mountStep1({
      event,
      bookedSlots: [{
        bookingId: "booking_current_fan",
        eventId: event.eventId,
        userId: 2615,
        startIso: `${dateIso}T10:00:00`,
        endIso: `${dateIso}T13:00:00`,
        status: "confirmed",
      }],
    });

    expect(wrapper.text()).toContain("1/2 spots left!");
    const cta = wrapper.findAll("button").find((button) => button.text().includes("Already booked"));
    expect(cta.exists()).toBe(true);
    expect(cta.attributes("disabled")).toBeDefined();

    await cta.trigger("click");
    expect(engine.goToStep).not.toHaveBeenCalled();
  });

  it("disables the group CTA for the reported HKT booked slot shape", async () => {
    const eventId = "evt_a703b07e-e45e-45f3-a7b5-d261462e16b7";
    const event = {
      ...groupEvent("2026-05-04", {
        eventId,
        id: eventId,
        title: "fixed",
        basePriceTokens: 100,
        sessionDurationMinutes: 180,
        localStartHm: "14:00",
        localEndHm: "17:00",
        raw: {
          repeatRule: "doesNotRepeat",
          enableMaxAttendees: true,
          maxAttendees: 2,
          basePriceTokens: 100,
          sessionDurationMinutes: 180,
          slots: [{
            date: "2026-05-04",
            times: [{ startTime: "14:00", endTime: "17:00", offHours: false }],
          }],
        },
      }),
    };
    const { engine, wrapper } = await mountStep1({
      event,
      bookedSlots: [{
        bookingId: "b_evt_a703b07e-e45e-45f3-a7b5-d261462e16b7_1777813826709_37211",
        eventId,
        userId: 2615,
        startIso: "2026-05-04T14:00:00+08:00",
        endIso: "2026-05-04T17:00:00+08:00",
        status: "confirmed",
      }],
    });

    expect(wrapper.text()).toContain("1/2 spots left!");
    const cta = wrapper.findAll("button").find((button) => button.text().includes("Already booked"));
    expect(cta.exists()).toBe(true);
    expect(cta.attributes("disabled")).toBeDefined();

    await cta.trigger("click");
    expect(engine.goToStep).not.toHaveBeenCalled();
  });

  it.each([undefined, 0])(
    "falls back to a root user id when context fan id is %s",
    async (contextFanId) => {
      const dateIso = localDateOffset(1);
      const event = groupEvent(dateIso, {
        raw: {
          repeatRule: "doesNotRepeat",
          enableMaxAttendees: true,
          maxAttendees: 2,
        },
      });
      const { engine, wrapper } = await mountStep1({
        event,
        contextFanId,
        rootUserId: 2615,
        bookedSlots: [{
          bookingId: "booking_current_fan_root_user_id",
          eventId: event.eventId,
          userId: 2615,
          startIso: `${dateIso}T10:00:00`,
          endIso: `${dateIso}T13:00:00`,
          status: "confirmed",
        }],
      });

      const cta = wrapper.findAll("button").find((button) => button.text().includes("Already booked"));
      expect(cta.exists()).toBe(true);
      expect(cta.attributes("disabled")).toBeDefined();

      await cta.trigger("click");
      expect(engine.goToStep).not.toHaveBeenCalled();
    },
  );

  it("skips to the next occurrence when the current fan booked the first displayed slot", async () => {
    const firstDateIso = localDateOffset(1);
    const secondDateIso = localDateOffset(2);
    const event = groupEvent(firstDateIso, {
      raw: {
        repeatRule: "daily",
        enableMaxAttendees: true,
        maxAttendees: 2,
      },
    });
    const { engine, wrapper } = await mountStep1({
      event,
      bookedSlots: [{
        bookingId: "booking_current_fan",
        eventId: event.eventId,
        userId: 2615,
        startIso: `${firstDateIso}T10:00:00`,
        endIso: `${firstDateIso}T13:00:00`,
        status: "confirmed",
      }],
    });

    expect(wrapper.text()).toContain(expectedDateLabel(secondDateIso));
    const cta = wrapper.findAll("button").find((button) => button.text().includes("JOIN EVENT"));
    expect(cta.exists()).toBe(true);
    expect(cta.attributes("disabled")).toBeUndefined();
    await cta.trigger("click");

    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedDate).toBe(secondDateIso);
  });

  it("skips to the next event-goal occurrence when the current fan booked the first displayed slot", async () => {
    const firstDateIso = localDateOffset(1);
    const secondDateIso = localDateOffset(2);
    const thirdDateIso = localDateOffset(3);
    const event = groupEvent(firstDateIso, {
      basePriceTokens: 0,
      eventGoalTokens: 8000,
      minContributionPerUser: 500,
      raw: {
        repeatRule: "daily",
        priceSetting: "eventGoal",
        basePriceTokens: 0,
        eventGoalTokens: 8000,
        minContributionPerUser: 500,
        enableMaxAttendees: false,
      },
    });
    const { engine, wrapper } = await mountStep1({
      event,
      bookedSlots: [{
        bookingId: "booking_current_fan_goal",
        eventId: event.eventId,
        userId: 2615,
        startIso: `${firstDateIso}T10:00:00`,
        endIso: `${firstDateIso}T13:00:00`,
        status: "confirmed",
        contributionTokens: 1000,
      }, {
        bookingId: "booking_second_slot_goal",
        eventId: event.eventId,
        userId: 2616,
        startIso: `${secondDateIso}T10:00:00`,
        endIso: `${secondDateIso}T13:00:00`,
        status: "confirmed",
        contributionTokens: 750,
      }, {
        bookingId: "booking_other_goal_occurrence",
        eventId: event.eventId,
        userId: 2617,
        startIso: `${thirdDateIso}T10:00:00`,
        endIso: `${thirdDateIso}T13:00:00`,
        status: "confirmed",
        contributionTokens: 3000,
      }],
    });

    expect(wrapper.text()).toContain(expectedDateLabel(secondDateIso));
    expect(wrapper.text()).toContain("750/8,000 Tokens");
    expect(wrapper.text()).toContain("9% event goal reached");
    expect(wrapper.text()).not.toContain("1,750/8,000 Tokens");
    expect(wrapper.text()).not.toContain("4,750/8,000 Tokens");
    const cta = wrapper.findAll("button").find((button) => button.text().includes("Contribute Now"));
    expect(cta.exists()).toBe(true);
    expect(cta.attributes("disabled")).toBeUndefined();
    await cta.trigger("click");

    expect(engine.goToStep).toHaveBeenCalledWith(3);
    expect(engine.state.fanBooking.selection.selectedDate).toBe(secondDateIso);
    expect(engine.state.fanBooking.selection.contributionTokens).toBe(500);
  });
});
