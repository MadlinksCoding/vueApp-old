import { describe, expect, it, vi } from "vitest";
import { fetchDashboardBookingContextFlow } from "@/services/bookings/flows/fetchDashboardBookingContextFlow.js";
import { fetchCreatorBookingContextFlow } from "@/services/bookings/flows/fetchCreatorBookingContextFlow.js";

const freshBookedSlot = {
  bookingId: "booking_123",
  eventId: "event_77",
  startIso: "2026-04-23T10:00:00Z",
  endIso: "2026-04-23T11:00:00Z",
  status: "confirmed",
};

function createApi(responses) {
  return {
    get: vi.fn(async () => responses.shift()),
  };
}

describe("booking context flows", () => {
  it("keeps fresh creator dashboard booked slots when events are not modified", async () => {
    const cachedRawEvents = [{ id: "event_77", title: "Cached Event" }];
    const api = createApi([
      {
        notModified: true,
        etag: "events-etag",
        __meta: { status: 304 },
      },
      {
        slots: [freshBookedSlot],
        stats: { total: 1 },
        __meta: { status: 200 },
      },
    ]);

    const result = await fetchDashboardBookingContextFlow({
      payload: { creatorId: 1407, userRole: "creator" },
      context: {
        apiBaseUrl: "https://api.example.test",
        stateEngine: {
          getState: vi.fn(() => cachedRawEvents),
        },
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(result.meta.status).toBe(200);
    expect(result.meta.eventsNotModified).toBe(true);
    expect(result.data.rawEvents).toEqual(cachedRawEvents);
    expect(result.data.bookedSlots).toEqual([freshBookedSlot]);
  });

  it("keeps fresh fan dashboard booked slots when fetched events are not modified", async () => {
    const cachedRawEvents = [{ id: "event_77", title: "Cached Fan Event" }];
    const api = createApi([
      {
        slots: [freshBookedSlot],
        stats: { total: 1 },
        __meta: { status: 200 },
      },
      {
        notModified: true,
        etag: "events-etag",
        __meta: { status: 304 },
      },
    ]);

    const result = await fetchDashboardBookingContextFlow({
      payload: { fanId: 2615, userRole: "fan" },
      context: {
        apiBaseUrl: "https://api.example.test",
        stateEngine: {
          getState: vi.fn(() => cachedRawEvents),
        },
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(result.meta.status).toBe(200);
    expect(result.meta.eventsNotModified).toBe(true);
    expect(result.data.rawEvents).toEqual(cachedRawEvents);
    expect(result.data.bookedSlots).toEqual([freshBookedSlot]);
  });

  it("keeps fresh creator booking slots when creator events are not modified", async () => {
    const cachedRawEvents = [{ id: "event_77", title: "Cached Creator Event" }];
    const api = createApi([
      {
        notModified: true,
        etag: "events-etag",
        __meta: { status: 304 },
      },
      {
        slots: [freshBookedSlot],
        stats: { total: 1 },
        __meta: { status: 200 },
      },
    ]);

    const result = await fetchCreatorBookingContextFlow({
      payload: { creatorId: 1407 },
      context: {
        apiBaseUrl: "https://api.example.test",
        stateEngine: {
          getState: vi.fn(() => cachedRawEvents),
        },
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(result.meta.status).toBe(200);
    expect(result.meta.eventsNotModified).toBe(true);
    expect(result.data.rawEvents).toEqual(cachedRawEvents);
    expect(result.data.bookedSlots).toEqual([freshBookedSlot]);
  });
});
