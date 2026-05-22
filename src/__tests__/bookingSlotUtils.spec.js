import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCandidateSlotsForEventDate,
  buildBookedSlotsIndex,
  createSlotUiModel,
  isRangeBooked,
  isSlotBooked,
  isSlotBookedByUser,
  computeNextAvailableSlot,
  mapBookedSlotsToCalendarEvents,
  mapAvailabilityToCalendarEvents,
  resolveBookedSlotEffectiveEndIso,
  sumEventGoalContributionsForSlot,
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

function setFixedNow() {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${localDateIso}T12:00:00`));
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("uses the latest held or captured extension as a booked slot's effective end", () => {
    const slot = {
      eventId,
      startIso: `${localDateIso}T10:00:00`,
      endIso: `${localDateIso}T10:30:00`,
      status: "confirmed",
      extensions: [
        { status: "captured", endAtIso: `${localDateIso}T10:45:00` },
        { status: "cancelled", endAtIso: `${localDateIso}T11:15:00` },
        { status: "held", endAtIso: `${localDateIso}T10:50:00` },
        { status: "failed", endAtIso: `${localDateIso}T12:00:00` },
      ],
    };

    expect(resolveBookedSlotEffectiveEndIso(slot)).toBe(`${localDateIso}T10:50:00`);
  });

  it("does not shorten bookings when an active extension ends before the base booking", () => {
    expect(resolveBookedSlotEffectiveEndIso({
      eventId,
      startIso: `${localDateIso}T10:00:00`,
      endIso: `${localDateIso}T10:30:00`,
      status: "confirmed",
      extensions: [{ status: "captured", endAtIso: `${localDateIso}T10:20:00` }],
    })).toBe(`${localDateIso}T10:30:00`);
  });

  it("maps booked slot calendar events through the effective extension end", () => {
    const [event] = mapBookedSlotsToCalendarEvents([{
      bookingId: "booking_extended",
      eventId,
      startIso: `${localDateIso}T10:00:00`,
      endIso: `${localDateIso}T10:30:00`,
      status: "confirmed",
      eventTitle: "Extended Private Call",
      eventType: "1on1-call",
      extensions: [{ status: "held", endAtIso: `${localDateIso}T10:45:00` }],
    }]);

    expect(event).toEqual(expect.objectContaining({
      bookingId: "booking_extended",
      start: `${localDateIso}T10:00:00`,
      end: `${localDateIso}T10:45:00`,
    }));
  });

  it("indexes booked slot overlaps through the effective extension end", () => {
    const bookedSlotsIndex = buildBookedSlotsIndex([{
      bookingId: "booking_extended",
      eventId,
      startIso: `${localDateIso}T10:00:00`,
      endIso: `${localDateIso}T10:30:00`,
      status: "confirmed",
      extensions: [{ status: "captured", endAtIso: `${localDateIso}T10:45:00` }],
    }]);
    const extendedOverlapSlot = makeSlot("10:35", "10:40");
    const afterExtensionSlot = makeSlot("10:45", "11:00");

    expect(bookedSlotsIndex[eventId][localDateIso][0]).toEqual(expect.objectContaining({
      endIso: `${localDateIso}T10:45:00`,
      endHm: "10:45",
    }));
    expect(isSlotBooked({ eventId, localDateIso, slot: extendedOverlapSlot, bookedSlotsIndex })).toBe(true);
    expect(isSlotBooked({ eventId, localDateIso, slot: afterExtensionSlot, bookedSlotsIndex })).toBe(false);
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

  it("keeps a partially booked group availability window visible in scheduleWindow mode", () => {
    const blocks = mapAvailabilityToCalendarEvents([{
      eventId,
      type: "group-event",
      status: "active",
      localDateIso,
      localStartHm: "10:00",
      localEndHm: "13:00",
      raw: {
        type: "group-event",
        repeatRule: "doesNotRepeat",
        sessionDurationMinutes: 30,
      },
    }], {
      bookedSlotsIndex: makeIndex("confirmed"),
      focusDate: new Date(`${localDateIso}T00:00:00`),
      rangeDaysBefore: 0,
      rangeDaysAfter: 0,
      mode: "scheduleWindow",
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual(expect.objectContaining({
      eventId,
      isAvailabilityBlock: true,
      slot: "availability",
      start: new Date(`${localDateIso}T10:00:00`).toISOString(),
      end: new Date(`${localDateIso}T13:00:00`).toISOString(),
    }));
  });

  it("keeps unlimited group availability open in freeSlots mode after a confirmed booking", () => {
    const blocks = mapAvailabilityToCalendarEvents([{
      eventId,
      type: "group-event",
      status: "active",
      localDateIso,
      localStartHm: "10:00",
      localEndHm: "10:30",
      raw: {
        type: "group-event",
        repeatRule: "doesNotRepeat",
        sessionDurationMinutes: 30,
      },
    }], {
      bookedSlotsIndex: makeIndex("confirmed"),
      focusDate: new Date(`${localDateIso}T00:00:00`),
      rangeDaysBefore: 0,
      rangeDaysAfter: 0,
      mode: "freeSlots",
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual(expect.objectContaining({
      eventId,
      isAvailabilityBlock: true,
      start: new Date(`${localDateIso}T10:00:00`).toISOString(),
      end: new Date(`${localDateIso}T10:30:00`).toISOString(),
    }));
  });

  it("closes a group availability block in freeSlots mode when max attendee capacity is reached", () => {
    const blocks = mapAvailabilityToCalendarEvents([{
      eventId,
      type: "group-event",
      status: "active",
      localDateIso,
      localStartHm: "10:00",
      localEndHm: "10:30",
      raw: {
        type: "group-event",
        repeatRule: "doesNotRepeat",
        sessionDurationMinutes: 30,
        enableMaxAttendees: true,
        maxAttendees: 1,
      },
    }], {
      bookedSlotsIndex: makeIndex("confirmed"),
      focusDate: new Date(`${localDateIso}T00:00:00`),
      rangeDaysBefore: 0,
      rangeDaysAfter: 0,
      mode: "freeSlots",
    });

    expect(blocks).toHaveLength(0);
  });

  it("keeps a group availability block open in freeSlots mode when capacity remains", () => {
    const blocks = mapAvailabilityToCalendarEvents([{
      eventId,
      type: "group-event",
      status: "active",
      localDateIso,
      localStartHm: "10:00",
      localEndHm: "10:30",
      raw: {
        type: "group-event",
        repeatRule: "doesNotRepeat",
        sessionDurationMinutes: 30,
        enableMaxAttendees: true,
        maxAttendees: 2,
      },
    }], {
      bookedSlotsIndex: makeIndex("confirmed"),
      focusDate: new Date(`${localDateIso}T00:00:00`),
      rangeDaysBefore: 0,
      rangeDaysAfter: 0,
      mode: "freeSlots",
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual(expect.objectContaining({
      eventId,
      isAvailabilityBlock: true,
    }));
  });

  it("closes a private availability block in freeSlots mode after an overlapping confirmed booking", () => {
    const blocks = mapAvailabilityToCalendarEvents([{
      eventId,
      type: "1on1-call",
      status: "active",
      localDateIso,
      localStartHm: "10:00",
      localEndHm: "10:30",
      raw: {
        type: "1on1-call",
        repeatRule: "doesNotRepeat",
        sessionDurationMinutes: 30,
      },
    }], {
      bookedSlotsIndex: makeIndex("confirmed"),
      focusDate: new Date(`${localDateIso}T00:00:00`),
      rangeDaysBefore: 0,
      rangeDaysAfter: 0,
      mode: "freeSlots",
    });

    expect(blocks).toHaveLength(0);
  });

  it("keeps a private availability window whole behind booked sessions in scheduleWindow mode", () => {
    const blocks = mapAvailabilityToCalendarEvents([makeBufferedEvent()], {
      bookedSlotsIndex: makeIndex("confirmed"),
      focusDate: new Date(`${localDateIso}T00:00:00`),
      rangeDaysBefore: 0,
      rangeDaysAfter: 0,
      mode: "scheduleWindow",
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual(expect.objectContaining({
      eventId,
      isAvailabilityBlock: true,
      slot: "availability",
      start: new Date(`${localDateIso}T10:00:00`).toISOString(),
      end: new Date(`${localDateIso}T11:30:00`).toISOString(),
    }));
  });

  it("does not trim a private schedule window to the last session chunk in scheduleWindow mode", () => {
    const blocks = mapAvailabilityToCalendarEvents([{
      eventId,
      localDateIso,
      localStartHm: "00:00",
      localEndHm: "21:45",
      status: "active",
      raw: {
        repeatRule: "doesNotRepeat",
        sessionDurationMinutes: 30,
      },
    }], {
      bookedSlotsIndex: {},
      focusDate: new Date(`${localDateIso}T00:00:00`),
      rangeDaysBefore: 0,
      rangeDaysAfter: 0,
      mode: "scheduleWindow",
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual(expect.objectContaining({
      start: new Date(`${localDateIso}T00:00:00`).toISOString(),
      end: new Date(`${localDateIso}T21:45:00`).toISOString(),
    }));
  });

  it("respects recurring event dateFrom and dateTo when building monthly candidate slots", () => {
    const event = {
      eventId,
      localDateIso: "2026-05-06",
      raw: {
        repeatRule: "monthly",
        dateFrom: "2026-05-06",
        dateTo: "2026-05-21",
        sessionDurationMinutes: 5,
        slots: [{ startTime: "04:45", endTime: "16:25" }],
      },
    };

    expect(buildCandidateSlotsForEventDate(event, "2026-05-06", { eventId })).not.toHaveLength(0);
    expect(buildCandidateSlotsForEventDate(event, "2026-06-06", { eventId })).toEqual([]);
    expect(buildCandidateSlotsForEventDate(event, "2026-04-06", { eventId })).toEqual([]);
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

  it("keeps ongoing group slots bookable until the slot end time passes", () => {
    setFixedNow();
    const event = {
      eventId,
      type: "group-event",
      enableMaxAttendees: true,
      maxAttendees: 5,
      createdAt: "2030-01-15T04:30:00.000Z",
      raw: { type: "group-event", enableMaxAttendees: true, maxAttendees: 5 },
    };
    const ongoingSlot = makeSlot("11:00", "13:00");
    const endedSlot = makeSlot("10:00", "12:00");

    expect(createSlotUiModel({ event, eventId, localDateIso, slot: ongoingSlot, bookedSlotsIndex: {} }).disabled).toBe(false);
    expect(createSlotUiModel({ event, eventId, localDateIso, slot: endedSlot, bookedSlotsIndex: {} }).disabled).toBe(true);
  });

  it("disables group slots that started before the event was created", () => {
    setFixedNow();
    const slot = makeSlot("11:00", "13:00");
    const eligibleEvent = {
      eventId,
      type: "group-event",
      createdAt: "2030-01-15T04:30:00.000Z",
      raw: { type: "group-event" },
    };
    const justCreatedEvent = {
      eventId,
      type: "group-event",
      raw: { type: "group-event", createdAt: "2030-01-15T05:30:00.000Z" },
    };

    expect(createSlotUiModel({ event: eligibleEvent, eventId, localDateIso, slot, bookedSlotsIndex: {} }).disabled).toBe(false);
    expect(createSlotUiModel({ event: justCreatedEvent, eventId, localDateIso, slot, bookedSlotsIndex: {} }).disabled).toBe(true);
  });

  it("keeps private slots disabled once their start time has passed", () => {
    setFixedNow();
    const event = {
      eventId,
      type: "one-on-one",
      raw: { type: "one-on-one" },
    };
    const ongoingPrivateSlot = makeSlot("11:00", "13:00");

    expect(createSlotUiModel({ event, eventId, localDateIso, slot: ongoingPrivateSlot, bookedSlotsIndex: {} }).disabled).toBe(true);
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

  it("sums event goal contributions only for blocking bookings on the selected group slot", () => {
    const slot = makeSlot("10:00", "13:00");
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "booking_selected_confirmed",
        eventId,
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "confirmed",
        contributionTokens: 1000,
      },
      {
        bookingId: "booking_selected_pending_payment",
        eventId,
        startIso: `${localDateIso}T11:00:00`,
        endIso: `${localDateIso}T12:00:00`,
        status: "pending",
        paymentTotal: 200,
      },
      {
        bookingId: "booking_selected_cancelled",
        eventId,
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "cancelled",
        contributionTokens: 5000,
      },
      {
        bookingId: "booking_same_day_other_slot",
        eventId,
        startIso: `${localDateIso}T14:00:00`,
        endIso: `${localDateIso}T17:00:00`,
        status: "confirmed",
        contributionTokens: 3000,
      },
      {
        bookingId: "booking_other_occurrence",
        eventId,
        startIso: "2030-01-16T10:00:00",
        endIso: "2030-01-16T13:00:00",
        status: "confirmed",
        contributionTokens: 4000,
      },
    ]);

    expect(sumEventGoalContributionsForSlot({ eventId, slot, bookedSlotsIndex })).toBe(1200);
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
      dateFrom: first,
      raw: {
        type: "group-event",
        repeatRule: "daily",
        dateFrom: first,
        sessionDurationMinutes: 180,
        enableMaxAttendees: true,
        maxAttendees: 2,
        slots: [{ day: "monday", startTime: "10:00", endTime: "13:00" }],
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

  it("selects an ongoing group slot before the next upcoming slot", () => {
    setFixedNow();
    const event = {
      eventId,
      type: "group-event",
      createdAt: "2030-01-15T04:30:00.000Z",
      raw: {
        type: "group-event",
        repeatRule: "daily",
        sessionDurationMinutes: 120,
        enableMaxAttendees: true,
        maxAttendees: 5,
        slots: [{ day: "monday", startTime: "13:00", endTime: "15:00" }],
      },
    };

    const next = computeNextAvailableSlot(event, {}, 2, { skipBookedByUserId: 2615 });

    expect(next?.dateIso).toBe(localDateIso);
    expect(next?.slot?.startHm).toBe("11:00");
    expect(next?.slot?.endHm).toBe("13:00");
  });

  it("skips an ongoing group slot when it started before the event was created", () => {
    setFixedNow();
    const tomorrowDate = new Date(`${localDateIso}T00:00:00`);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = dateIsoFromDate(tomorrowDate);
    const event = {
      eventId,
      type: "group-event",
      createdAt: "2030-01-15T05:30:00.000Z",
      raw: {
        type: "group-event",
        repeatRule: "daily",
        sessionDurationMinutes: 120,
        enableMaxAttendees: true,
        maxAttendees: 5,
        slots: [{ day: "monday", startTime: "13:00", endTime: "15:00" }],
      },
    };

    const next = computeNextAvailableSlot(event, {}, 2, { skipBookedByUserId: 2615 });

    expect(next?.dateIso).toBe(tomorrow);
    expect(next?.slot?.startHm).toBe("11:00");
    expect(next?.slot?.endHm).toBe("13:00");
  });

  it("skips an ongoing group slot already booked by the current user", () => {
    setFixedNow();
    const tomorrowDate = new Date(`${localDateIso}T00:00:00`);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = dateIsoFromDate(tomorrowDate);
    const event = {
      eventId,
      type: "group-event",
      raw: {
        type: "group-event",
        repeatRule: "daily",
        sessionDurationMinutes: 120,
        enableMaxAttendees: true,
        maxAttendees: 5,
        slots: [{ day: "monday", startTime: "13:00", endTime: "15:00" }],
      },
    };
    const bookedSlotsIndex = buildBookedSlotsIndex([
      {
        bookingId: "booking_current_user_ongoing",
        eventId,
        userId: 2615,
        startIso: `${localDateIso}T11:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "confirmed",
      },
    ]);

    const next = computeNextAvailableSlot(event, bookedSlotsIndex, 2, { skipBookedByUserId: 2615 });

    expect(next?.dateIso).toBe(tomorrow);
  });

  it("maps confirmed group bookings as group calendar items", () => {
    const [event] = mapBookedSlotsToCalendarEvents([
      {
        bookingId: "booking_group",
        eventId,
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "confirmed",
        eventTitle: "Group Hang",
        eventSnapshot: { eventType: "group-event" },
      },
    ], { includeStatuses: ["confirmed"] });

    expect(event).toMatchObject({
      bookingId: "booking_group",
      eventId,
      title: "Group Hang",
      type: "group-event",
      eventType: "group-event",
      status: "confirmed",
    });
    expect(event.raw.participantCount).toBe(1);
    expect(event.raw.isGroupedGroupSlot).toBe(true);
  });

  it("aggregates multiple bookings for the same group slot into one session item", () => {
    const events = mapBookedSlotsToCalendarEvents([
      {
        bookingId: "booking_group_1",
        eventId,
        userId: 2615,
        userDisplayName: "Ava",
        userAvatarUrl: "https://example.test/ava.png",
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "confirmed",
        eventTitle: "Group Hang",
        eventType: "group-event",
      },
      {
        bookingId: "booking_group_2",
        eventId,
        userId: 2616,
        userDisplayName: "Ben",
        startIso: `${localDateIso}T10:00:00`,
        endIso: `${localDateIso}T13:00:00`,
        status: "confirmed",
        eventTitle: "Group Hang",
        eventType: "group-event",
      },
    ], { includeStatuses: ["confirmed"] });

    expect(events).toHaveLength(1);
    expect(events[0].bookingId).toBe("booking_group_1");
    expect(events[0].raw.bookingIds).toEqual(["booking_group_1", "booking_group_2"]);
    expect(events[0].raw.participantCount).toBe(2);
    expect(events[0].raw.participants).toEqual([
      expect.objectContaining({ bookingId: "booking_group_1", userId: 2615, name: "Ava", avatarUrl: "https://example.test/ava.png" }),
      expect.objectContaining({ bookingId: "booking_group_2", userId: 2616, name: "Ben" }),
    ]);
  });
});
