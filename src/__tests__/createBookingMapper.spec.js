import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildBookingPaymentPreview,
  mapCreateBookingToRequest,
} from "@/services/bookings/mappers/createBookingMapper.js";

describe("create booking mapper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockBrowserTimezone(timeZone) {
    const OriginalDateTimeFormat = Intl.DateTimeFormat;

    vi.spyOn(Intl, "DateTimeFormat").mockImplementation((...args) => {
      const formatter = new OriginalDateTimeFormat(...args);
      const originalResolvedOptions = formatter.resolvedOptions.bind(formatter);

      formatter.resolvedOptions = () => ({
        ...originalResolvedOptions(),
        timeZone: args.length === 0 ? timeZone : originalResolvedOptions().timeZone,
      });

      return formatter;
    });
  }

  function baseBookingState() {
    return {
      fanBooking: {
        context: {
          fanId: 2615,
          creatorId: 1407,
          selectedEvent: {
            eventId: "evt_private",
            creatorId: 1407,
            type: "1on1-call",
            basePriceTokens: 100,
            raw: { type: "1on1-call", basePriceTokens: 100 },
          },
        },
        selection: {
          selectedDate: "2030-01-15",
        },
      },
      bookingDetails: {
        selectedDate: new Date("2030-01-15T00:00:00"),
        selectedTime: {
          localDateIso: "2030-01-15",
          startHm: "10:00",
          endHm: "10:30",
          value: "10:00",
        },
        selectedDuration: { value: 30, price: 100 },
      },
    };
  }

  it("includes the fan browser timezone in create booking payloads", () => {
    mockBrowserTimezone("America/New_York");

    const mapped = mapCreateBookingToRequest(baseBookingState());

    expect(mapped.fanTimezone).toBe("America/New_York");
  });

  it("falls back to Hong Kong timezone when browser timezone is unavailable", () => {
    mockBrowserTimezone(undefined);

    const mapped = mapCreateBookingToRequest(baseBookingState());

    expect(mapped.fanTimezone).toBe("Asia/Hong_Kong");
  });

  it("keeps temporary hold ids for private booking payloads", () => {
    const state = baseBookingState();
    state.fanBooking.temporaryHold = {
      temporaryHoldId: "temphold_private_123",
    };

    const mapped = mapCreateBookingToRequest(state);

    expect(mapped.temporaryHoldId).toBe("temphold_private_123");
  });

  it("maps group bookings to the selected slot end and derived duration", () => {
    const state = {
      fanBooking: {
        context: {
          fanId: 2615,
          creatorId: 1407,
          selectedEvent: {
            eventId: "evt_group",
            creatorId: 1407,
            type: "group-event",
            basePriceTokens: 100,
            raw: { type: "group-event", basePriceTokens: 100 },
          },
        },
        selection: {
          selectedDate: "2030-01-15",
        },
      },
      bookingDetails: {
        selectedDate: new Date("2030-01-15T00:00:00"),
        selectedTime: {
          localDateIso: "2030-01-15",
          startHm: "10:00",
          endHm: "13:00",
          value: "10:00",
        },
        selectedDuration: { value: 180, price: 100 },
      },
    };

    const mapped = mapCreateBookingToRequest(state);

    expect(mapped.durationMinutes).toBe(180);
    expect((new Date(mapped.endIso).getTime() - new Date(mapped.startIso).getTime()) / 60000).toBe(180);
  });

  it("drops stale temporary hold ids for group booking payloads", () => {
    const state = baseBookingState();
    state.fanBooking.context.selectedEvent = {
      eventId: "evt_group_stale_hold",
      creatorId: 1407,
      eventType: "group-event",
      basePriceTokens: 100,
      raw: {
        eventType: "group-event",
        basePriceTokens: 100,
      },
    };
    state.fanBooking.temporaryHold = {
      temporaryHoldId: "temphold_stale_group_123",
    };
    state.bookingDetails.selectedTime = {
      localDateIso: "2030-01-15",
      startHm: "10:00",
      endHm: "13:00",
      value: "10:00",
    };
    state.bookingDetails.selectedDuration = { value: 180, price: 100 };

    const mapped = mapCreateBookingToRequest(state);

    expect(mapped.temporaryHoldId).toBeNull();
  });

  it("charges group fixed price once per selected slot", () => {
    const preview = buildBookingPaymentPreview(
      {
        type: "group-event",
        priceSetting: "fixedPricePerUser",
        basePriceTokens: 100,
        raw: {
          type: "group-event",
          priceSetting: "fixedPricePerUser",
          basePriceTokens: 100,
          sessionDurationMinutes: 30,
        },
      },
      180,
      [],
      {},
    );

    expect(preview.payment.lines.find((line) => line.code === "base")?.amount).toBe(100);
    expect(preview.payment.total).toBe(100);
  });

  it("applies group recurring discount once prior confirmed/completed count reaches the minimum", () => {
    const event = {
      eventId: "evt_group_discount",
      creatorId: 1407,
      type: "group-event",
      priceSetting: "fixedPricePerUser",
      basePriceTokens: 200,
      raw: {
        type: "group-event",
        priceSetting: "fixedPricePerUser",
        basePriceTokens: 200,
        enableDiscountForRecurring: true,
        minEventsForRecurringDiscount: 2,
        recurringDiscountPercentOfBase: 25,
      },
    };

    const below = buildBookingPaymentPreview(event, 180, [], {}, { priorEventBookingCount: 1 });
    expect(below.payment.lines.some((line) => line.code === "recurring_event_discount")).toBe(false);
    expect(below.payment.total).toBe(200);

    const preview = buildBookingPaymentPreview(event, 180, [], {}, { priorEventBookingCount: 2 });
    expect(preview.payment.lines).toContainEqual({
      code: "recurring_event_discount",
      label: "Recurring Event Discount (25%)",
      amount: -50,
    });
    expect(preview.payment.total).toBe(150);

    const mapped = mapCreateBookingToRequest({
      fanBooking: {
        context: {
          fanId: 2615,
          creatorId: 1407,
          selectedEvent: event,
          eventBookingCountsByEventId: {
            evt_group_discount: 2,
          },
        },
        selection: {
          selectedDate: "2030-01-15",
        },
      },
      bookingDetails: {
        selectedDate: new Date("2030-01-15T00:00:00"),
        selectedTime: {
          localDateIso: "2030-01-15",
          startHm: "10:00",
          endHm: "13:00",
          value: "10:00",
        },
        selectedDuration: { value: 180, price: 200 },
      },
    });

    expect(mapped.payment.lines).toContainEqual({
      code: "recurring_event_discount",
      label: "Recurring Event Discount (25%)",
      amount: -50,
    });
    expect(mapped.payment.total).toBe(150);
  });

  it("rounds fractional first-time percentage discounts down to zero whole tokens", () => {
    const event = {
      eventId: "evt_tiny_first_time_discount",
      type: "1on1-call",
      basePriceTokens: 1,
      raw: {
        type: "1on1-call",
        basePriceTokens: 1,
        sessionDurationMinutes: 30,
        enableFirstTimeDiscount: true,
        firstTimeDiscount: 1,
      },
    };

    const preview = buildBookingPaymentPreview(event, 30, [], {}, {
      isFirstBookingForCreator: true,
    });

    expect(preview.discounts.firstTimeDiscount).toEqual({
      percent: 1,
      discountTokens: 0,
    });
    expect(preview.payment.lines.some((line) => line.code === "first_time_discount")).toBe(false);
    expect(preview.payment.total).toBe(1);
  });

  it("keeps first-time percentage discounts once they reach a whole token", () => {
    const event = {
      eventId: "evt_whole_first_time_discount",
      type: "1on1-call",
      basePriceTokens: 100,
      raw: {
        type: "1on1-call",
        basePriceTokens: 100,
        sessionDurationMinutes: 30,
        enableFirstTimeDiscount: true,
        firstTimeDiscount: 1,
      },
    };

    const preview = buildBookingPaymentPreview(event, 30, [], {}, {
      isFirstBookingForCreator: true,
    });

    expect(preview.payment.lines).toContainEqual({
      code: "first_time_discount",
      label: "First Time Discount (1%)",
      amount: -1,
    });
    expect(preview.payment.total).toBe(99);
  });

  it("adds off-hour surcharge when the selected group slot is marked off-hours", () => {
    const event = {
      eventId: "evt_group_off_hour",
      creatorId: 1407,
      type: "group-event",
      priceSetting: "fixedPricePerUser",
      basePriceTokens: 100,
      raw: {
        type: "group-event",
        priceSetting: "fixedPricePerUser",
        basePriceTokens: 100,
        offHourSurcharge: true,
        offHourSurchargePercent: 8,
      },
    };

    const preview = buildBookingPaymentPreview(
      event,
      180,
      [],
      { offHours: true },
      {},
    );

    expect(preview.payment.lines).toContainEqual({
      code: "off_hour_surcharge",
      label: "Off-hour Surcharge (8%)",
      amount: 8,
    });
    expect(preview.payment.total).toBe(108);
  });

  it("maps event-goal group contribution into preview and request payload", () => {
    const event = {
      eventId: "evt_goal",
      creatorId: 1407,
      type: "group-event",
      priceSetting: "eventGoal",
      raw: {
        type: "group-event",
        priceSetting: "eventGoal",
        eventGoalTokens: 1000,
        minContributionPerUser: 100,
        enableBookingFee: true,
        bookingFeeTokens: 25,
        enableDiscountForRecurring: true,
        minEventsForRecurringDiscount: 2,
        recurringDiscountPercentOfBase: 25,
      },
    };

    const preview = buildBookingPaymentPreview(event, 180, [], {}, { contributionTokens: 250, priorEventBookingCount: 3 });
    expect(preview.contributionTokens).toBe(250);
    expect(preview.payment.lines).toEqual([
      { code: "event_goal_contribution", label: "Event Goal Contribution", amount: 250 },
    ]);
    expect(preview.payment.total).toBe(250);

    const mapped = mapCreateBookingToRequest({
      fanBooking: {
        context: {
          fanId: 2615,
          creatorId: 1407,
          selectedEvent: event,
        },
        selection: {
          selectedDate: "2030-01-15",
          contributionTokens: 250,
        },
      },
      bookingDetails: {
        selectedDate: new Date("2030-01-15T00:00:00"),
        selectedTime: {
          localDateIso: "2030-01-15",
          startHm: "10:00",
          endHm: "13:00",
          value: "10:00",
        },
        selectedDuration: { value: 180, price: 0 },
        contributionTokens: 250,
      },
    });

    expect(mapped.contributionTokens).toBe(250);
    expect(mapped.payment.lines).toEqual([
      { code: "event_goal_contribution", label: "Event Goal Contribution", amount: 250 },
    ]);
    expect(mapped.payment.total).toBe(250);
  });

  it("floors event-goal contribution preview at minimum without capping at goal", () => {
    const event = {
      type: "group-event",
      priceSetting: "eventGoal",
      raw: {
        type: "group-event",
        priceSetting: "eventGoal",
        eventGoalTokens: 500,
        minContributionPerUser: 100,
      },
    };

    expect(buildBookingPaymentPreview(event, 180, [], {}, { contributionTokens: 20 }).contributionTokens).toBe(100);
    expect(buildBookingPaymentPreview(event, 180, [], {}, { contributionTokens: 700 }).contributionTokens).toBe(700);
  });
});
