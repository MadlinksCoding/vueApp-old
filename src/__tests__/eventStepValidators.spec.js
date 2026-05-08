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

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "bookingBufferMinutes",
        translationKey: "booking_validation_buffer_time_min",
      }),
    ]));
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

  it("validates cancellation and advance-cancel values only when enabled", () => {
    const disabled = step2Validator({
      enableCancellationFee: false,
      cancellationFee: 0,
      allowAdvanceCancellation: false,
      advanceVoid: 0,
    });
    expect(disabled.errors.some((error) => error.field === "cancellationFee")).toBe(false);
    expect(disabled.errors.some((error) => error.field === "advanceVoid")).toBe(false);

    const enabled = step2Validator({
      enableCancellationFee: true,
      cancellationFee: 0,
      allowAdvanceCancellation: true,
      advanceVoid: 0,
      advanceCancelWindowUnit: "",
    });
    expect(enabled.errors.some((error) => error.field === "cancellationFee")).toBe(true);
    expect(enabled.errors.some((error) => error.field === "advanceVoid")).toBe(true);
    expect(enabled.errors.some((error) => error.field === "advanceCancelWindowUnit")).toBe(true);
  });
});
