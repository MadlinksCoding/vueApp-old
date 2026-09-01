import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboardSource = readFileSync(
  resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/assets/dashboard-v2/js/pages/overview/fan/main-v2.js"),
  "utf8",
);

async function flushPromises() {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
}

function successfulEventsResponse(items = [{ eventId: "evt_1", creatorId: 1407 }]) {
  return Promise.resolve({
    json: () => Promise.resolve({ success: true, items }),
  });
}

describe("dashboard latest event-card refresh controller", () => {
  let visibilityState;
  let visibilitySpy;
  let observers;
  let section;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    visibilityState = "visible";
    visibilitySpy = vi.spyOn(document, "visibilityState", "get")
      .mockImplementation(() => visibilityState);
    observers = [];

    class IntersectionObserverMock {
      constructor(callback) {
        this.callback = callback;
        this.disconnect = vi.fn();
        observers.push(this);
      }

      observe() {}
    }

    window.IntersectionObserver = IntersectionObserverMock;
    globalThis.IntersectionObserver = IntersectionObserverMock;
    window.matchMedia = vi.fn(() => ({ matches: false }));
    document.body.innerHTML = `
      <section data-v2-latest-events-section>
        <div data-v2-latest-events-loading></div>
        <div data-v2-latest-events-carousel-wrapper class="dn">
          <div data-v2-latest-events-carousel>
            <ul data-v2-latest-events-list></ul>
          </div>
        </div>
      </section>
    `;
    section = document.querySelector("[data-v2-latest-events-section]");
    window.siteData = {
      bookingsBackendLambdaEndpoint: "https://bookings.example",
      tokensLambdaEndpoint: "https://tokens.example",
    };
    window.userData = { userID: 2615, jwtToken: "jwt_test" };
    window.FanSocialEventCards = {
      fetchBookedSlots: vi.fn(() => Promise.resolve([])),
      renderEventSlides: vi.fn(({ events }) => events),
    };
    globalThis.fetch = vi.fn(() => successfulEventsResponse());
    delete window.Dashboard_Overview_Fan_V2_Object;
  });

  afterEach(() => {
    window.Dashboard_Overview_Fan_V2_Object?.disposeLatestEventsRefreshController();
    visibilitySpy?.mockRestore();
    document.body.innerHTML = "";
    delete window.Dashboard_Overview_Fan_V2_Object;
    delete window.FanSocialEventCards;
    delete window.siteData;
    delete window.userData;
    delete window.IntersectionObserver;
    delete window.matchMedia;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function loadDashboard() {
    window.eval(dashboardSource);
    return window.Dashboard_Overview_Fan_V2_Object;
  }

  function setSectionVisible(isVisible) {
    observers[0].callback([{ target: section, isIntersecting: isVisible }]);
  }

  it("polls every ten seconds only while the section and tab are visible", async () => {
    const controller = loadDashboard();
    await controller.latestEventsRefreshInFlight;
    expect(fetch).toHaveBeenCalledTimes(1);

    setSectionVisible(true);
    await flushPromises();
    expect(fetch).toHaveBeenCalledTimes(1);
    const splide = { refresh: vi.fn() };
    controller.v2Splides["latest-events"] = splide;

    await vi.advanceTimersByTimeAsync(10000);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(window.FanSocialEventCards.fetchBookedSlots).toHaveBeenCalledTimes(2);
    expect(splide.refresh).toHaveBeenCalledTimes(1);

    visibilityState = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(20000);
    expect(fetch).toHaveBeenCalledTimes(2);

    visibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    await flushPromises();
    expect(fetch).toHaveBeenCalledTimes(3);

    setSectionVisible(false);
    await vi.advanceTimersByTimeAsync(20000);
    expect(fetch).toHaveBeenCalledTimes(3);

    setSectionVisible(true);
    await flushPromises();
    expect(fetch).toHaveBeenCalledTimes(4);

    controller.disposeLatestEventsRefreshController();
    await vi.advanceTimersByTimeAsync(30000);
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("queues one fresh refresh when booking callbacks fire during a slow request", async () => {
    let resolveSlowEvents;
    const slowEvents = new Promise((resolvePromise) => {
      resolveSlowEvents = resolvePromise;
    });
    globalThis.fetch
      .mockImplementationOnce(() => successfulEventsResponse())
      .mockImplementationOnce(() => slowEvents)
      .mockImplementation(() => successfulEventsResponse());
    const controller = loadDashboard();
    await controller.latestEventsRefreshInFlight;
    setSectionVisible(true);

    await vi.advanceTimersByTimeAsync(10000);
    expect(fetch).toHaveBeenCalledTimes(2);
    const renderOptions = window.FanSocialEventCards.renderEventSlides.mock.calls[0][0];
    renderOptions.onBookingFlowOpened({ eventId: "evt_1", creatorId: 1407 });
    renderOptions.onBookingCreated({ eventId: "evt_1", creatorId: 1407 }, { bookingId: "booking_1" });
    await flushPromises();
    expect(fetch).toHaveBeenCalledTimes(2);

    resolveSlowEvents({
      json: () => Promise.resolve({ success: true, items: [{ eventId: "evt_1", creatorId: 1407 }] }),
    });
    await controller.latestEventsRefreshInFlight;
    await flushPromises();
    await vi.advanceTimersByTimeAsync(0);

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(window.FanSocialEventCards.fetchBookedSlots).toHaveBeenCalledTimes(3);
  });

  it("keeps the last rendering on booked-slot failure and retries after five seconds", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.FanSocialEventCards.fetchBookedSlots
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("temporary booked-slot failure"))
      .mockResolvedValue([]);
    const controller = loadDashboard();
    await controller.latestEventsRefreshInFlight;
    setSectionVisible(true);
    expect(window.FanSocialEventCards.renderEventSlides).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(10000);
    expect(window.FanSocialEventCards.renderEventSlides).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(4999);
    expect(fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(window.FanSocialEventCards.renderEventSlides).toHaveBeenCalledTimes(2);
  });

  it("aborts disposal without rendering a late response", async () => {
    let resolveEvents;
    globalThis.fetch.mockImplementationOnce(() => new Promise((resolvePromise) => {
      resolveEvents = resolvePromise;
    }));
    const controller = loadDashboard();
    const signal = controller.latestEventsRefreshAbortController.signal;

    controller.disposeLatestEventsRefreshController();
    expect(signal.aborted).toBe(true);
    resolveEvents({
      json: () => Promise.resolve({ success: true, items: [{ eventId: "evt_late", creatorId: 1407 }] }),
    });
    await flushPromises();

    expect(window.FanSocialEventCards.renderEventSlides).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
