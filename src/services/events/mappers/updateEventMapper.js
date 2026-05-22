import { createEventMapper } from "@/services/events/mappers/createEventMapper.js";

const SCHEDULE_FIELDS = new Set([
  "repeatRule",
  "dateFrom",
  "dateTo",
  "slots",
  "eventTime",
  "repeatX",
]);

const GROUP_PRICING_FIELDS = new Set([
  "priceSetting",
  "priceSettings",
  "basePrice",
  "basePriceTokens",
  "eventGoalTokens",
  "enableMinContributionPerUser",
  "minContributionPerUser",
  "goalNotMet",
  "enableLongerDiscount",
  "enableDiscountForRecurring",
  "discountEventsCount",
  "discountMinSessions",
  "minEventsForRecurringDiscount",
  "discountPercentage",
  "discountPercentOfBase",
  "recurringDiscountPercentOfBase",
  "enableCancellationFee",
  "cancellationFee",
  "cancellationFeeTokens",
  "allowAdvanceCancellation",
  "allowAdvanceCancelToAvoidMinCharge",
  "advanceVoid",
  "advanceCancelWindowQuantity",
  "advanceCancelWindowUnit",
]);

export function updateEventMapper(payload = {}, context = {}) {
  const mapped = createEventMapper(payload, context);
  const eventId = payload.eventId || payload.editEventId || context.eventId || null;

  delete mapped.idempotencyKey;

  if (payload.isGroupScheduleLocked || context.isGroupScheduleLocked) {
    SCHEDULE_FIELDS.forEach((field) => {
      delete mapped[field];
    });
  }

  if (payload.isGroupPricingLocked || context.isGroupPricingLocked) {
    GROUP_PRICING_FIELDS.forEach((field) => {
      delete mapped[field];
    });
  }

  return {
    ...mapped,
    eventId,
  };
}
