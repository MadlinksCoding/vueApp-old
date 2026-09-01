import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("WordPress event-card JWT resolution", () => {
  beforeEach(() => {
    delete window.FanSocialEventCards;
    delete window.__FSHeroRightButtonsSlotLogic;
    window.userData = { userID: "2615", jwtToken: "jwt_runtime_fresh" };
    window.siteData = {
      bookingsBackendLambdaEndpoint: "https://bookings.example",
      tokensLambdaEndpoint: "https://tokens.example",
    };
    window.translation_strings = {};
    window.FSEventsEmbed = { openFanBookingPopup: vi.fn() };

    const source = readFileSync(
      resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/assets/shared/event-cards.js"),
      "utf8",
    );
    window.eval(source);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete window.FanSocialEventCards;
    delete window.__FSHeroRightButtonsSlotLogic;
    delete window.FSEventsEmbed;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("prefers the refreshed runtime JWT over the token captured at initialization", () => {
    window.FanSocialEventCards.openBookingPopupForEvent({
      eventId: "evt_123",
      creatorId: 1407,
    }, {
      creatorId: 1407,
      currentFanId: 2615,
      jwtToken: "jwt_initial_stale",
    });

    expect(window.FSEventsEmbed.openFanBookingPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorId: 1407,
        fanId: 2615,
        eventId: "evt_123",
        jwtToken: "jwt_runtime_fresh",
      }),
    );
  });

  it("preserves tolerant booked-slot fetches while strict refreshes reject failures", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false, status: 503 })));

    await expect(window.FanSocialEventCards.fetchBookedSlots(1407)).resolves.toEqual([]);
    await expect(window.FanSocialEventCards.fetchBookedSlots(1407, {
      rejectOnError: true,
    })).rejects.toThrow("status 503");
  });

  it("uses authoritative raw booked slots when WordPress display rows omit event identity", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T17:50:00+06:00"));
    const rawSlot = {
      bookingId: "booking_live_shape",
      eventId: "evt_live_shape",
      userId: 2615,
      status: "confirmed",
      startIso: "2026-09-01T19:50:00+08:00",
      endIso: "2026-09-01T20:00:00+08:00",
      extensions: [],
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        slots: [{
          bookingId: rawSlot.bookingId,
          status: rawSlot.status,
          startIso: "2026-09-01T17:50:00+06:00",
          endIso: "2026-09-01T18:00:00+06:00",
        }],
        original_data_response: { slots: [rawSlot] },
      }),
    })));

    const bookedSlots = await window.FanSocialEventCards.fetchBookedSlots(6586, {
      rejectOnError: true,
    });
    const next = window.FanSocialEventCards.getNextCardSlot({
      eventId: rawSlot.eventId,
      type: "1on1-call",
      repeatRule: "weekly",
      dateFrom: "2026-09-01",
      sessionDurationMinutes: 10,
      enableBufferTime: true,
      bookingBufferMinutes: 5,
      slots: [{
        day: "tuesday",
        startTime: "02:00",
        endTime: "01:55",
        endDayOffset: 1,
      }],
    }, bookedSlots);

    expect(bookedSlots).toEqual([rawSlot]);
    expect(next.startMs).toBe(new Date("2026-09-01T20:05:00+08:00").getTime());
  });

  it("opens the booking flow before requesting the background card refresh", () => {
    const callOrder = [];
    window.FSEventsEmbed.openFanBookingPopup.mockImplementation(() => {
      callOrder.push("open");
      return { close: vi.fn() };
    });
    const onBookingFlowOpened = vi.fn(() => callOrder.push("refresh"));

    const popup = window.FanSocialEventCards.openBookingPopupForEvent({
      eventId: "evt_123",
      creatorId: 1407,
    }, {
      creatorId: 1407,
      currentFanId: 2615,
      onBookingFlowOpened,
    });

    expect(callOrder).toEqual(["open", "refresh"]);
    expect(onBookingFlowOpened).toHaveBeenCalledWith(expect.objectContaining({ eventId: "evt_123" }));
    expect(popup).toEqual(expect.objectContaining({ close: expect.any(Function) }));
  });

  it("forwards booking creation to the card refresh callback", () => {
    const event = { eventId: "evt_123", creatorId: 1407 };
    const payload = { bookingId: "booking_123" };
    const onBookingCreated = vi.fn();

    window.FanSocialEventCards.openBookingPopupForEvent(event, {
      creatorId: 1407,
      currentFanId: 2615,
      onBookingCreated,
    });
    const popupOptions = window.FSEventsEmbed.openFanBookingPopup.mock.calls[0][0];
    popupOptions.onBookingCreated(payload);

    expect(onBookingCreated).toHaveBeenCalledWith(event, payload);
  });

  it("keeps profile booking lifecycle callbacks when rendering through the profile wrapper", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    document.body.innerHTML = `
      <template data-id="event-1on1-card"><button data-el="book-now">Book</button></template>
      <div data-creator-events-list></div>
    `;
    const onBookingFlowOpened = vi.fn();
    const onBookingCreated = vi.fn();
    const event = {
      eventId: "evt_private_profile",
      creatorId: 1407,
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-03",
      sessionDurationMinutes: 10,
      slots: [{ startTime: "08:30", endTime: "09:00" }],
    };

    window.FanSocialEventCards.renderProfileCreatorEvents({
      creatorId: 1407,
      currentFanId: 2615,
      onBookingFlowOpened,
      onBookingCreated,
    }, [event], []);
    document.querySelector('[data-el="book-now"]').click();
    const popupOptions = window.FSEventsEmbed.openFanBookingPopup.mock.calls[0][0];
    popupOptions.onBookingCreated({ bookingId: "booking_profile" });

    expect(onBookingFlowOpened).toHaveBeenCalledWith(event);
    expect(onBookingCreated).toHaveBeenCalledWith(event, { bookingId: "booking_profile" });
  });

  it("applies the configured buffer after a booked private session", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    const event = {
      eventId: "evt_buffered",
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-01",
      sessionDurationMinutes: 10,
      enableBufferTime: true,
      bookingBufferMinutes: 5,
      slots: [{ startTime: "08:20", endTime: "09:00" }],
    };
    const next = window.FanSocialEventCards.getNextCardSlot(event, [{
      eventId: event.eventId,
      status: "confirmed",
      startIso: "2026-09-01T08:20:00+08:00",
      endIso: "2026-09-01T08:30:00+08:00",
    }]);

    expect(next.startMs).toBe(new Date("2026-09-01T08:35:00+08:00").getTime());
  });

  it("shows 4:50 after a buffered 4:35 to 4:45 booking", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T08:00:00+08:00"));
    const event = {
      eventId: "evt_435",
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-01",
      sessionDurationMinutes: 10,
      enableBufferTime: true,
      bookingBufferMinutes: 5,
      slots: [{ startTime: "16:35", endTime: "17:15" }],
    };
    const next = window.FanSocialEventCards.getNextCardSlot(event, [{
      eventId: event.eventId,
      status: "confirmed",
      startIso: "2026-09-01T16:35:00+08:00",
      endIso: "2026-09-01T16:45:00+08:00",
    }]);

    expect(next.startMs).toBe(new Date("2026-09-01T16:50:00+08:00").getTime());
  });

  it("does not insert buffers between entirely free private sessions", () => {
    const event = {
      eventId: "evt_free",
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-01",
      sessionDurationMinutes: 10,
      enableBufferTime: true,
      bookingBufferMinutes: 5,
      slots: [{ startTime: "16:35", endTime: "17:15" }],
    };
    const slots = window.__FSHeroRightButtonsSlotLogic.buildCandidateCardSlotsForLocalDate(
      event,
      "2026-09-01",
      [],
      event.eventId,
    );

    expect(slots.slice(0, 3).map((slot) => slot.startMs)).toEqual([
      new Date("2026-09-01T16:35:00+08:00").getTime(),
      new Date("2026-09-01T16:45:00+08:00").getTime(),
      new Date("2026-09-01T16:55:00+08:00").getTime(),
    ]);
  });

  it.each([
    {
      label: "1-to-1",
      event: {
        eventId: "evt_private",
        creatorId: 1407,
        type: "1on1-call",
        repeatRule: "daily",
        dateFrom: "2026-09-01",
        dateTo: "2026-09-03",
        sessionDurationMinutes: 15,
        slots: [{ startTime: "04:45", endTime: "05:15" }],
      },
    },
    {
      label: "group",
      event: {
        eventId: "evt_group",
        creatorId: 1407,
        type: "group-event",
        repeatRule: "doesNotRepeat",
        dateFrom: "2026-09-02",
        enableMaxAttendees: true,
        maxAttendees: 2,
        basePriceTokens: 100,
        slots: [{ date: "2026-09-02", times: [{ startTime: "04:45", endTime: "05:45" }] }],
      },
    },
  ])("refreshes after the enabled $label card action opens the flow", ({ event }) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    document.body.innerHTML = `
      <template data-id="event-1on1-card"><button data-el="book-now">Book</button></template>
      <template data-id="event-group-fixedPrice-card"><button data-el="book-now">Join</button></template>
      <div data-cards></div>
    `;
    const onBookingFlowOpened = vi.fn();

    const rendered = window.FanSocialEventCards.renderEventSlides({
      container: document.querySelector("[data-cards]"),
      templateScope: document,
      events: [event],
      bookedSlots: [],
      creatorId: 1407,
      currentFanId: 2615,
      onBookingFlowOpened,
    });
    document.querySelector('[data-el="book-now"]').click();

    expect(rendered).toHaveLength(1);
    expect(window.FSEventsEmbed.openFanBookingPopup).toHaveBeenCalledTimes(1);
    expect(onBookingFlowOpened).toHaveBeenCalledTimes(1);
  });

  it("does not open or refresh from a disabled group-event action", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    document.body.innerHTML = `
      <template data-id="event-1on1-card"><button data-el="book-now">Book</button></template>
      <template data-id="event-group-fixedPrice-card"><button data-el="book-now">Join</button></template>
      <div data-cards></div>
    `;
    const event = {
      eventId: "evt_group_booked",
      creatorId: 1407,
      type: "group-event",
      repeatRule: "doesNotRepeat",
      dateFrom: "2026-09-02",
      enableMaxAttendees: true,
      maxAttendees: 2,
      basePriceTokens: 100,
      slots: [{ date: "2026-09-02", times: [{ startTime: "04:45", endTime: "05:45" }] }],
    };
    const onBookingFlowOpened = vi.fn();

    const rendered = window.FanSocialEventCards.renderEventSlides({
      container: document.querySelector("[data-cards]"),
      templateScope: document,
      events: [event],
      bookedSlots: [{
        eventId: event.eventId,
        userId: 2615,
        status: "confirmed",
        startIso: "2026-09-02T04:45:00+08:00",
        endIso: "2026-09-02T05:45:00+08:00",
      }],
      creatorId: 1407,
      currentFanId: 2615,
      onBookingFlowOpened,
    });
    const button = document.querySelector('[data-el="book-now"]');
    button.click();

    expect(rendered).toHaveLength(1);
    expect(button.disabled).toBe(true);
    expect(window.FSEventsEmbed.openFanBookingPopup).not.toHaveBeenCalled();
    expect(onBookingFlowOpened).not.toHaveBeenCalled();
  });
});
