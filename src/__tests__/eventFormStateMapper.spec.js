import { describe, expect, it } from "vitest";
import { mapEventToBookingFormState } from "@/services/events/mappers/eventFormStateMapper.js";

describe("eventFormStateMapper", () => {
  it("hydrates edit form state from a full event object", () => {
    const event = {
      eventId: "evt_edit",
      creatorId: 1407,
      type: "group-event",
      status: "active",
      title: "Creator Workshop",
      description: "A focused session",
      eventColorSkin: "#E11D48",
      eventCallType: "video",
      repeatRule: "weekly",
      dateFrom: "2026-05-25",
      dateTo: "2026-06-25",
      slots: [{ day: "monday", startTime: "10:00", endTime: "12:00", offHours: true }],
      priceSetting: "fixedPricePerUser",
      basePriceTokens: 75,
      eventGoalTokens: 1000,
      minContributionPerUser: 100,
      enableMaxAttendees: true,
      maxAttendees: 8,
      addOns: [{ title: "VIP setup", description: "Prep", priceTokens: 25 }],
      disableChatDuringCall: true,
      disableChatDuringCallAllowEmoji: true,
      enableCallReminderMinutesBefore: true,
      callReminderMinutesBefore: 15,
      enableBufferTime: true,
      bookingBufferMinutes: 10,
      enableMaxBookingsPerDay: true,
      maxBookingsPerDay: 4,
      fanCanRequestExtend: true,
      extendMaxSessions: 2,
      enableRescheduleFee: true,
      rescheduleFeeTokens: 13,
      enableCancellationFee: true,
      cancellationFeeTokens: 21,
      whoCanBook: "inviteOnly",
      invitedUsers: [{ id: 1, name: "Ava" }],
      spendingRequirement: "mustOwnProducts",
      requiredProducts: [{ id: 9, title: "Product" }],
      socialAutoPost: {
        onScheduleLive: true,
        onBookingReceived: true,
      },
    };

    const state = mapEventToBookingFormState(event);

    expect(state).toEqual(expect.objectContaining({
      formMode: "edit",
      isEditMode: true,
      editEventId: "evt_edit",
      eventId: "evt_edit",
      eventType: "group-event",
      eventTitle: "Creator Workshop",
      eventDescription: "A focused session",
      eventColorSkin: "#E11D48",
      repeatRule: "weekly",
      priceSetting: "fixedPricePerUser",
      basePrice: "75",
      eventGoalTokens: "1000",
      minContributionPerUser: "100",
      enableMaxAttendees: true,
      maxAttendees: "8",
      disableChatDuringCall: true,
      disableChatDuringCallAllowEmoji: true,
      setReminders: true,
      remindMeTime: "15",
      setBufferTime: true,
      bufferTime: "10",
      setMaxBookings: true,
      maxBookingsPerDay: "4",
      requestExtendSession: true,
      extendSessionMax: "2",
      enableRescheduleFee: true,
      rescheduleFee: "13",
      enableCancellationFee: true,
      cancellationFee: "21",
      whoCanBook: "inviteOnly",
      spendingRequirement: "mustOwnProducts",
      xPostLive: true,
      xPostBooked: true,
      originalEvent: event,
    }));
    expect(state.addOns).toEqual([{ title: "VIP setup", description: "Prep", priceTokens: "25" }]);
    expect(state.invitedUsers).toEqual([{ id: 1, name: "Ava" }]);
    expect(state.requiredProducts).toEqual([{ id: 9, title: "Product" }]);
    expect(state.weeklyAvailability.some((day) => !day.unavailable && day.slots.length > 0)).toBe(true);
  });

  it("preserves off-hour flags for one-time edit slots", () => {
    const state = mapEventToBookingFormState({
      eventId: "evt_custom_off_hours",
      type: "1on1-call",
      title: "Custom Slot",
      repeatRule: "doesNotRepeat",
      dateFrom: "2026-06-11",
      dateTo: "2026-06-11",
      slots: [{
        date: "2026-06-11",
        times: [
          { startTime: "12:00", endTime: "15:00", offHours: true },
          { startTime: "15:00", endTime: "18:00", offHours: false },
        ],
      }],
    });

    expect(state.repeatRule).toBe("doesNotRepeat");
    expect(state.oneTimeAvailability[0].slots.map((slot) => slot.offHours)).toEqual([true, false]);
  });
});
