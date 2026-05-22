import { describe, expect, it } from "vitest";
import { updateEventMapper } from "@/services/events/mappers/updateEventMapper.js";

function makeGroupEditPayload(overrides = {}) {
  return {
    eventId: "evt_group_locked",
    creatorId: 1407,
    eventType: "group-event",
    eventTitle: "Updated Group Title",
    eventDescription: "Updated non-pricing copy",
    eventColorSkin: "#22C55E",
    eventCallType: "video",
    repeatRule: "weekly",
    selectedDate: "2026-05-25",
    selectedStartTime: "10:00",
    selectedEndTime: "11:00",
    weeklyAvailability: [
      {
        key: "monday",
        name: "Mon",
        unavailable: false,
        slots: [{ startTime: "10:00", endTime: "11:00" }],
      },
    ],
    priceSetting: "fixedPricePerUser",
    basePrice: "99",
    enableLongerDiscount: true,
    discountEventsCount: "2",
    discountPercentage: "10",
    enableCancellationFee: true,
    cancellationFee: "7",
    allowAdvanceCancellation: true,
    advanceVoid: "2",
    advanceCancelWindowUnit: "day",
    whoCanBook: "everyone",
    spendingRequirement: "none",
    ...overrides,
  };
}

describe("updateEventMapper", () => {
  it("strips group pricing fields when pricing editing is locked", () => {
    const mapped = updateEventMapper(makeGroupEditPayload(), {
      creatorId: 1407,
      isGroupPricingLocked: true,
    });

    expect(mapped).toEqual(expect.objectContaining({
      eventId: "evt_group_locked",
      title: "Updated Group Title",
      description: "Updated non-pricing copy",
      eventColorSkin: "#22C55E",
    }));
    expect(mapped.slots).toEqual(expect.any(Array));
    expect(mapped.priceSetting).toBeUndefined();
    expect(mapped.basePriceTokens).toBeUndefined();
    expect(mapped.enableDiscountForRecurring).toBeUndefined();
    expect(mapped.minEventsForRecurringDiscount).toBeUndefined();
    expect(mapped.recurringDiscountPercentOfBase).toBeUndefined();
    expect(mapped.enableCancellationFee).toBeUndefined();
    expect(mapped.cancellationFeeTokens).toBeUndefined();
    expect(mapped.allowAdvanceCancelToAvoidMinCharge).toBeUndefined();
    expect(mapped.advanceCancelWindowQuantity).toBeUndefined();
    expect(mapped.advanceCancelWindowUnit).toBeUndefined();
  });

  it("keeps group pricing fields when pricing editing is unlocked", () => {
    const mapped = updateEventMapper(makeGroupEditPayload(), {
      creatorId: 1407,
      isGroupPricingLocked: false,
    });

    expect(mapped.priceSetting).toBe("fixedPricePerUser");
    expect(mapped.basePriceTokens).toBe(99);
    expect(mapped.enableDiscountForRecurring).toBe(true);
    expect(mapped.minEventsForRecurringDiscount).toBe(2);
    expect(mapped.recurringDiscountPercentOfBase).toBe(10);
    expect(mapped.enableCancellationFee).toBe(true);
    expect(mapped.cancellationFeeTokens).toBe(7);
    expect(mapped.allowAdvanceCancelToAvoidMinCharge).toBe(true);
    expect(mapped.advanceCancelWindowQuantity).toBe(2);
    expect(mapped.advanceCancelWindowUnit).toBe("day");
  });
});
