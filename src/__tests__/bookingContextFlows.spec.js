import { describe, expect, it, vi } from "vitest";
import { fetchDashboardBookingContextFlow } from "@/services/bookings/flows/fetchDashboardBookingContextFlow.js";
import { fetchCreatorBookingContextFlow } from "@/services/bookings/flows/fetchCreatorBookingContextFlow.js";
import { fetchAllBookedSlotPages } from "@/services/bookings/utils/fetchAllBookedSlotPages.js";
import {
  resolveUpcomingWidgetBookedSlotRange,
  resolveVisibleBookedSlotRange,
} from "@/services/bookings/utils/calendarBookedSlotRange.js";

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
  it("builds exact visible calendar ranges with an overnight lookback day", () => {
    const focusDate = new Date(2026, 6, 27, 12);

    expect(resolveVisibleBookedSlotRange({ focusDate, view: "day" })).toMatchObject({
      fromIso: "2026-07-26",
      toIso: "2026-07-27",
      visibleFromIso: "2026-07-27",
      visibleToIso: "2026-07-27",
    });
    expect(resolveVisibleBookedSlotRange({ focusDate, view: "week" })).toMatchObject({
      fromIso: "2026-07-25",
      toIso: "2026-08-01",
      visibleFromIso: "2026-07-26",
      visibleToIso: "2026-08-01",
    });
    expect(resolveVisibleBookedSlotRange({ focusDate, view: "month" })).toMatchObject({
      fromIso: "2026-06-27",
      toIso: "2026-08-08",
      visibleFromIso: "2026-06-28",
      visibleToIso: "2026-08-08",
    });
    expect(resolveUpcomingWidgetBookedSlotRange({ now: focusDate })).toMatchObject({
      fromIso: "2026-07-27",
      toIso: "2027-01-27",
    });
  });

  it("follows every booked-slot cursor and deduplicates bookings", async () => {
    const laterSlot = {
      ...freshBookedSlot,
      bookingId: "booking_later",
      startIso: "2026-07-27T16:45:00Z",
      endIso: "2026-07-27T16:50:00Z",
      status: "pending",
    };
    const api = createApi([
      {
        slots: [freshBookedSlot],
        next: "cursor-page-2",
        hasMore: true,
        truncated: true,
        __meta: { status: 200 },
      },
      {
        slots: [freshBookedSlot, laterSlot],
        next: null,
        hasMore: false,
        truncated: false,
        __meta: { status: 200 },
      },
    ]);

    const result = await fetchAllBookedSlotPages({
      api,
      url: "https://api.example.test/bookings/creators/1407/booked-slots",
      params: {
        fromIso: "2026-07-01",
        toIso: "2026-08-01",
      },
    });

    expect(result.ok).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.response.slots).toEqual([freshBookedSlot, laterSlot]);
    expect(result.response.stats).toEqual({
      total: 2,
      byStatus: { confirmed: 1, pending: 1 },
      byEvent: { event_77: 2 },
    });
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/bookings/creators/1407/booked-slots",
      expect.objectContaining({
        params: expect.objectContaining({ next: "cursor-page-2" }),
      }),
    );
  });

  it("returns a failed pagination result without exposing partial slots", async () => {
    const api = createApi([
      {
        slots: [freshBookedSlot],
        next: "cursor-page-2",
      },
      {
        ok: false,
        error: "temporary_failure",
      },
    ]);

    const result = await fetchAllBookedSlotPages({
      api,
      url: "https://api.example.test/bookings/creators/1407/booked-slots",
    });

    expect(result.ok).toBe(false);
    expect(result.response).toEqual(expect.objectContaining({ error: "temporary_failure" }));
    expect(result.response.slots).toBeUndefined();
  });

  it("rejects a repeated booked-slot cursor", async () => {
    const api = createApi([
      { slots: [], next: "repeated-cursor" },
      { slots: [], next: "repeated-cursor" },
    ]);

    await expect(fetchAllBookedSlotPages({
      api,
      url: "https://api.example.test/bookings/creators/1407/booked-slots",
    })).rejects.toMatchObject({ code: "BOOKED_SLOTS_CURSOR_LOOP" });
  });

  it("loads creator widget statuses through every cursor without losing a later pending booking", async () => {
    const july27Pending = {
      ...freshBookedSlot,
      bookingId: "booking_july_27",
      startIso: "2026-07-27T16:45:00Z",
      endIso: "2026-07-27T16:50:00Z",
      status: "pending",
    };
    const api = {
      get: vi.fn(async (url, options = {}) => {
        if (url.endsWith("/events")) {
          return { items: [{ id: "event_77", title: "Event" }], __meta: { status: 200 } };
        }
        if (!options.params?.statusIn) {
          return { slots: [freshBookedSlot], next: null, __meta: { status: 200 } };
        }
        if (options.params.statusIn === "pending" && !options.params.next) {
          return { slots: [], next: "pending-page-2", __meta: { status: 200 } };
        }
        if (options.params.statusIn === "pending" && options.params.next === "pending-page-2") {
          return { slots: [july27Pending], next: null, __meta: { status: 200 } };
        }
        return { slots: [], next: null, __meta: { status: 200 } };
      }),
    };

    const result = await fetchDashboardBookingContextFlow({
      payload: {
        creatorId: 1407,
        userRole: "creator",
        fromIso: "2026-07-25",
        toIso: "2026-08-01",
        widgetFromIso: "2026-07-27",
        widgetToIso: "2027-01-27",
        widgetStatusIn: "pending,pending_hold,confirmed",
      },
      context: { apiBaseUrl: "https://api.example.test" },
      api,
    });

    expect(result.ok).toBe(true);
    expect(result.data.widgetBookedSlots).toEqual([july27Pending]);
    expect(api.get).toHaveBeenCalledWith(
      "https://api.example.test/bookings/creators/1407/booked-slots",
      expect.objectContaining({
        params: expect.objectContaining({
          statusIn: "pending",
          next: "pending-page-2",
        }),
      }),
    );
  });

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

  it("sends eventId to creator dashboard booked slots when provided", async () => {
    const api = createApi([
      {
        items: [{ id: "event_77", title: "Event" }],
        __meta: { status: 200 },
      },
      {
        slots: [freshBookedSlot],
        stats: { total: 1 },
        __meta: { status: 200 },
      },
    ]);

    const result = await fetchDashboardBookingContextFlow({
      payload: { creatorId: 1407, userRole: "creator", eventId: "  event_77  " },
      context: {
        apiBaseUrl: "https://api.example.test",
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/bookings/creators/1407/booked-slots",
      expect.objectContaining({
        params: expect.objectContaining({ eventId: "event_77" }),
      }),
    );
  });

  it("treats agent dashboard role as creator when fetching booked slots", async () => {
    const api = createApi([
      {
        items: [{ id: "event_77", title: "Event" }],
        __meta: { status: 200 },
      },
      {
        slots: [freshBookedSlot],
        stats: { total: 1 },
        __meta: { status: 200 },
      },
    ]);

    const result = await fetchDashboardBookingContextFlow({
      payload: { creatorId: 793, userRole: "agent" },
      context: {
        apiBaseUrl: "https://api.example.test",
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(result.meta.mode).toBe("creator");
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/bookings/creators/793/booked-slots",
      expect.any(Object),
    );
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

  it("does not send eventId to fan dashboard booked slots", async () => {
    const api = createApi([
      {
        slots: [freshBookedSlot],
        stats: { total: 1 },
        __meta: { status: 200 },
      },
      {
        items: [{ id: "event_77", title: "Event" }],
        __meta: { status: 200 },
      },
    ]);

    const result = await fetchDashboardBookingContextFlow({
      payload: { fanId: 2615, userRole: "fan", eventId: "event_77" },
      context: {
        apiBaseUrl: "https://api.example.test",
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(api.get).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/bookings/fans/2615/booked-slots",
      expect.objectContaining({
        params: expect.not.objectContaining({ eventId: expect.anything() }),
      }),
    );
  });

  it("treats audience dashboard role as fan when fetching booked slots", async () => {
    const api = createApi([
      {
        slots: [freshBookedSlot],
        stats: { total: 1 },
        __meta: { status: 200 },
      },
      {
        items: [{ id: "event_77", title: "Event" }],
        __meta: { status: 200 },
      },
    ]);

    const result = await fetchDashboardBookingContextFlow({
      payload: { fanId: 2615, userRole: "audience" },
      context: {
        apiBaseUrl: "https://api.example.test",
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(result.meta.mode).toBe("fan");
    expect(api.get).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/bookings/fans/2615/booked-slots",
      expect.any(Object),
    );
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

  it("sends eventId to creator booking context booked slots when provided", async () => {
    const api = createApi([
      {
        items: [{ id: "event_77", title: "Event" }],
        __meta: { status: 200 },
      },
      {
        slots: [freshBookedSlot],
        stats: { total: 1 },
        __meta: { status: 200 },
      },
	  { ok: true, holds: [] },
    ]);

    const result = await fetchCreatorBookingContextFlow({
      payload: { creatorId: 1407, eventId: "  event_77  " },
      context: {
        apiBaseUrl: "https://api.example.test",
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/bookings/creators/1407/booked-slots",
      expect.objectContaining({
        params: expect.objectContaining({ eventId: "event_77" }),
      }),
    );
  });

  it("replaces cached slots for an event-scoped refresh while preserving other events", async () => {
    const staleTargetSlot = {
      ...freshBookedSlot,
      bookingId: "booking_stale",
      eventId: "event_77",
    };
    const otherEventSlot = {
      ...freshBookedSlot,
      bookingId: "booking_other",
      eventId: "event_other",
    };
    const refreshedTargetSlot = {
      ...freshBookedSlot,
      bookingId: "booking_fresh",
      eventId: "event_77",
      status: "pending",
    };
    const api = createApi([
      {
        items: [{ id: "event_77", title: "Event" }],
        __meta: { status: 200 },
      },
      {
        slots: [refreshedTargetSlot],
        stats: { total: 1 },
        __meta: { status: 200 },
      },
	  { ok: true, holds: [] },
    ]);

    const result = await fetchCreatorBookingContextFlow({
      payload: { creatorId: 1407, eventId: "event_77" },
      context: {
        apiBaseUrl: "https://api.example.test",
        stateEngine: {
          getState: vi.fn((path) => (
            path === "fanBooking.catalog.bookedSlots"
              ? [staleTargetSlot, otherEventSlot]
              : []
          )),
        },
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(result.data.bookedSlots).toEqual([otherEventSlot, refreshedTargetSlot]);
  });

  it("removes stale event slots when an event-scoped refresh returns no bookings", async () => {
    const staleTargetSlot = {
      ...freshBookedSlot,
      bookingId: "booking_stale",
      eventId: "event_77",
    };
    const otherEventSlot = {
      ...freshBookedSlot,
      bookingId: "booking_other",
      eventId: "event_other",
    };
    const api = createApi([
      {
        items: [{ id: "event_77", title: "Event" }],
        __meta: { status: 200 },
      },
      {
        slots: [],
        stats: { total: 0 },
        __meta: { status: 200 },
      },
	  { ok: true, holds: [] },
    ]);

    const result = await fetchCreatorBookingContextFlow({
      payload: { creatorId: 1407, eventId: "event_77" },
      context: {
        apiBaseUrl: "https://api.example.test",
        stateEngine: {
          getState: vi.fn((path) => (
            path === "fanBooking.catalog.bookedSlots"
              ? [staleTargetSlot, otherEventSlot]
              : []
          )),
        },
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(result.data.bookedSlots).toEqual([otherEventSlot]);
  });

  it("keeps creator booking context occupancy creator-wide even for fan payloads", async () => {
    const api = createApi([
      {
        items: [{ id: "event_77", title: "Event" }],
        __meta: { status: 200 },
      },
      {
        slots: [freshBookedSlot],
        stats: { total: 1 },
        __meta: { status: 200 },
      },
	  { ok: true, holds: [] },
      {
        ok: true,
        isFirstBookingForCreator: false,
        __meta: { status: 200 },
      },
      {
        ok: true,
        countsByEventId: { event_77: 2 },
        __meta: { status: 200 },
      },
    ]);

    const result = await fetchCreatorBookingContextFlow({
      payload: { creatorId: 1407, fanId: 2615, userRole: "fan", eventId: "event_77" },
      context: {
        apiBaseUrl: "https://api.example.test",
      },
      api,
    });

    expect(result.ok).toBe(true);
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/bookings/creators/1407/booked-slots",
      expect.objectContaining({
        params: expect.objectContaining({ eventId: "event_77" }),
      }),
    );
		expect(api.get).toHaveBeenNthCalledWith(
			5,
      "https://api.example.test/bookings/fans/2615/event-booking-counts",
      expect.objectContaining({
        params: expect.objectContaining({
          eventIds: "event_77",
          statuses: "confirmed,completed",
        }),
      }),
    );
		expect(result.data.eventBookingCountsByEventId).toEqual({ event_77: 2 });
	});

	it("loads anonymous temporary holds separately from confirmed bookings", async () => {
		const expiresAt = new Date(Date.now() + 300000).toISOString();
		const api = createApi([
			{ items: [{ id: "event_77", title: "Event" }], __meta: { status: 200 } },
			{ slots: [freshBookedSlot], next: null, __meta: { status: 200 } },
			{
				ok: true,
				holds: [{
					eventId: "event_77",
					startIso: "2030-01-15T10:30:00Z",
					endIso: "2030-01-15T10:40:00Z",
					expiresAt,
					capacityUnits: 1,
				}],
			},
		]);

		const result = await fetchCreatorBookingContextFlow({
			payload: { creatorId: 1407, eventId: "event_77" },
			context: { apiBaseUrl: "https://api.example.test", requestHeaders: { Authorization: "Bearer token" } },
			api,
		});

		expect(result.ok).toBe(true);
		expect(result.data.bookedSlots).toEqual([freshBookedSlot]);
		expect(result.data.temporaryHoldSlots).toEqual([
			expect.objectContaining({ eventId: "event_77", status: "temporary_hold", expiresAt }),
		]);
		expect(result.data.temporaryHoldAvailabilityStale).toBe(false);
		expect(api.get).toHaveBeenCalledWith(
			"https://api.example.test/temporary-holds/availability",
			expect.objectContaining({
				params: { eventId: "event_77" },
				headers: { Authorization: "Bearer token" },
			}),
		);
	});

	it("retains only unexpired cached temporary holds when availability refresh fails", async () => {
		const unexpired = {
			eventId: "event_77",
			startIso: "2030-01-15T10:30:00Z",
			endIso: "2030-01-15T10:40:00Z",
			expiresAt: new Date(Date.now() + 300000).toISOString(),
			status: "temporary_hold",
		};
		const expired = { ...unexpired, startIso: "2030-01-15T11:00:00Z", expiresAt: new Date(Date.now() - 1000).toISOString() };
		const api = createApi([
			{ items: [{ id: "event_77", title: "Event" }], __meta: { status: 200 } },
			{ slots: [], next: null, __meta: { status: 200 } },
			{ ok: false, error: "temporary_failure" },
		]);

		const result = await fetchCreatorBookingContextFlow({
			payload: { creatorId: 1407, eventId: "event_77" },
			context: {
				apiBaseUrl: "https://api.example.test",
				stateEngine: {
					getState: vi.fn((path) => path === "fanBooking.catalog.temporaryHoldSlots" ? [unexpired, expired] : []),
				},
			},
			api,
		});

		expect(result.ok).toBe(true);
		expect(result.data.temporaryHoldAvailabilityStale).toBe(true);
		expect(result.data.temporaryHoldSlots).toEqual([unexpired]);
	});
});
