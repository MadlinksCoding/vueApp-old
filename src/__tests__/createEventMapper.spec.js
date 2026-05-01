import { describe, expect, it } from "vitest";
import { createEventMapper } from "@/services/events/mappers/createEventMapper.js";

const baseDraft = {
  creatorId: 1407,
  eventTitle: "Test Event",
  eventDescription: "Test description",
  eventColorSkin: "#5549FF",
  eventCallType: "video",
  eventRingtoneUrl: "https://example.com/ring.mp3",
  duration: 30,
  selectedDate: "2026-05-04",
  selectedStartTime: "15:00",
  selectedEndTime: "15:30",
  repeatRule: "weekly",
  weeklyAvailability: [
    {
      key: "monday",
      slots: [{ startTime: "15:00", endTime: "15:30" }],
    },
  ],
  whoCanBook: "everyone",
  spendingRequirement: "none",
};

describe("createEventMapper", () => {
  it("keeps private event price mapping unchanged", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "1on1-call",
      basePrice: "120",
    });

    expect(mapped.type).toBe("1on1-call");
    expect(mapped.basePriceTokens).toBe(120);
    expect(mapped.priceSetting).toBeUndefined();
    expect(mapped.eventGoalTokens).toBeUndefined();
  });

  it("maps eventDescription to the backend description field", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "group-event",
      priceSetting: "eventGoal",
      eventGoalTokens: "8000",
      eventDescription: "<p>Join us for a spectacular live stream event.</p>",
    });

    expect(mapped.description).toBe("<p>Join us for a spectacular live stream event.</p>");
  });

  it("maps group fixed price settings", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "group-event",
      priceSetting: "fixedPricePerUser",
      basePrice: "1000",
      setMaxUsers: true,
      maxUsers: "150",
      allowWaitlist: true,
      waitlistSpots: "20",
      enableLongerDiscount: true,
      discountEventsCount: "3",
      discountPercentage: "20",
      enableCancellationFee: true,
      cancellationFee: "20",
      allowAdvanceCancellation: true,
      advanceVoid: "1",
      advanceCancelWindowUnit: "day",
    });

    expect(mapped.type).toBe("group-event");
    expect(mapped.priceSetting).toBe("fixedPricePerUser");
    expect(mapped.basePriceTokens).toBe(1000);
    expect(mapped.enableMaxUsersInGroup).toBe(true);
    expect(mapped.maxUsersInGroup).toBe(150);
    expect(mapped.waitlistEnabled).toBe(true);
    expect(mapped.waitlistSpots).toBe(20);
    expect(mapped.enableDiscountForRecurring).toBe(true);
    expect(mapped.minEventsForRecurringDiscount).toBe(3);
    expect(mapped.recurringDiscountPercentOfBase).toBe(20);
    expect(mapped.enableCancellationFee).toBe(true);
    expect(mapped.cancellationFeeTokens).toBe(20);
    expect(mapped.allowAdvanceCancelToAvoidMinCharge).toBe(true);
    expect(mapped.advanceCancelWindowQuantity).toBe(1);
    expect(mapped.advanceCancelWindowUnit).toBe("day");
  });

  it("maps group event-goal settings without treating the goal as per-user price", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "group-event",
      priceSetting: "eventGoal",
      eventGoalTokens: "8000",
      enableMinContributionPerUser: true,
      minContributionPerUser: "1000",
      goalNotMet: "cancelEvent",
      enableCancellationFee: true,
      cancellationFee: "20",
      allowAdvanceCancellation: true,
      advanceVoid: "1",
      advanceCancelWindowUnit: "day",
    });

    expect(mapped.type).toBe("group-event");
    expect(mapped.priceSetting).toBe("eventGoal");
    expect(mapped.basePriceTokens).toBe(0);
    expect(mapped.eventGoalTokens).toBe(8000);
    expect(mapped.minContributionPerUser).toBe(1000);
    expect(mapped.goalNotMet).toBe("cancelEvent");
    expect(mapped.enableCancellationFee).toBe(true);
    expect(mapped.cancellationFeeTokens).toBe(20);
    expect(mapped.allowAdvanceCancelToAvoidMinCharge).toBe(true);
  });

  it("derives group compatibility duration from the first availability slot", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      duration: "",
      eventType: "group-event",
      priceSetting: "fixedPricePerUser",
      basePrice: "100",
      weeklyAvailability: [
        {
          key: "monday",
          slots: [{ startTime: "12:00", endTime: "15:00" }],
        },
      ],
    });

    expect(mapped.sessionDurationMinutes).toBe(180);
  });
});
