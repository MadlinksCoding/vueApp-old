import { describe, expect, it } from "vitest";
import {
  buildBookingPaymentPreview,
  mapCreateBookingToRequest,
} from "@/services/bookings/mappers/createBookingMapper.js";

describe("create booking mapper", () => {
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
      },
    };

    const preview = buildBookingPaymentPreview(event, 180, [], {}, { contributionTokens: 250 });
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

  it("caps event-goal contribution preview between minimum and goal", () => {
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
    expect(buildBookingPaymentPreview(event, 180, [], {}, { contributionTokens: 700 }).contributionTokens).toBe(500);
  });
});
