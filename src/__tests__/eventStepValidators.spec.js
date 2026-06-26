import { describe, expect, it } from "vitest";
import { step1Validator, step2Validator } from "@/services/events/validators/eventStepValidators.js";

describe("event step validators", () => {
  const weeklyAvailability = [{
    key: "sun",
    name: "Sun",
    unavailable: false,
    slots: [{ startTime: "00:00", endTime: "03:00" }],
  }];

  it("allows group step 1 without fixed duration when a valid slot exists", () => {
    const result = step1Validator({
      eventType: "group-event",
      eventTitle: "Group stream",
      priceSetting: "fixedPricePerUser",
      basePrice: 100,
      weeklyAvailability,
    });

    expect(result.errors.some((error) => error.field === "duration")).toBe(false);
  });

  it("requires an explicit base price for fixed-price group events", () => {
    const result = step1Validator({
      eventType: "group-event",
      eventTitle: "Fixed group",
      priceSetting: "fixedPricePerUser",
      basePrice: "",
      weeklyAvailability,
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "basePrice",
        translationKey: "booking_validation_base_price_required",
      }),
    ]));
  });

  it.each(["0", "100"])("accepts fixed-price group basePrice %s", (basePrice) => {
    const result = step1Validator({
      eventType: "group-event",
      eventTitle: "Fixed group",
      priceSetting: "fixedPricePerUser",
      basePrice,
      weeklyAvailability,
    });

    expect(result.errors.some((error) => error.field === "basePrice")).toBe(false);
  });

  it("does not require base price for event-goal group events", () => {
    const result = step1Validator({
      eventType: "group-event",
      eventTitle: "Group goal",
      priceSetting: "eventGoal",
      basePrice: "",
      eventGoalTokens: 1000,
      weeklyAvailability,
    });

    expect(result.errors.some((error) => error.field === "basePrice")).toBe(false);
  });

  it("still requires private step 1 duration", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      basePrice: 100,
      weeklyAvailability,
    });

    expect(result.errors.some((error) => error.field === "duration")).toBe(true);
  });

  it("rejects invalid event-goal pricing values", () => {
    const result = step1Validator({
      eventType: "group-event",
      eventTitle: "Group goal",
      priceSetting: "eventGoal",
      eventGoalTokens: 0,
      enableMinContributionPerUser: true,
      minContributionPerUser: 0,
      weeklyAvailability,
    });

    expect(result.errors.some((error) => error.field === "eventGoalTokens")).toBe(true);
    expect(result.errors.some((error) => error.field === "minContributionPerUser")).toBe(true);
  });

  it("rejects enabled buffer time below five minutes", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      weeklyAvailability,
      setBufferTime: true,
      bufferUnit: "minutes",
      bufferTime: "2",
    });

    const bufferError = result.errors.find((error) => error.field === "bookingBufferMinutes");
    expect(bufferError).toMatchObject({
      field: "bookingBufferMinutes",
      translationKey: "booking_validation_buffer_time_min",
      conditional: false,
    });
  });

  it("accepts enabled buffer time at five minutes", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      weeklyAvailability,
      setBufferTime: true,
      bufferUnit: "minutes",
      bufferTime: "5",
    });

    expect(result.errors.some((error) => error.field === "bookingBufferMinutes")).toBe(false);
  });

  it("validates hourly buffer time after converting to minutes", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      weeklyAvailability,
      setBufferTime: true,
      bufferUnit: "hours",
      bufferTime: "2",
    });

    expect(result.errors.some((error) => error.field === "bookingBufferMinutes")).toBe(false);
  });

  it("does not validate buffer time while disabled", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      weeklyAvailability,
      setBufferTime: false,
      bufferUnit: "minutes",
      bufferTime: "2",
    });

    expect(result.errors.some((error) => error.field === "bookingBufferMinutes")).toBe(false);
  });

  it("rejects duplicate one-time custom dates", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      repeatRule: "doesNotRepeat",
      oneTimeAvailability: [
        { date: "2026-06-10", slots: [{ startTime: "12:00", endTime: "15:00" }] },
        { date: "2026-06-10", slots: [{ startTime: "15:00", endTime: "18:00" }] },
      ],
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "oneTimeAvailability",
        translationKey: "booking_validation_one_time_date_unique",
      }),
    ]));
  });

  it("rejects a custom date without a time slot when another date has slots", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      repeatRule: "doesNotRepeat",
      oneTimeAvailability: [
        { date: "2026-06-10", slots: [{ startTime: "12:00", endTime: "15:00" }] },
        { date: "2026-06-11", slots: [] },
      ],
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "oneTimeAvailability",
        translationKey: "booking_validation_one_time_date_slot_required",
      }),
    ]));
  });

  it("rejects overlapping one-time custom slots for the same date", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      repeatRule: "doesNotRepeat",
      oneTimeAvailability: [
        {
          date: "2026-06-10",
          slots: [
            { startTime: "15:00", endTime: "18:00" },
            { startTime: "15:05", endTime: "18:05" },
          ],
        },
      ],
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "oneTimeAvailability",
        translationKey: "booking_validation_one_time_slot_unique",
      }),
    ]));
  });

  it.each([
    {
      name: "custom one-time",
      field: "oneTimeAvailability",
      state: {
        repeatRule: "doesNotRepeat",
        oneTimeAvailability: [
          {
            date: "2026-06-10",
            slots: [{ startTime: "16:00", endTime: "16:00" }],
          },
        ],
      },
    },
    {
      name: "custom one-time",
      field: "oneTimeAvailability",
      state: {
        repeatRule: "doesNotRepeat",
        oneTimeAvailability: [
          {
            date: "2026-06-10",
            slots: [{ startTime: "16:00", endTime: "15:00" }],
          },
        ],
      },
    },
    {
      name: "monthly",
      field: "monthlyAvailability",
      state: {
        repeatRule: "monthly",
        dateFrom: "2026-06-10",
        monthlyAvailability: [{ startTime: "16:00", endTime: "16:00" }],
      },
    },
    {
      name: "monthly",
      field: "monthlyAvailability",
      state: {
        repeatRule: "monthly",
        dateFrom: "2026-06-10",
        monthlyAvailability: [{ startTime: "16:00", endTime: "15:00" }],
      },
    },
    {
      name: "weekly",
      field: "weeklyAvailability",
      state: {
        repeatRule: "weekly",
        weeklyAvailability: [
          {
            key: "sun",
            name: "Sun",
            unavailable: false,
            slots: [{ startTime: "16:00", endTime: "16:00" }],
          },
        ],
      },
    },
    {
      name: "weekly",
      field: "weeklyAvailability",
      state: {
        repeatRule: "weekly",
        weeklyAvailability: [
          {
            key: "sun",
            name: "Sun",
            unavailable: false,
            slots: [{ startTime: "16:00", endTime: "15:00" }],
          },
        ],
      },
    },
  ])("rejects $name slots whose end time is not after start time", ({ field, state }) => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      ...state,
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field,
        translationKey: "booking_validation_time_slot_order",
      }),
    ]));
  });

  it("rejects overnight one-time custom slots as invalid time order", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      repeatRule: "doesNotRepeat",
      oneTimeAvailability: [
        {
          date: "2026-06-10",
          slots: [{ startTime: "23:00", endTime: "00:30" }],
        },
      ],
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "oneTimeAvailability",
        translationKey: "booking_validation_time_slot_order",
      }),
    ]));
  });

  it("rejects stale custom overnight slots without treating early-morning slots as overlap", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      repeatRule: "doesNotRepeat",
      oneTimeAvailability: [
        {
          date: "2026-06-10",
          slots: [
            { startTime: "22:00", endTime: "03:00" },
            { startTime: "00:00", endTime: "02:00" },
          ],
        },
      ],
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "oneTimeAvailability",
        translationKey: "booking_validation_time_slot_order",
      }),
    ]));
    expect(result.errors.some((error) => error.translationKey === "booking_validation_one_time_slot_unique")).toBe(false);
  });

  it("rejects overnight monthly slots as invalid time order", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      repeatRule: "monthly",
      dateFrom: "2026-06-10",
      monthlyAvailability: [
        { startTime: "22:00", endTime: "03:00" },
        { startTime: "00:00", endTime: "02:00" },
      ],
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "monthlyAvailability",
        translationKey: "booking_validation_time_slot_order",
      }),
    ]));
  });

  it("rejects overnight weekly slots as invalid time order", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      repeatRule: "weekly",
      weeklyAvailability: [
        {
          key: "sun",
          name: "Sun",
          unavailable: false,
          slots: [{ startTime: "22:00", endTime: "03:00" }],
        },
        {
          key: "mon",
          name: "Mon",
          unavailable: false,
          slots: [{ startTime: "00:00", endTime: "02:00" }],
        },
      ],
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "weeklyAvailability",
        translationKey: "booking_validation_time_slot_order",
      }),
    ]));
  });

  it("rejects overlapping weekly slots on the same weekday", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      repeatRule: "weekly",
      weeklyAvailability: [
        {
          key: "sun",
          name: "Sun",
          unavailable: false,
          slots: [
            { startTime: "22:00", endTime: "23:00" },
            { startTime: "22:30", endTime: "23:30" },
          ],
        },
      ],
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "weeklyAvailability",
        translationKey: "booking_validation_weekly_slot_unique",
      }),
    ]));
  });

  it.each([
    {
      name: "custom one-time",
      state: {
        repeatRule: "doesNotRepeat",
        oneTimeAvailability: [{
          date: "2026-06-10",
          slots: [{ startTime: "23:55", endTime: "23:59" }],
        }],
      },
    },
    {
      name: "monthly",
      state: {
        repeatRule: "monthly",
        dateFrom: "2026-06-10",
        monthlyAvailability: [{ startTime: "23:55", endTime: "23:59" }],
      },
    },
    {
      name: "weekly",
      state: {
        repeatRule: "weekly",
        weeklyAvailability: [{
          key: "sun",
          name: "Sun",
          unavailable: false,
          slots: [{ startTime: "23:55", endTime: "23:59" }],
        }],
      },
    },
  ])("accepts private $name slots ending at 11:59 PM as inclusive end-of-day windows", ({ state }) => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      ...state,
    });

    expect(result.errors.some((error) => error.translationKey === "booking_validation_time_slot_duration_min")).toBe(false);
  });

  it("accepts 11:50 PM to 11:59 PM as a valid end-of-day slot", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      repeatRule: "doesNotRepeat",
      oneTimeAvailability: [{
        date: "2026-06-10",
        slots: [{ startTime: "23:50", endTime: "23:59" }],
      }],
    });

    expect(result.errors.some((error) => error.translationKey === "booking_validation_time_slot_duration_min")).toBe(false);
    expect(result.errors.some((error) => error.field === "oneTimeAvailability")).toBe(false);
  });

  it("reports group schedule slots shorter than five minutes as duration errors, not missing slots", () => {
    const result = step1Validator({
      eventType: "group-event",
      eventTitle: "Group call",
      priceSetting: "fixedPricePerUser",
      basePrice: 100,
      repeatRule: "weekly",
      weeklyAvailability: [{
        key: "sun",
        name: "Sun",
        unavailable: false,
        slots: [{ startTime: "23:55", endTime: "23:59" }],
      }],
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "weeklyAvailability",
        translationKey: "booking_validation_time_slot_duration_min",
      }),
    ]));
    expect(result.errors.some((error) => error.translationKey === "booking_validation_weekly_slot_required")).toBe(false);
  });

  it("requires private step 1 conditional fields when their toggles are enabled", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      weeklyAvailability,
      allowLongerSessions: true,
      maxSessionDuration: "",
      enableLongerDiscount: true,
      sessionMinimum: "",
      longerSessionDiscountTokens: "",
      enableFirstTimeDiscount: true,
      firstTimeDiscountTokens: "",
      enableBookingFee: true,
      bookingFee: "",
      enableRescheduleFee: true,
      rescheduleFee: "",
      enableCancellationFee: true,
      cancellationFee: "",
      addOffHourSurcharge: true,
      offHourSurcharge: "",
      requestExtendSession: true,
      extendSessionMax: "",
      setReminders: true,
      remindMeTime: "",
      setBufferTime: true,
      bufferTime: "",
      setMaxBookings: true,
      maxBookingsPerDay: "",
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "maxSessionDuration", conditional: true }),
      expect.objectContaining({ field: "sessionMinimum", conditional: true }),
      expect.objectContaining({ field: "longerSessionDiscountTokens", conditional: true }),
      expect.objectContaining({ field: "firstTimeDiscountTokens", conditional: true }),
      expect.objectContaining({ field: "bookingFee", conditional: true }),
      expect.objectContaining({ field: "rescheduleFee", conditional: true }),
      expect.objectContaining({ field: "cancellationFee", conditional: true }),
      expect.objectContaining({ field: "offHourSurcharge", conditional: true }),
      expect.objectContaining({ field: "extendSessionMax", conditional: true }),
      expect.objectContaining({ field: "remindMeTime", conditional: true }),
      expect.objectContaining({ field: "bookingBufferMinutes", conditional: true }),
      expect.objectContaining({ field: "maxBookingsPerDay", conditional: true }),
    ]));
  });

  it("rejects zero values for enabled optional fees, discounts, and surcharges", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      weeklyAvailability,
      enableLongerDiscount: true,
      sessionMinimum: "2",
      longerSessionDiscountTokens: "0",
      enableFirstTimeDiscount: true,
      firstTimeDiscountTokens: "0",
      enableBookingFee: true,
      bookingFee: "0",
      enableRescheduleFee: true,
      rescheduleFee: "0",
      enableCancellationFee: true,
      cancellationFee: "0",
      addOffHourSurcharge: true,
      offHourSurcharge: "0",
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "longerSessionDiscountTokens", conditional: false }),
      expect.objectContaining({ field: "firstTimeDiscountTokens", conditional: false }),
      expect.objectContaining({ field: "bookingFee", conditional: false }),
      expect.objectContaining({ field: "rescheduleFee", conditional: false }),
      expect.objectContaining({ field: "cancellationFee", conditional: false }),
      expect.objectContaining({ field: "offHourSurcharge", conditional: false }),
    ]));
  });

  it("accepts one as the minimum for enabled optional fees, discounts, and surcharges", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      weeklyAvailability,
      enableLongerDiscount: true,
      sessionMinimum: "2",
      longerSessionDiscountTokens: "1",
      enableFirstTimeDiscount: true,
      firstTimeDiscountTokens: "1",
      enableBookingFee: true,
      bookingFee: "1",
      enableRescheduleFee: true,
      rescheduleFee: "1",
      enableCancellationFee: true,
      cancellationFee: "1",
      addOffHourSurcharge: true,
      offHourSurcharge: "1",
    });
    const fields = result.errors.map((error) => error.field);

    expect(fields).not.toContain("longerSessionDiscountTokens");
    expect(fields).not.toContain("firstTimeDiscountTokens");
    expect(fields).not.toContain("bookingFee");
    expect(fields).not.toContain("rescheduleFee");
    expect(fields).not.toContain("cancellationFee");
    expect(fields).not.toContain("offHourSurcharge");
  });

  it("ignores optional fees, discounts, and surcharges when their toggles are disabled", () => {
    const result = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      weeklyAvailability,
      enableLongerDiscount: false,
      longerSessionDiscountTokens: "0",
      enableFirstTimeDiscount: false,
      firstTimeDiscountTokens: "0",
      enableBookingFee: false,
      bookingFee: "0",
      enableRescheduleFee: false,
      rescheduleFee: "0",
      enableCancellationFee: false,
      cancellationFee: "0",
      addOffHourSurcharge: false,
      offHourSurcharge: "0",
    });
    const fields = result.errors.map((error) => error.field);

    expect(fields).not.toContain("longerSessionDiscountTokens");
    expect(fields).not.toContain("firstTimeDiscountTokens");
    expect(fields).not.toContain("bookingFee");
    expect(fields).not.toContain("rescheduleFee");
    expect(fields).not.toContain("cancellationFee");
    expect(fields).not.toContain("offHourSurcharge");
  });

  it("validates cancellation and advance-cancel values only when enabled", () => {
    const disabled = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      weeklyAvailability,
      enableCancellationFee: false,
      cancellationFee: "",
      allowAdvanceCancellation: false,
      advanceVoid: "",
    });
    expect(disabled.errors.some((error) => error.field === "cancellationFee")).toBe(false);
    expect(disabled.errors.some((error) => error.field === "advanceVoid")).toBe(false);

    const enabled = step1Validator({
      eventType: "1on1-call",
      eventTitle: "Private call",
      duration: 30,
      basePrice: 100,
      weeklyAvailability,
      enableCancellationFee: true,
      cancellationFee: "",
      allowAdvanceCancellation: true,
      advanceVoid: "",
      advanceCancelWindowUnit: "",
    });
    expect(enabled.errors.some((error) => error.field === "cancellationFee")).toBe(true);
    expect(enabled.errors.some((error) => error.field === "advanceVoid")).toBe(true);
    expect(enabled.errors.some((error) => error.field === "advanceCancelWindowUnit")).toBe(true);
  });

  it("requires step 2 conditional fields when their settings are selected", () => {
    const result = step2Validator({
      allowRecording: true,
      recordingPrice: "",
      whoCanBook: "subscribersOnly",
      subscriptionTiers: [],
      spendingRequirement: "minSpend",
      minSpendTokens: "",
      addOns: [{ title: "VIP setup", description: "", priceTokens: "" }],
    });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "recordingPrice", conditional: true }),
      expect.objectContaining({ field: "subscriptionTiers", conditional: true }),
      expect.objectContaining({ field: "minSpendTokens", conditional: true }),
      expect.objectContaining({ field: "addOns.0.priceTokens", conditional: true }),
    ]));
  });
});
