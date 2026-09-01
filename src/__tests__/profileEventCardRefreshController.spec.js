import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const scriptPath = resolve(
  process.cwd(),
  "../wp/wp-content/plugins/fansocial/assets/new-profile/hero-right-buttons.js",
);
const fullSource = readFileSync(scriptPath, "utf8");
const bookingsSource = fullSource.slice(fullSource.indexOf("// Bookings"));

const successfulResult = (nextRefreshAt = null) => ({
  ok: true,
  status: "rendered",
  renderedEvents: [{ eventId: "evt_123", type: "1on1-call" }],
  items: [{ eventId: "evt_123", type: "1on1-call" }],
  bookedSlots: [],
  nextRefreshAt,
});

async function flushPromises() {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve();
  }
}

function openProfilePopup() {
  const popup = document.querySelector("[data-pre-call-init-popup]");
  popup.style.display = "flex";
  document.querySelector("[data-toggle-pre-call-init-popup]")
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function closeProfilePopup() {
  const popup = document.querySelector("[data-pre-call-init-popup]");
  popup.style.display = "none";
  document.querySelector("[data-toggle-pre-call-init-popup]")
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

describe("profile event-card refresh controller", () => {
  let visibilityState;
  let visibilitySpy;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    visibilityState = "visible";
    visibilitySpy = vi.spyOn(document, "visibilityState", "get")
      .mockImplementation(() => visibilityState);
    document.body.innerHTML = `
      <button data-toggle-pre-call-init-popup>Open</button>
      <div data-pre-call-init-popup style="display: none"></div>
    `;
    window.siteData = {
      bookingsBackendLambdaEndpoint: "https://bookings.example",
      tokensLambdaEndpoint: "https://tokens.example",
    };
    window.userData = { userID: 2615, jwtToken: "jwt_test" };
    window.userSpecifiData = {
      currentUser: { userId: 2615 },
      targetUser: { userId: 1407, avatar: "", userDisplayName: "Creator" },
    };
    window.translation_strings = {};
    window._UPDATE_UI_ACCORDING_TO_CALL_AVAILABILITY = vi.fn();
  });

  afterEach(() => {
    window._PROFILE_CREATOR_EVENTS_REFRESH_CONTROLLER?.dispose();
    visibilitySpy?.mockRestore();
    document.body.innerHTML = "";
    delete window.FanSocialEventCards;
    delete window.__FSHeroRightButtonsSlotLogic;
    delete window._PROFILE_CREATOR_EVENTS_REFRESH_CONTROLLER;
    delete window._PROFILE_CREATOR_EVENTS_DOM_READY_LISTENER;
    delete window._UPDATE_UI_ACCORDING_TO_CALL_AVAILABILITY;
    delete window.siteData;
    delete window.userData;
    delete window.userSpecifiData;
    delete window.translation_strings;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function loadController(fetchAndRender) {
    window.FanSocialEventCards = {
      initProfileCreatorEvents: fetchAndRender,
      renderProfileCreatorEvents: vi.fn(() => successfulResult()),
    };
    window.eval(bookingsSource);
    return window._PROFILE_CREATOR_EVENTS_REFRESH_CONTROLLER;
  }

  it("polls every 10 seconds only while visible and refreshes on reopen or tab return", async () => {
    const fetchAndRender = vi.fn(() => Promise.resolve(successfulResult()));
    loadController(fetchAndRender);
    await flushPromises();
    expect(fetchAndRender).toHaveBeenCalledTimes(1);

    openProfilePopup();
    await flushPromises();
    expect(fetchAndRender).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(10000);
    expect(fetchAndRender).toHaveBeenCalledTimes(3);

    visibilityState = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(20000);
    expect(fetchAndRender).toHaveBeenCalledTimes(3);

    visibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    await flushPromises();
    expect(fetchAndRender).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(10000);
    expect(fetchAndRender).toHaveBeenCalledTimes(5);

    closeProfilePopup();
    await vi.advanceTimersByTimeAsync(20000);
    expect(fetchAndRender).toHaveBeenCalledTimes(5);

    openProfilePopup();
    await flushPromises();
    expect(fetchAndRender).toHaveBeenCalledTimes(6);
  });

  it("keeps cutoff refreshes and retries failures after five seconds", async () => {
    const cutoffAt = Date.now() + 3000;
    const fetchAndRender = vi.fn()
      .mockResolvedValueOnce(successfulResult(cutoffAt))
      .mockResolvedValueOnce(successfulResult(cutoffAt))
      .mockResolvedValueOnce({ ok: false, status: "error", error: new Error("temporary") })
      .mockResolvedValue(successfulResult());
    loadController(fetchAndRender);
    await flushPromises();

    openProfilePopup();
    await flushPromises();
    expect(fetchAndRender).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(3999);
    expect(fetchAndRender).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchAndRender).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(4999);
    expect(fetchAndRender).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchAndRender).toHaveBeenCalledTimes(4);
  });

  it("deduplicates slow refreshes and clears polling when disposed", async () => {
    let resolveOpenRefresh;
    const openRefresh = new Promise((resolvePromise) => {
      resolveOpenRefresh = resolvePromise;
    });
    const fetchAndRender = vi.fn()
      .mockResolvedValueOnce(successfulResult())
      .mockReturnValueOnce(openRefresh)
      .mockResolvedValue(successfulResult());
    const controller = loadController(fetchAndRender);
    await flushPromises();

    openProfilePopup();
    await flushPromises();
    expect(fetchAndRender).toHaveBeenCalledTimes(2);

    controller.refresh("booking-open");
    await vi.advanceTimersByTimeAsync(30000);
    expect(fetchAndRender).toHaveBeenCalledTimes(2);

    resolveOpenRefresh(successfulResult());
    await flushPromises();
    expect(fetchAndRender).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(10000);
    expect(fetchAndRender).toHaveBeenCalledTimes(4);

    controller.dispose();
    await vi.advanceTimersByTimeAsync(30000);
    expect(fetchAndRender).toHaveBeenCalledTimes(4);
  });

  it("refreshes after the shared booking-created callback fires", async () => {
    const fetchAndRender = vi.fn(() => Promise.resolve(successfulResult()));
    loadController(fetchAndRender);
    await flushPromises();
    const initialOptions = fetchAndRender.mock.calls[0][0];

    initialOptions.onBookingCreated({ eventId: "evt_123" }, { bookingId: "booking_123" });
    await flushPromises();

    expect(fetchAndRender).toHaveBeenCalledTimes(2);
    expect(fetchAndRender.mock.calls[1][0]).toEqual(expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it("keeps the legacy fallback buffer calculation in parity", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, items: [] }),
    })));
    delete window.FanSocialEventCards;
    window.eval(bookingsSource);
    const event = {
      eventId: "evt_legacy_buffer",
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-01",
      sessionDurationMinutes: 10,
      enableBufferTime: true,
      bookingBufferMinutes: 5,
      slots: [{ startTime: "08:20", endTime: "09:00" }],
    };

    const next = window.__FSHeroRightButtonsSlotLogic.getNextCardSlot(event, [{
      eventId: event.eventId,
      status: "confirmed",
      startIso: "2026-09-01T08:20:00+08:00",
      endIso: "2026-09-01T08:30:00+08:00",
    }]);

    expect(next.startMs).toBe(new Date("2026-09-01T08:35:00+08:00").getTime());
    await flushPromises();
  });
});
