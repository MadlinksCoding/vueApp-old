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
  it("includes an explicit creator timezone for private events", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "1on1-call",
      creatorTimezone: "Asia/Manila",
      basePrice: "120",
    });

    expect(mapped.type).toBe("1on1-call");
    expect(mapped.creatorTimezone).toBe("Asia/Manila");
  });

  it("uses creatorData timezone aliases before browser fallback", () => {
    const mapped = createEventMapper(
      {
        ...baseDraft,
        eventType: "group-event",
        priceSetting: "fixedPricePerUser",
        basePrice: "1000",
      },
      {
        creatorData: {
          time_zone: "America/New_York",
        },
      },
    );

    expect(mapped.type).toBe("group-event");
    expect(mapped.creatorTimezone).toBe("America/New_York");
  });

  it("falls back to a usable creator timezone when none is provided", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "1on1-call",
      basePrice: "120",
    });

    expect(typeof mapped.creatorTimezone).toBe("string");
    expect(mapped.creatorTimezone.length).toBeGreaterThan(0);
  });

  it("keeps private event price mapping unchanged", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "1on1-call",
      basePrice: "120",
      allowInstantBooking: true,
      setMaxBookings: true,
      maxBookingsPerDay: "3",
      allowWaitlist: true,
      waitlistSpots: "20",
      allowRecording: true,
      recordingPrice: "15",
      allowPersonalRequest: true,
      addOns: [{ title: "VIP setup", description: "", priceTokens: "25" }],
    });

    expect(mapped.type).toBe("1on1-call");
    expect(mapped.basePriceTokens).toBe(120);
    expect(mapped.allowInstantBooking).toBe(true);
    expect(mapped.enableMaxBookingsPerDay).toBe(true);
    expect(mapped.maxBookingsPerDay).toBe(3);
    expect(mapped.waitlistEnabled).toBeUndefined();
    expect(mapped.waitlistSpots).toBeUndefined();
    expect(mapped.allowFanRecordingEnabled).toBe(true);
    expect(mapped.allowFanRecordingTokens).toBe(15);
    expect(mapped.allowPersonalRequestRequired).toBe(true);
    expect(mapped.addOns).toEqual([{ title: "VIP setup", description: "", priceTokens: 25 }]);
    expect(mapped.priceSetting).toBeUndefined();
    expect(mapped.eventGoalTokens).toBeUndefined();
  });

  it("maps private discounts to fixed token fields", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "1on1-call",
      basePrice: "50",
      enableLongerDiscount: true,
      sessionMinimum: "2",
      longerSessionDiscountTokens: "10",
      enableFirstTimeDiscount: true,
      firstTimeDiscountTokens: "8",
    });

    expect(mapped.enableDiscountForLonger).toBe(true);
    expect(mapped.discountMinSessions).toBe(2);
    expect(mapped.longerSessionDiscountTokens).toBe(10);
    expect(mapped.discountPercentOfBase).toBeUndefined();
    expect(mapped.enableFirstTimeDiscount).toBe(true);
    expect(mapped.firstTimeDiscountTokens).toBe(8);
    expect(mapped.firstTimeDiscount).toBeUndefined();
  });

  it("preserves private-only call settings for private events", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "1on1-call",
      basePrice: "120",
      lateStartAction: "nextDiscount",
      lateStartDiscountPercent: "15",
      disableChatDuringCall: true,
      disableChatDuringCallAllowEmoji: true,
      requestExtendSession: true,
      extendSessionMax: "2",
    });

    expect(mapped.type).toBe("1on1-call");
    expect(mapped.disableChatDuringCall).toBe(true);
    expect(mapped.disableChatDuringCallAllowEmoji).toBe(true);
    expect(mapped.fanCanRequestExtend).toBe(true);
    expect(mapped.extendMaxSessions).toBe(2);
    expect(mapped.lateStartPolicy).toEqual({
      action: "nextDiscount",
      discountPercent: 15,
    });
  });

  it("clears during-call emoji replies when in-call chat is not disabled", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "1on1-call",
      basePrice: "120",
      disableChatDuringCall: false,
      disableChatDuringCallAllowEmoji: true,
    });

    expect(mapped.type).toBe("1on1-call");
    expect(mapped.disableChatDuringCall).toBe(false);
    expect(mapped.disableChatDuringCallAllowEmoji).toBe(false);
  });

  it("converts hourly buffer time to backend minutes", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "1on1-call",
      basePrice: "120",
      setBufferTime: true,
      bufferUnit: "hours",
      bufferTime: "2",
    });

    expect(mapped.enableBufferTime).toBe(true);
    expect(mapped.bookingBufferMinutes).toBe(120);
  });

  it("omits booking buffer minutes when buffer time is disabled", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "1on1-call",
      basePrice: "120",
      setBufferTime: false,
      bufferUnit: "minutes",
      bufferTime: "2",
    });

    expect(mapped.enableBufferTime).toBe(false);
    expect(mapped).not.toHaveProperty("bookingBufferMinutes");
  });

  it("omits private-only call settings for group events", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "group-event",
      priceSetting: "fixedPricePerUser",
      basePrice: "1000",
      lateStartAction: "nextDiscount",
      lateStartDiscountPercent: "15",
      disableChatDuringCall: true,
      disableChatDuringCallAllowEmoji: true,
      requestExtendSession: true,
      extendSessionMax: "2",
    });

    expect(mapped.type).toBe("group-event");
    expect(mapped).not.toHaveProperty("disableChatDuringCall");
    expect(mapped).not.toHaveProperty("disableChatDuringCallAllowEmoji");
    expect(mapped).not.toHaveProperty("fanCanRequestExtend");
    expect(mapped).not.toHaveProperty("extendMaxSessions");
    expect(mapped).not.toHaveProperty("lateStartPolicy");
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
      allowInstantBooking: false,
      enableMaxAttendees: true,
      maxAttendees: "150",
      setMaxBookings: true,
      maxBookingsPerDay: "3",
      allowWaitlist: true,
      waitlistSpots: "20",
      allowRecording: true,
      recordingPrice: "15",
      allowPersonalRequest: true,
      addOns: [{ title: "VIP setup", description: "", priceTokens: "25" }],
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
    expect(mapped.allowInstantBooking).toBe(true);
    expect(mapped.enableMaxAttendees).toBe(true);
    expect(mapped.maxAttendees).toBe(150);
    expect(mapped).not.toHaveProperty("enableMaxUsersInGroup");
    expect(mapped).not.toHaveProperty("maxUsersInGroup");
    expect(mapped.enableMaxBookingsPerDay).toBeUndefined();
    expect(mapped.maxBookingsPerDay).toBeUndefined();
    expect(mapped.waitlistEnabled).toBeUndefined();
    expect(mapped.waitlistSpots).toBeUndefined();
    expect(mapped.allowFanRecordingEnabled).toBeUndefined();
    expect(mapped.allowFanRecordingTokens).toBeUndefined();
    expect(mapped.allowPersonalRequestRequired).toBeUndefined();
    expect(mapped.addOns).toBeUndefined();
    expect(mapped.enableDiscountForLonger).toBe(false);
    expect(mapped.discountMinSessions).toBeUndefined();
    expect(mapped.discountPercentOfBase).toBeUndefined();
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
      enableMaxAttendees: true,
      maxAttendees: "75",
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
    expect(mapped.priceSetting).toBe("eventGoal");
    expect(mapped.basePriceTokens).toBe(0);
    expect(mapped.eventGoalTokens).toBe(8000);
    expect(mapped.minContributionPerUser).toBe(1000);
    expect(mapped.goalNotMet).toBe("cancelEvent");
    expect(mapped.enableMaxAttendees).toBe(true);
    expect(mapped.maxAttendees).toBe(75);
    expect(mapped.enableDiscountForLonger).toBe(false);
    expect(mapped.enableDiscountForRecurring).toBe(false);
    expect(mapped.minEventsForRecurringDiscount).toBeUndefined();
    expect(mapped.recurringDiscountPercentOfBase).toBeUndefined();
    expect(mapped).not.toHaveProperty("enableMaxUsersInGroup");
    expect(mapped).not.toHaveProperty("maxUsersInGroup");
    expect(mapped.enableCancellationFee).toBe(true);
    expect(mapped.cancellationFeeTokens).toBe(20);
    expect(mapped.allowAdvanceCancelToAvoidMinCharge).toBe(true);
  });

  it("ignores legacy group max participant fields", () => {
    const mapped = createEventMapper({
      ...baseDraft,
      eventType: "group-event",
      priceSetting: "fixedPricePerUser",
      basePrice: "1000",
      setMaxUsers: true,
      maxUsers: "150",
      enableMaxUsersInGroup: true,
      maxUsersInGroup: 150,
    });

    expect(mapped.enableMaxAttendees).toBe(false);
    expect(mapped).not.toHaveProperty("maxAttendees");
    expect(mapped).not.toHaveProperty("enableMaxUsersInGroup");
    expect(mapped).not.toHaveProperty("maxUsersInGroup");
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
