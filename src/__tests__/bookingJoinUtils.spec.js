import { describe, expect, it } from "vitest";
import { getBookingJoinState } from "@/utils/bookingJoinUtils.js";

const BASE_URL = "https://example.com";
const START_AT = "2026-05-01T10:00:00Z";
const END_AT = "2026-05-01T10:30:00Z";

function joinState(overrides = {}) {
  return getBookingJoinState({
    bookingId: "booking_123",
    startAt: START_AT,
    endAt: END_AT,
    status: "confirmed",
    enableCallReminderMinutesBefore: true,
    callReminderMinutesBefore: 15,
    baseUrl: BASE_URL,
    now: "2026-05-01T09:45:00Z",
    ...overrides,
  });
}

describe("getBookingJoinState", () => {
  it("does not allow confirmed bookings before a custom reminder window", () => {
    expect(joinState({ now: "2026-05-01T09:44:59Z" }).canJoin).toBe(false);
  });

  it("allows confirmed bookings inside a custom 15 minute reminder window", () => {
    const state = joinState({ now: "2026-05-01T09:45:00Z" });

    expect(state.canJoin).toBe(true);
    expect(state.reminderMinutes).toBe(15);
    expect(state.joinUrl).toBe(`${BASE_URL}/scheduled-meeting/?booking_id=booking_123`);
  });

  it("allows confirmed bookings during the meeting", () => {
    expect(joinState({ now: "2026-05-01T10:15:00Z" }).canJoin).toBe(true);
  });

  it("falls back to a 5 minute window when reminders are disabled or invalid", () => {
    expect(joinState({
      enableCallReminderMinutesBefore: false,
      callReminderMinutesBefore: 15,
      now: "2026-05-01T09:54:59Z",
    }).canJoin).toBe(false);
    expect(joinState({
      enableCallReminderMinutesBefore: false,
      callReminderMinutesBefore: 15,
      now: "2026-05-01T09:55:00Z",
    }).canJoin).toBe(true);
    expect(joinState({
      enableCallReminderMinutesBefore: true,
      callReminderMinutesBefore: 0,
      now: "2026-05-01T09:55:00Z",
    }).reminderMinutes).toBe(5);
  });

  it("uses held and captured extension end times as the effective end", () => {
    expect(joinState({
      now: "2026-05-01T10:40:00Z",
      extensions: [
        { status: "held", endAtIso: "2026-05-01T10:45:00Z" },
      ],
    }).canJoin).toBe(true);

    expect(joinState({
      now: "2026-05-01T10:50:00Z",
      extensions: [
        { status: "captured", endAtIso: "2026-05-01T10:45:00Z" },
      ],
    }).canJoin).toBe(false);
  });

  it("ignores non-held extension end times", () => {
    expect(joinState({
      now: "2026-05-01T10:40:00Z",
      extensions: [
        { status: "cancelled", endAtIso: "2026-05-01T10:45:00Z" },
        { status: "held", endAtIso: "not-a-date" },
      ],
    }).canJoin).toBe(false);
  });

  it("does not allow joining at or after the booking end time", () => {
    expect(joinState({ now: END_AT }).canJoin).toBe(false);
    expect(joinState({ now: "2026-05-01T10:31:00Z" }).canJoin).toBe(false);
  });

  it("requires the booking status to be exactly confirmed", () => {
    expect(joinState({ status: "pending" }).canJoin).toBe(false);
    expect(joinState({ status: "completed" }).canJoin).toBe(false);
    expect(joinState({ status: "cancelled_user" }).canJoin).toBe(false);
    expect(joinState({ status: "confirmed_pending" }).canJoin).toBe(false);
  });

  it("requires a booking id and valid dates", () => {
    expect(joinState({ bookingId: "" }).canJoin).toBe(false);
    expect(joinState({ startAt: "not-a-date" }).canJoin).toBe(false);
    expect(joinState({ endAt: "not-a-date" }).canJoin).toBe(false);
  });
});
