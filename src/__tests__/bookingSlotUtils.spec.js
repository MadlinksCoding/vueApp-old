import { describe, expect, it } from "vitest";
import {
  buildCandidateSlotsForEventDate,
  buildBookedSlotsIndex,
  createSlotUiModel,
  isRangeBooked,
  isSlotBooked,
  isSlotBookedByUser,
  computeNextAvailableSlot,
} from "@/services/bookings/utils/bookingSlotUtils.js";

const eventId = "event_77";
const localDateIso = "2030-01-15";

function dateIsoFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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

  it("keeps group availability windows whole instead of slicing by session duration", () => {
    const slots = buildCandidateSlotsForEventDate({
      eventId,
      type: "group-event",
      localDateIso,
      localStartHm: "10:00",
      localEndHm: "13:00",
      raw: {
        type: "group-event",
        repeatRule: "doesNotRepeat",
        sessionDurationMinutes: 30,
      },
    }, localDateIso, { eventId, bookedSlotsIndex: {} });

    expect(slots).toHaveLength(1);
    expect(slots[0].startHm).toBe("10:00");
    expect(slots[0].endHm).toBe("13:00");
    expect(slots[0].durationMinutes).toBe(180);
  });

  it("allows group slot overlaps until capacity is reached", () => {
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "booking_1",
        eventId,
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "confirmed",
      },
    ]);
    const event = {
      eventId,
      type: "group-event",
      maxAttendees: 2,
      enableMaxAttendees: true,
      raw: { type: "group-event", maxAttendees: 2, enableMaxAttendees: true },
    };
    const slot = makeSlot("10:00", "13:00");

    expect(createSlotUiModel({ event, eventId, localDateIso, slot, bookedSlotsIndex }).disabled).toBe(false);

    bookedSlotsIndex[eventId][localDateIso].push({
      bookingId: "booking_2",
      startIso: `${localDateIso}T10:00:00`,
      endIso: `${localDateIso}T13:00:00`,
      startMs: slot.startMs,
      endMs: slot.endMs,
      status: "confirmed",
    });

    expect(createSlotUiModel({ event, eventId, localDateIso, slot, bookedSlotsIndex }).disabled).toBe(true);
  });

  it("disables private slots when the daily booking limit is reached", () => {
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "booking_1",
        eventId,
        startIso: `${localDateIso}T09:00:00`,
        endIso: `${localDateIso}T09:30:00`,
        status: "confirmed",
      },
      {
        bookingId: "booking_cancelled",
        eventId,
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T10:30:00`,
        status: "cancelled_user",
      },
    ]);
    const event = {
      eventId,
      type: "1on1-call",
      enableMaxBookingsPerDay: true,
      maxBookingsPerDay: 1,
      raw: {
        type: "1on1-call",
        enableMaxBookingsPerDay: true,
        maxBookingsPerDay: 1,
      },
    };
    const openSlot = makeSlot("11:00", "11:30");

    expect(createSlotUiModel({ event, eventId, localDateIso, slot: openSlot, bookedSlotsIndex }).disabled).toBe(true);
  });

  it("ignores daily booking limits for group slots", () => {
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "booking_1",
        eventId,
        startIso: `${localDateIso}T09:00:00`,
        endIso: `${localDateIso}T09:30:00`,
        status: "confirmed",
      },
    ]);
    const event = {
      eventId,
      type: "group-event",
      enableMaxBookingsPerDay: true,
      maxBookingsPerDay: 1,
      enableMaxAttendees: true,
      maxAttendees: 2,
      raw: {
        type: "group-event",
        enableMaxBookingsPerDay: true,
        maxBookingsPerDay: 1,
        enableMaxAttendees: true,
        maxAttendees: 2,
      },
    };
    const groupSlot = makeSlot("11:00", "14:00");

    expect(createSlotUiModel({ event, eventId, localDateIso, slot: groupSlot, bookedSlotsIndex }).disabled).toBe(false);
  });

  it("ignores legacy group capacity fields", () => {
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "booking_1",
        eventId,
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "confirmed",
      },
    ]);
    const event = {
      eventId,
      type: "group-event",
      enableMaxUsersInGroup: true,
      maxUsersInGroup: 1,
      raw: { type: "group-event", enableMaxUsersInGroup: true, maxUsersInGroup: 1 },
    };
    const slot = makeSlot("10:00", "13:00");

    expect(createSlotUiModel({ event, eventId, localDateIso, slot, bookedSlotsIndex }).disabled).toBe(false);
  });

  it("detects active group slot bookings by user and ignores cancelled rows", () => {
    const slot = makeSlot("10:00", "13:00");
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "booking_cancelled",
        eventId,
        userId: 2615,
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "cancelled_user",
      },
      {
        bookingId: "booking_other",
        eventId,
        userId: 2616,
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "confirmed",
      },
    ]);

    expect(isSlotBookedByUser({ eventId, userId: 2615, slot, bookedSlotsIndex })).toBe(false);
    expect(isSlotBookedByUser({ eventId, userId: 2616, slot, bookedSlotsIndex })).toBe(true);
  });

  it("detects active group slot bookings by fanId fallback", () => {
    const slot = makeSlot("10:00", "13:00");
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "booking_fan_id",
        eventId,
        fanId: 2615,
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "confirmed",
      },
    ]);

    expect(isSlotBookedByUser({ eventId, userId: " 2615 ", slot, bookedSlotsIndex })).toBe(true);
    expect(isSlotBookedByUser({ eventId, userId: 2616, slot, bookedSlotsIndex })).toBe(false);
  });

  it("detects active group slot bookings by nested user and fan id fallbacks", () => {
    const slot = makeSlot("10:00", "13:00");
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "booking_user_object",
        eventId,
        user: { id: "fan_nested_user" },
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "confirmed",
      },
      {
        bookingId: "booking_fan_object",
        eventId,
        fan: { userId: 2615 },
        startIso: `${localDateIso}T11:00:00`,
        endIso: `${localDateIso}T14:00:00`,
        status: "confirmed",
      },
    ]);

    expect(isSlotBookedByUser({ eventId, userId: "fan_nested_user", slot, bookedSlotsIndex })).toBe(true);
    expect(isSlotBookedByUser({ eventId, userId: 2615, slot, bookedSlotsIndex })).toBe(true);
    expect(isSlotBookedByUser({ eventId, userId: 2616, slot, bookedSlotsIndex })).toBe(false);
  });

  it("detects the reported HKT group slot as already booked by the current fan", () => {
    const reportedEventId = "evt_a703b07e-e45e-45f3-a7b5-d261462e16b7";
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "b_evt_a703b07e-e45e-45f3-a7b5-d261462e16b7_1777813826709_37211",
        eventId: reportedEventId,
        userId: 2615,
        startIso: "2026-05-04T14:00:00+08:00",
        endIso: "2026-05-04T17:00:00+08:00",
        status: "confirmed",
      },
    ]);
    const localSlotDate = dateIsoFromDate(new Date("2026-05-04T14:00:00+08:00"));
    const event = {
      eventId: reportedEventId,
      type: "group-event",
      raw: {
        type: "group-event",
        repeatRule: "doesNotRepeat",
        sessionDurationMinutes: 180,
        enableMaxAttendees: true,
        maxAttendees: 2,
        slots: [{
          date: "2026-05-04",
          times: [{ startTime: "14:00", endTime: "17:00", offHours: false }],
        }],
      },
    };
    const [slot] = buildCandidateSlotsForEventDate(event, localSlotDate, {
      eventId: reportedEventId,
      bookedSlotsIndex,
    });

    expect(isSlotBookedByUser({
      eventId: reportedEventId,
      userId: 2615,
      slot,
      bookedSlotsIndex,
    })).toBe(true);
  });

  it("skips group slots already booked by the current user without treating other users as duplicates", () => {
    const firstDateIso = new Date();
    firstDateIso.setHours(0, 0, 0, 0);
    firstDateIso.setDate(firstDateIso.getDate() + 1);
    const secondDate = new Date(firstDateIso);
    secondDate.setDate(secondDate.getDate() + 1);
    const first = `${firstDateIso.getFullYear()}-${String(firstDateIso.getMonth() + 1).padStart(2, "0")}-${String(firstDateIso.getDate()).padStart(2, "0")}`;
    const second = `${secondDate.getFullYear()}-${String(secondDate.getMonth() + 1).padStart(2, "0")}-${String(secondDate.getDate()).padStart(2, "0")}`;
    const event = {
      eventId,
      type: "group-event",
      localDateIso: first,
      localStartHm: "10:00",
      localEndHm: "13:00",
      raw: {
        type: "group-event",
        repeatRule: "daily",
        sessionDurationMinutes: 180,
        enableMaxAttendees: true,
        maxAttendees: 2,
      },
    };
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "booking_current_user",
        eventId,
        userId: 2615,
        startIso: `${first}T10:00:00`,
        endIso: `${first}T13:00:00`,
        status: "confirmed",
      },
      {
        bookingId: "booking_other_user",
        eventId,
        userId: 2616,
        startIso: `${second}T10:00:00`,
        endIso: `${second}T13:00:00`,
        status: "confirmed",
      },
    ]);

    const next = computeNextAvailableSlot(event, bookedSlotsIndex, 2, { skipBookedByUserId: 2615 });

    expect(next?.dateIso).toBe(second);
  });
});
