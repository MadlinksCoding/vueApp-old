import { describe, expect, it, vi } from "vitest";
import {
  buildScheduledGroupMeetingUrl,
  getBookingJoinState,
  openScheduledMeetingOverlay,
} from "@/utils/bookingJoinUtils.js";

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
  it("does not allow confirmed bookings before the fixed five minute join window", () => {
    expect(joinState({ now: "2026-05-01T09:54:59Z" }).canJoin).toBe(false);
  });

  it("allows confirmed bookings inside the fixed five minute join window", () => {
    const state = joinState({ now: "2026-05-01T09:55:00Z" });

    expect(state.canJoin).toBe(true);
    expect(state.reminderMinutes).toBe(15);
    expect(state.joinAvailableAtIso).toBe("2026-05-01T09:55:00.000Z");
    expect(state.joinUrl).toBe(`${BASE_URL}/scheduled-meeting/?booking_id=booking_123`);
  });

  it("does not open the join window early when reminders are configured earlier", () => {
    expect(joinState({ now: "2026-05-01T09:45:00Z" }).canJoin).toBe(false);
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

  it("builds creator scheduled group meeting URLs from event and slot start", () => {
    expect(buildScheduledGroupMeetingUrl({
      eventId: "evt_group",
      startIso: START_AT,
    }, BASE_URL)).toBe(`${BASE_URL}/scheduled-meeting/?event_id=evt_group&start_iso=2026-05-01T10%3A00%3A00Z`);
  });
});

describe("openScheduledMeetingOverlay", () => {
  function createBrowserWindow(overrides = {}) {
    const browserWindow = {
      location: {
        href: `${BASE_URL}/dashboard/chat`,
        origin: BASE_URL,
      },
      ...overrides,
    };
    browserWindow.top ??= browserWindow;
    return browserWindow;
  }

  it("opens a scheduled booking through the overlay in the current window", () => {
    const open = vi.fn();
    const browserWindow = createBrowserWindow({
      FSScheduledCallOverlay: { open },
    });

    expect(openScheduledMeetingOverlay(
      "/scheduled-meeting/?booking_id=booking_chat",
      { source: "chat_live_call_request", browserWindow },
    )).toBe(true);
    expect(open).toHaveBeenCalledWith(
      `${BASE_URL}/scheduled-meeting/?booking_id=booking_chat`,
      { source: "chat_live_call_request" },
    );
  });

  it("uses the same-origin top-window overlay for embedded chat", () => {
    const open = vi.fn();
    const hostWindow = createBrowserWindow({
      FSScheduledCallOverlay: { open },
    });
    const childWindow = createBrowserWindow({ top: hostWindow });

    expect(openScheduledMeetingOverlay(
      `${BASE_URL}/scheduled-meeting/?event_id=evt_chat&start_iso=${encodeURIComponent(START_AT)}`,
      { source: "chat_booking_detail", browserWindow: childWindow },
    )).toBe(true);
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining("/scheduled-meeting/?event_id=evt_chat"),
      { source: "chat_booking_detail" },
    );
  });

  it("returns false so callers retain top-level navigation when no overlay is available", () => {
    const browserWindow = createBrowserWindow();

    expect(openScheduledMeetingOverlay(
      "/scheduled-meeting/?booking_id=booking_fallback",
      { browserWindow },
    )).toBe(false);
  });

  it("does not send foreign or malformed URLs to the overlay", () => {
    const open = vi.fn();
    const browserWindow = createBrowserWindow({
      FSScheduledCallOverlay: { open },
    });

    expect(openScheduledMeetingOverlay(
      "https://external.example/scheduled-meeting/?booking_id=booking_external",
      { browserWindow },
    )).toBe(false);
    expect(openScheduledMeetingOverlay(
      "/scheduled-meeting/?event_id=evt_missing_start",
      { browserWindow },
    )).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });
});
