import { describe, expect, it } from "vitest";
import {
  buildCandidateSlotsForEventDate,
  buildBookedSlotsIndex,
  createSlotUiModel,
  isRangeBooked,
  isSlotBooked,
} from "@/services/bookings/utils/bookingSlotUtils.js";

const eventId = "event_77";
const localDateIso = "2030-01-15";

function makeIndex(status) {
  return buildBookedSlotsIndex([
    {
      bookingId: `booking_${status || "none"}`,
      eventId,
      startIso: `${localDateIso}T10:00:00`,
      endIso: `${localDateIso}T10:30:00`,
      status,
    },
  ]);
}

function makeSlot(startHm = "10:00", endHm = "10:30") {
  const startMs = new Date(`${localDateIso}T${startHm}:00`).getTime();
  const endMs = new Date(`${localDateIso}T${endHm}:00`).getTime();
  return {
    localDateIso,
    startHm,
    endHm,
    startMs,
    endMs,
    value: startHm,
    label: startHm,
  };
}

function makeBufferedEvent() {
  return {
    eventId,
    localDateIso,
    localStartHm: "10:00",
    localEndHm: "11:30",
    raw: {
      repeatRule: "doesNotRepeat",
      sessionDurationMinutes: 30,
      enableBufferTime: true,
      bookingBufferMinutes: 15,
    },
  };
}

describe("booking slot utilities", () => {
  it.each(["confirmed", "pending", "active", null])(
    "disables overlapping slots for blocking status %s",
    (status) => {
      const bookedSlotsIndex = makeIndex(status);
      const slot = makeSlot();

      expect(isSlotBooked({ eventId, localDateIso, slot, bookedSlotsIndex })).toBe(true);
      expect(createSlotUiModel({ eventId, localDateIso, slot, bookedSlotsIndex }).disabled).toBe(true);
    },
  );

  it.each(["cancelled", "canceled", "cancelled_by_creator", "Creator_Cancelled"])(
    "keeps overlapping slots available for cancelled status %s",
    (status) => {
      const bookedSlotsIndex = makeIndex(status);
      const slot = makeSlot();

      expect(isSlotBooked({ eventId, localDateIso, slot, bookedSlotsIndex })).toBe(false);
      expect(createSlotUiModel({ eventId, localDateIso, slot, bookedSlotsIndex }).disabled).toBe(false);
    },
  );

  it("ignores cancelled overlaps when checking a longer selected range", () => {
    const bookedSlotsIndex = makeIndex("cancelled_by_fan");
    const startMs = new Date(`${localDateIso}T09:45:00`).getTime();
    const endMs = new Date(`${localDateIso}T10:45:00`).getTime();

    expect(isRangeBooked({ eventId, startMs, endMs, bookedSlotsIndex })).toBe(false);
  });

  it("still blocks longer selected ranges that overlap active bookings", () => {
    const bookedSlotsIndex = makeIndex("confirmed");
    const startMs = new Date(`${localDateIso}T09:45:00`).getTime();
    const endMs = new Date(`${localDateIso}T10:45:00`).getTime();

    expect(isRangeBooked({ eventId, startMs, endMs, bookedSlotsIndex })).toBe(true);
  });

  it("does not apply post-booked buffer after cancelled bookings", () => {
    const cancelledSlots = buildCandidateSlotsForEventDate(makeBufferedEvent(), localDateIso, {
      eventId,
      bookedSlotsIndex: makeIndex("cancelled"),
      applyBufferAfterBooked: true,
    });
    const activeSlots = buildCandidateSlotsForEventDate(makeBufferedEvent(), localDateIso, {
      eventId,
      bookedSlotsIndex: makeIndex("confirmed"),
      applyBufferAfterBooked: true,
    });

    expect(cancelledSlots.map((slot) => slot.startHm)).toEqual(["10:00", "10:30", "11:00"]);
    expect(activeSlots.map((slot) => slot.startHm)).toEqual(["10:00", "10:45"]);
  });
});
