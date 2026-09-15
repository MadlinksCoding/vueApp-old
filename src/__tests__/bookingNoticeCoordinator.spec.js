import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const coordinatorSource = readFileSync(resolve(
  process.cwd(),
  "../wp/wp-content/plugins/fansocial/assets/js/booking-notice-coordinator.js",
), "utf8");
const hostCss = readFileSync(resolve(process.cwd(), "public/bookings-embed/fs-events-host.css"), "utf8");

const feed = {
  success: true,
  activities: [],
  bookings: [{
    bookingId: "booking-1",
    status: "confirmed",
    startIso: "2026-09-14T10:00:00.000Z",
    htmlByContext: { overview: "<article>Overview</article>", sidebar: "<article>Sidebar</article>" },
  }],
  nextCursor: 3,
  hasMore: false,
  viewer: { id: 10, role: "fan", displayName: "Fan" },
};

describe("FSBookingNoticeCoordinator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    document.body.innerHTML = "";
    delete window.FSBookingNoticeCoordinator;
    window.FSBookingNoticeSettings = {
      enabled: true,
	  testToolsEnabled: true,
      endpoint: "https://example.test/wp-json/api/bookings/notices-feed",
      nonce: "nonce",
      userId: 10,
      loginSessionId: "session-a",
      iframeSrc: "/bookings-embed/notices.html",
      config: { refreshIntervalSeconds: 10 },
    };
    window.FSEventsEmbed = {
      openBookingDetailsPopup: vi.fn(),
      mountBookingNotices: vi.fn((options) => {
        options.onReady({ position: "top-right" });
        return { update: vi.fn(), setConfig: vi.fn(), destroy: vi.fn() };
      }),
    };
  });

  afterEach(() => {
    window.FSBookingNoticeCoordinator?.destroy();
    document.body.innerHTML = "";
    delete window.apiLoader;
    delete window.FSScheduledCallOverlay;
    delete window.showToast;
    window.history.replaceState({}, "", "/");
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("coalesces refreshes into one request and reuses the shared slots for reminders", async () => {
    let release;
    const fetchMock = vi.fn(() => new Promise((resolvePromise) => { release = resolvePromise; }));
    vi.stubGlobal("fetch", fetchMock);
    window.eval(coordinatorSource);

    window.FSBookingNoticeCoordinator.refresh("focus");
    window.FSBookingNoticeCoordinator.refresh("calendar-change");
    await vi.advanceTimersByTimeAsync(50);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    release({ ok: true, json: async () => feed });
    await vi.runAllTicks();
    await vi.advanceTimersByTimeAsync(0);
    expect(window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].config.summary).toMatchObject({
      desktopPosition: "top-right",
      mobilePosition: "bottom",
    });
    expect(window.FSBookingNoticeCoordinator.isReady()).toBe(true);
    const shared = window.FSBookingNoticeCoordinator.getBookedSlots({
      fromIso: "2026-09-13T00:00:00.000Z",
      toIso: "2026-09-15T00:00:00.000Z",
      statusIn: "confirmed",
      renderContext: "sidebar",
    });
    expect(shared.slots[0].html).toContain("Sidebar");
  });

  it("recovers when a restored database has a lower activity cursor", async () => {
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      activityCursor: 91,
      openActivityIds: [],
      openActivityTimestamps: {},
      dismissedActivityIds: {},
    }));
    const restoredActivity = {
      id: "restored-activity",
      type: "booking-confirmed",
      priority: "status-change",
      recipientRole: "fan",
      bookingId: "restored-booking",
      occurredAt: "2026-09-14T10:00:00.000Z",
      display: { title: "Restored booking", startIso: "2026-09-14T10:00:00.000Z" },
    };
    const restoredFeed = {
      ...feed,
      activities: [restoredActivity],
      nextCursor: 1,
      activityCursorHead: 1,
      activityCursorReset: true,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => restoredFeed })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved.activityCursor).toBe(1);
    expect(saved.openActivityIds).toContain("restored-activity");
    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    expect(notices.some((notice) => notice.allItemIds?.includes("restored-activity") || notice.id === "restored-activity")).toBe(true);
  });

  it("keeps a newly fetched notice open when stale browser IDs exceed the feed restore limit", async () => {
    const staleIds = Array.from({ length: 56 }, (_, index) => `stale-activity-${index + 1}`);
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      activityCursor: 10,
      openActivityIds: staleIds,
      openActivityTimestamps: Object.fromEntries(staleIds.map((id) => [id, Date.now()])),
      dismissedActivityIds: {},
      dailyDismissalDate: "2026-09-14",
    }));
    const freshActivity = {
      id: "fresh-activity",
      type: "booking-confirmed",
      priority: "status-change",
      recipientRole: "fan",
      bookingId: "fresh-booking",
      occurredAt: "2026-09-14T10:00:00.000Z",
      display: { title: "Fresh booking", startIso: "2026-09-14T10:00:00.000Z" },
    };
    let requestCount = 0;
    const fetchMock = vi.fn(async (requestUrl) => {
      const requestedOpenIds = new URL(requestUrl).searchParams.get("openIds")?.split(",").filter(Boolean) || [];
      const activities = requestCount === 0 || requestedOpenIds.includes(freshActivity.id) ? [freshActivity] : [];
      requestCount += 1;
      return { ok: true, json: async () => ({ ...feed, activities, nextCursor: 11 }) };
    });
    vi.stubGlobal("fetch", fetchMock);

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    window.FSBookingNoticeCoordinator.refresh("interval");
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const secondRequestOpenIds = new URL(fetchMock.mock.calls[1][0]).searchParams.get("openIds").split(",");
    expect(secondRequestOpenIds).toContain("fresh-activity");
    const controller = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
    const latestNotices = controller.update.mock.calls.at(-1)[0].notices;
    expect(latestNotices.some((notice) => notice.id === "fresh-activity")).toBe(true);
    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved.openActivityIds).toContain("fresh-activity");
    expect(saved.openActivityIds.length).toBeLessThan(staleIds.length + 1);
  });

  it("shows the creator pending-request count on Call Settings with desktop tooltip and mobile badge data", async () => {
    document.body.innerHTML = `
      <div data-sidebar-menu-item data-page="dashboard/events">
        <a data-main-menu-item href="/dashboard/events/">
          <svg data-sidebar-menu-icon></svg>
          <span data-sidebar-menu-item-text>Call Settings</span>
        </a>
      </div>
    `;
    const creatorFeed = {
      ...feed,
      pendingBookingCount: 3,
      viewer: { id: 1407, role: "creator", displayName: "Creator" },
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => creatorFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const link = document.querySelector('[data-page="dashboard/events"] a');
    const badge = link.querySelector("[data-booking-pending-count]");
    const tooltip = link.querySelector("[data-booking-pending-tooltip]");
    expect(link.classList.contains("fs-booking-pending-menu-link")).toBe(true);
    expect(link.getAttribute("aria-label")).toBe("Call Settings, 3 pending requests");
    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toBe("3");
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toBe("3 Pending Requests");
    expect(link.querySelector("[data-booking-pending-menu-anchor]").classList)
      .toContain("fs-booking-pending-menu-anchor--active");
  });

  it("hides the Call Settings badge when the current user has no pending requests", async () => {
    document.body.innerHTML = `
      <div data-sidebar-menu-item data-page="dashboard/events">
        <a data-main-menu-item href="/dashboard/events/"><svg data-sidebar-menu-icon></svg></a>
      </div>
    `;
    const creatorFeed = {
      ...feed,
      pendingBookingCount: 0,
      viewer: { id: 1407, role: "creator", displayName: "Creator" },
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => creatorFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const link = document.querySelector('[data-page="dashboard/events"] a');
    expect(link.querySelector("[data-booking-pending-count]").hidden).toBe(true);
    expect(link.querySelector("[data-booking-pending-tooltip]").hidden).toBe(true);
    expect(link.hasAttribute("aria-describedby")).toBe(false);
    expect(hostCss).toMatch(/\.fs-booking-pending-menu-badge\[hidden\]\s*\{[^}]*display:\s*none/);
  });

  it("returns control to legacy reminders when the shared snapshot becomes stale", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => feed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();
    expect(window.FSBookingNoticeCoordinator.isReady()).toBe(true);
    window.FSBookingNoticeCoordinator.destroy();
    await vi.advanceTimersByTimeAsync(31000);
    expect(window.FSBookingNoticeCoordinator.getBookedSlots({ statusIn: "confirmed" })).toBeNull();
  });

  it("stores the visible summary IDs and keeps fixed summary content stable until dismissal", async () => {
    window.FSBookingNoticeSettings.config.summary = {
      totalLimit: 1,
      perSectionLimit: 3,
      contentRefresh: "fixed-until-next-trigger",
    };
    const activity = (id, type = "price-adjustment-sent", priority = "action-required") => ({
      id,
      type,
      priority,
      recipientRole: "fan",
      bookingId: `booking-${id}`,
      occurredAt: `2026-09-13T10:0${id === "a" ? 0 : 1}:00.000Z`,
      display: { title: `Activity ${id}`, startIso: `2026-09-14T10:0${id === "a" ? 0 : 1}:00.000Z` },
    });
    let responseData = { ...feed, activities: [activity("a"), activity("c")], nextCursor: 1 };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => responseData })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved.visibleSummaryItemIds).toEqual(["a"]);
	expect(saved.summarySnapshotItemIds).toEqual(["a", "c"]);
	const initialNotice = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices[0];
	expect(initialNotice.sections[0].items[0].month).toBe("SEP");
	expect(initialNotice.allItemIds).toEqual(["a", "c"]);

    responseData = { ...feed, activities: [activity("a"), activity("b", "price-adjustment-sent", "action-required"), activity("c")], nextCursor: 2 };
    window.FSBookingNoticeCoordinator.refresh("new-activity");
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();
    const controller = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
    const latestNotices = controller.update.mock.calls.at(-1)[0].notices;
    const latest = latestNotices[0];
    expect(latest.sections.flatMap((section) => section.items.map((item) => item.id))).toEqual(["a", "c"]);
    expect(latest.allItemIds).toEqual(["a", "c"]);
    expect(latestNotices.some((notice) => notice.id === "b")).toBe(true);
  });

  it("splits price-adjustment summary sections by state and assigns the correct priority", async () => {
    const activity = (id, type) => ({
      id,
      type,
      priority: "action-required",
      recipientRole: "fan",
      bookingId: `booking-${id}`,
      occurredAt: "2026-09-13T10:00:00.000Z",
      display: { title: `Activity ${id}`, startIso: "2026-09-14T10:00:00.000Z" },
    });
    const responseData = {
      ...feed,
      activities: [
        activity("price-sent", "price-adjustment-sent"),
        activity("price-accepted", "price-adjustment-accepted"),
        activity("price-declined", "price-adjustment-declined"),
      ],
      nextCursor: 3,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => responseData })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const summary = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices[0];
    const priceSections = summary.sections.filter((section) => section.type === "price-adjustment");
    expect(priceSections.map((section) => section.variant)).toEqual(["request-sent", "accepted", "declined"]);
    expect(priceSections.map((section) => section.priority)).toEqual(["action-required", "status-change", "status-change"]);
    expect(priceSections.map((section) => section.id)).toEqual([
      "price-adjustment:request-sent",
      "price-adjustment:accepted",
      "price-adjustment:declined",
    ]);
  });

  it("supports the configured empty summary and keeps the creator review route", async () => {
    window.FSBookingNoticeSettings.config.summary = { emptyBehavior: "show" };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => feed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();
    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    expect(mountOptions.notices[0]).toMatchObject({ id: "booking-activity-summary", sections: [] });
    expect(coordinatorSource).toContain('global.sessionStorage.setItem("fsBookingNoticeReviewIntent"');
    expect(coordinatorSource).toContain('payload.action.id === "review-booking"');
    expect(coordinatorSource).toContain('payload.action.id === "review-bookings"');
  });

  it("uses apiLoader for creator Review actions inside the dashboard and dismisses once", async () => {
    window.history.replaceState({}, "", "/dashboard/overview/");
    window.apiLoader = { loadApi: vi.fn(() => Promise.resolve()) };
    window.FSBookingNoticeSettings.userId = 1407;
    const activityFeed = {
      ...feed,
      viewer: { id: 1407, role: "creator", displayName: "Creator" },
      activities: [{
        id: "activity-review-request",
        type: "booking-request",
        priority: "action-required",
        recipientRole: "creator",
        bookingId: "booking-review-request",
        occurredAt: "2026-09-13T10:00:00.000Z",
        display: { title: "Review request", startIso: "2026-09-14T10:00:00.000Z" },
      }],
      nextCursor: 1,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => activityFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    mountOptions.onPrimaryAction({
      noticeId: "activity-review-request",
      dismissedItemIds: ["activity-review-request"],
      action: { id: "review-booking" },
    });

    expect(window.apiLoader.loadApi).toHaveBeenCalledOnce();
    expect(window.apiLoader.loadApi).toHaveBeenCalledWith("dashboard/events", {}, true);
    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:1407"));
    expect(saved.dismissedActivityIds["activity-review-request"]).toBeDefined();
    expect(saved.openActivityIds).not.toContain("activity-review-request");
  });

  it("keeps the full-page Events redirect as the unavailable and rejected apiLoader fallback", () => {
    expect(coordinatorSource).toContain('navigation.catch(function () { global.location.assign(url); });');
    expect(coordinatorSource).toMatch(/catch \(_error\) \{\}[\s\S]*global\.location\.assign\(url\);/);
  });

  it("opens Join Call in the shared scheduled-call iframe and dismisses once", async () => {
    const overlayHandle = { close: vi.fn() };
    window.FSScheduledCallOverlay = { open: vi.fn(() => overlayHandle) };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => feed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const payload = {
      noticeId: "ready|booking-1|2026-09-14T10:00:00.000Z|10",
      dismissedItemIds: ["ready|booking-1|2026-09-14T10:00:00.000Z|10"],
      action: {
        id: "join-call",
        bookingId: "booking-1",
        url: "/scheduled-meeting/?booking_id=booking-1",
      },
    };

    mountOptions.onPrimaryAction(payload);
    mountOptions.onJoin(payload);

    expect(window.FSScheduledCallOverlay.open).toHaveBeenCalledOnce();
    expect(window.FSScheduledCallOverlay.open).toHaveBeenCalledWith(
      "/scheduled-meeting/?booking_id=booking-1",
      { source: "booking_notice" },
    );
    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved.dismissedActivityIds[payload.noticeId]).toBeDefined();
    expect(coordinatorSource).not.toContain("global.location.assign(payload.action.url)");
  });

  it("keeps the notice available when the scheduled-call iframe service cannot launch", async () => {
    window.FSScheduledCallOverlay = { open: vi.fn(() => null) };
    window.showToast = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => feed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const controller = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
    const payload = {
      noticeId: "ready|booking-1|2026-09-14T10:00:00.000Z|10",
      dismissedItemIds: ["ready|booking-1|2026-09-14T10:00:00.000Z|10"],
      action: { id: "join-call", url: "/scheduled-meeting/?booking_id=booking-1" },
    };

    mountOptions.onPrimaryAction(payload);
    await vi.advanceTimersByTimeAsync(0);

    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved?.dismissedActivityIds?.[payload.noticeId]).toBeUndefined();
    expect(controller.update).toHaveBeenCalled();
  });

  it("opens the first visible real booking when a fan reviews a summary", async () => {
    const activityFeed = {
      ...feed,
      activities: [{
        id: "activity-summary-item",
        type: "price-adjustment-sent",
        priority: "action-required",
        recipientRole: "fan",
        bookingId: "booking-summary-item",
        occurredAt: "2026-09-13T10:00:00.000Z",
        display: { title: "Adjustment", startIso: "2026-09-14T10:00:00.000Z" },
      }],
      nextCursor: 1,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => activityFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    mountOptions.onPrimaryAction({
      noticeId: "booking-activity-summary",
      action: { id: "review-summary" },
      dismissedItemIds: ["activity-summary-item"],
    });

    expect(window.FSEventsEmbed.openBookingDetailsPopup).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking-summary-item",
      userRole: "fan",
      fanId: 10,
    }));
  });

  it("formats notice times like the designs and opens real fan Detail with the required account context", async () => {
    const activityFeed = {
      ...feed,
      activities: [{
        id: "activity-confirmed",
        type: "booking-confirmed",
        priority: "general-information",
        recipientRole: "fan",
        actorId: 1407,
        bookingId: "booking-confirmed",
        occurredAt: "2026-09-13T10:00:00.000Z",
        display: {
          title: "Confirmed booking",
          startIso: "2026-09-14T00:35:00",
          endIso: "2026-09-14T00:45:00",
        },
      }],
      nextCursor: 1,
    };
    window.siteData = { bookingsBackendLambdaEndpoint: "https://bookings.test", tokensLambdaEndpoint: "https://tokens.test" };
    window.userData = { jwtToken: "jwt" };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => activityFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const notice = mountOptions.notices.find((item) => item.id === "activity-confirmed");
    expect(notice.items[0]).toMatchObject({
      month: "SEP",
      time: "12:35am – 12:45am",
      activityType: "booking-confirmed",
      person: { userId: 1407 },
    });
    const stateBeforeDetail = localStorage.getItem("fsBookingNoticeState:v1:10");
    const controller = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
    const updatesBeforeDetail = controller.update.mock.calls.length;
    mountOptions.onDetail({ noticeId: notice.id, item: notice.items[0] });
    expect(window.FSEventsEmbed.openBookingDetailsPopup).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking-confirmed",
      userRole: "fan",
      fanId: 10,
      apiBaseUrl: "https://bookings.test",
      tokenHandlerApiUrl: "https://tokens.test",
      jwtToken: "jwt",
    }));
    expect(localStorage.getItem("fsBookingNoticeState:v1:10")).toBe(stateBeforeDetail);
    expect(controller.update.mock.calls).toHaveLength(updatesBeforeDetail);
    expect(mountOptions.notices.some((item) => item.id === notice.id)).toBe(true);
    delete window.siteData;
    delete window.userData;
  });

  it("passes the booked-slot counterparty ID to ready-to-join notice items", async () => {
    vi.setSystemTime(new Date("2026-09-14T09:57:00.000Z"));
    const readyFeed = {
      ...feed,
      bookings: [{
        bookingId: "booking-ready-profile",
        status: "confirmed",
        startIso: "2026-09-14T10:00:00.000Z",
        endIso: "2026-09-14T10:30:00.000Z",
        booking_user_id: 1407,
        userDisplayName: "Creator",
      }],
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => readyFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    const ready = notices.find((notice) => notice.type === "ready-to-join");
    expect(ready.items[0].person).toMatchObject({ userId: 1407, name: "Creator" });
  });

  it("builds Events today from future local-day bookings, promotes Ready items, and represents matching confirmations", async () => {
    vi.setSystemTime(new Date(2026, 8, 14, 10, 0, 0));
    window.FSBookingNoticeSettings.config = {
      refreshIntervalSeconds: 10,
      summary: { totalLimit: 2, perSectionLimit: 3 },
    };
    const at = (dayOffset, hour, minute = 0) => new Date(2026, 8, 14 + dayOffset, hour, minute, 0).toISOString();
    const booking = (bookingId, status, startIso) => ({
      bookingId,
      status,
      startIso,
      endIso: new Date(new Date(startIso).getTime() + 30 * 60_000).toISOString(),
      eventTitle: bookingId,
      booking_user_id: 1407,
      userDisplayName: "Creator",
    });
    const confirmation = (id, bookingId, startIso) => ({
      id,
      type: "booking-confirmed",
      priority: "general-information",
      recipientRole: "fan",
      bookingId,
      occurredAt: at(-1, 12),
      display: { title: bookingId, startIso },
    });
    const readyStart = at(0, 10, 4);
    const firstTodayStart = at(0, 10, 30);
    const secondTodayStart = at(0, 11, 0);
    const tomorrowStart = at(1, 10, 30);
    const responseData = {
      ...feed,
      bookings: [
        booking("ready-booking", "confirmed", readyStart),
        booking("today-confirmed", "confirmed", firstTodayStart),
        booking("today-accepted", "accepted", secondTodayStart),
        booking("already-started", "confirmed", at(0, 9, 45)),
        booking("tomorrow", "confirmed", tomorrowStart),
        booking("pending", "pending", at(0, 12, 0)),
        booking("completed", "completed", at(0, 12, 30)),
      ],
      activities: [
        confirmation("confirm-ready", "ready-booking", readyStart),
        confirmation("confirm-today", "today-confirmed", firstTodayStart),
        confirmation("confirm-today-hidden", "today-accepted", secondTodayStart),
        confirmation("confirm-tomorrow", "tomorrow", tomorrowStart),
      ],
      nextCursor: 4,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => responseData })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const summary = mountOptions.notices.find((notice) => notice.id === "booking-activity-summary");
    expect(summary.audience).toBe("fan");
    expect(summary.sections.map((section) => section.type)).toEqual(["ready-to-join", "events-today", "booking-confirmed"]);
    const readySection = summary.sections[0];
    const todaySection = summary.sections[1];
    expect(readySection.items[0]).toMatchObject({
      bookingId: "ready-booking",
      representedActivityIds: ["confirm-ready"],
    });
    expect(todaySection).toMatchObject({ priority: "events-today", totalCount: 2 });
    expect(todaySection.items.map((item) => item.bookingId)).toEqual(["today-confirmed", "today-accepted"]);
    expect(todaySection.items[0].representedActivityIds).toEqual(["confirm-today"]);
    expect(summary.allItemIds).toEqual(expect.arrayContaining(["confirm-ready", "confirm-today", "confirm-today-hidden"]));
    expect(summary.allItemIds).toContain("confirm-tomorrow");
    const confirmedSection = summary.sections[2];
    expect(confirmedSection).toMatchObject({ type: "booking-confirmed", totalCount: 1 });
    expect(confirmedSection.items[0]).toMatchObject({ bookingId: "tomorrow", id: "confirm-tomorrow" });
    expect(confirmedSection.items.map((item) => item.bookingId)).not.toEqual(expect.arrayContaining(["ready-booking", "today-confirmed", "today-accepted"]));

    const savedBeforeClose = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(savedBeforeClose.visibleSummaryItemIds).toEqual(expect.arrayContaining(["confirm-ready", "confirm-today"]));
    expect(savedBeforeClose.visibleSummaryItemIds).not.toContain("confirm-today-hidden");
    expect(savedBeforeClose.visibleSummaryItemIds).not.toContain("confirm-tomorrow");
    expect(savedBeforeClose.visibleSummaryItemIds).not.toContain(todaySection.items[1].id);
    mountOptions.onClose({
      noticeId: "booking-activity-summary",
      dismissedItemIds: savedBeforeClose.visibleSummaryItemIds,
    });
    const savedAfterClose = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(savedAfterClose.dismissedActivityIds["confirm-ready"]).toBeDefined();
    expect(savedAfterClose.dismissedActivityIds["confirm-today"]).toBeDefined();
    expect(savedAfterClose.dismissedActivityIds["confirm-today-hidden"]).toBeUndefined();
    expect(savedAfterClose.dismissedActivityIds["confirm-tomorrow"]).toBeUndefined();
  });

  it("uses the matching booked-slot user when an automatic activity has no actor", async () => {
    const automaticFeed = {
      ...feed,
      bookings: [{
        bookingId: "booking-automatic",
        status: "confirmed",
        startIso: "2026-09-20T10:00:00.000Z",
        endIso: "2026-09-20T10:30:00.000Z",
        booking_user_id: 1407,
        userDisplayName: "Automatic booking creator",
        userHeadshot: "stale-booking-avatar.png",
      }],
      activities: [{
        id: "activity-automatic",
        type: "booking-confirmed",
        priority: "general-information",
        recipientRole: "fan",
        actorId: 0,
        bookingId: "booking-automatic",
        occurredAt: "2026-09-13T10:00:00.000Z",
        display: {
          title: "Automatically confirmed",
          startIso: "2026-09-20T10:00:00.000Z",
          endIso: "2026-09-20T10:30:00.000Z",
        },
      }],
      nextCursor: 1,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => automaticFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    const automatic = notices.find((notice) => notice.id === "activity-automatic");
    expect(automatic.items[0].person).toEqual({
      userId: 1407,
      name: "Automatic booking creator",
      avatar: "stale-booking-avatar.png",
    });
  });

  it("groups all open creator booking requests before the visible notice limit", async () => {
    window.FSBookingNoticeSettings.userId = 1407;
    window.FSBookingNoticeSettings.config = { refreshIntervalSeconds: 10, maxVisibleNotices: 1 };
    const request = (id, startIso) => ({
      id,
      type: "booking-request",
      priority: "action-required",
      recipientRole: "creator",
      bookingId: `booking-${id}`,
      occurredAt: "2026-09-13T10:00:00.000Z",
      display: { title: `Request ${id}`, startIso },
    });
    const activityFeed = {
      ...feed,
      viewer: { id: 1407, role: "creator", displayName: "Creator" },
      activities: [
        request("activity-later", "2026-09-16T10:00:00.000Z"),
        request("activity-sooner", "2026-09-15T10:00:00.000Z"),
      ],
      nextCursor: 2,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => activityFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const grouped = mountOptions.notices.find((notice) => notice.id === "booking-request-group|1407");
    expect(grouped).toMatchObject({
      type: "booking-request",
      heading: "You have 2 new pending bookings:",
      totalCount: 2,
      showDetail: true,
      dismissItemIds: ["activity-sooner", "activity-later"],
      action: { id: "review-bookings", label: "REVIEW", showArrow: false },
    });
    expect(grouped.items.map((item) => item.id)).toEqual(["activity-sooner", "activity-later"]);

    const summary = mountOptions.notices.find((notice) => notice.id === "booking-activity-summary");
    expect(summary.sections.find((section) => section.type === "booking-request").items).toHaveLength(2);

    mountOptions.onClose({ noticeId: grouped.id, dismissedItemIds: grouped.dismissItemIds });
    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:1407"));
    expect(Object.keys(saved.dismissedActivityIds)).toEqual(expect.arrayContaining(grouped.dismissItemIds));
    expect(saved.openActivityIds).toEqual([]);
  });

  it("keeps booking requests separate when related-change grouping is disabled", async () => {
    window.FSBookingNoticeSettings.userId = 1407;
    window.FSBookingNoticeSettings.config = { refreshIntervalSeconds: 10, groupRelatedChanges: false };
    const activityFeed = {
      ...feed,
      viewer: { id: 1407, role: "creator", displayName: "Creator" },
      activities: ["one", "two"].map((id, index) => ({
        id: `activity-${id}`,
        type: "booking-request",
        priority: "action-required",
        recipientRole: "creator",
        bookingId: `booking-${id}`,
        occurredAt: `2026-09-13T10:0${index}:00.000Z`,
        display: { title: `Request ${id}`, startIso: `2026-09-${15 + index}T10:00:00.000Z` },
      })),
      nextCursor: 2,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => activityFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    expect(notices.filter((notice) => notice.type === "booking-request")).toHaveLength(2);
    expect(notices.some((notice) => String(notice.id).startsWith("booking-request-group|"))).toBe(false);
  });

  it("rebuilds a cross-tab snapshot through the receiving tab's dismissal state", async () => {
    let channel;
    vi.stubGlobal("BroadcastChannel", class {
      constructor() { channel = this; }
      postMessage() {}
      close() {}
    });
    const activity = {
      id: "activity-a",
      type: "booking-confirmed",
      priority: "general-information",
      recipientRole: "fan",
      bookingId: "booking-a",
      occurredAt: "2026-09-13T10:00:00.000Z",
      display: { title: "Confirmed", startIso: "2026-09-14T10:00:00.000Z" },
    };
    const activityFeed = { ...feed, activities: [activity], nextCursor: 1 };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => activityFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const controller = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
    mountOptions.onClose({ noticeId: "booking-activity-summary", dismissedItemIds: ["activity-a"] });
    channel.onmessage({ data: { type: "snapshot", snapshot: { ...activityFeed, notices: [{ id: "stale-summary" }] } } });

    expect(controller.update.mock.calls.at(-1)[0].notices).toEqual([]);
  });

	it("injects browser-only Lab notices without running real WordPress actions", async () => {
	  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => feed })));
	  window.eval(coordinatorSource);
	  await vi.advanceTimersByTimeAsync(50);
	  await vi.runAllTicks();

	  const testAction = vi.fn();
	  window.addEventListener("FS_BOOKING_NOTICE_TEST_ACTION", testAction);
	  const shown = window.FSBookingNoticeCoordinator.showTestNotices([{
		id: "lab-booking-confirmed-1",
		type: "booking-confirmed",
		items: [{ id: "lab-item-1", bookingId: "lab-booking-1" }],
	  }], { attentionAnimation: "blink" });
	  expect(shown).toBe(true);

	  const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
	  const controller = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
	  expect(controller.setConfig).toHaveBeenLastCalledWith(expect.objectContaining({ attentionAnimation: "blink" }));
	  expect(controller.update.mock.calls.at(-1)[0].notices[0].id).toBe("lab-booking-confirmed-1");

	  mountOptions.onDetail({ noticeId: "lab-booking-confirmed-1", item: { id: "lab-item-1" } });
	  mountOptions.onPrimaryAction({ noticeId: "lab-booking-confirmed-1", action: { bookingId: "lab-booking-1" } });
	  expect(testAction).toHaveBeenCalled();
	  expect(controller.update.mock.calls.at(-1)[0].notices).toEqual([]);
	  window.removeEventListener("FS_BOOKING_NOTICE_TEST_ACTION", testAction);
	});
});
