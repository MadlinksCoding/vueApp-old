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
        return { update: vi.fn(), setConfig: vi.fn(), setBookingDetailsActive: vi.fn(), destroy: vi.fn() };
      }),
    };
  });

  afterEach(() => {
    window.FSBookingNoticeCoordinator?.destroy();
    document.body.innerHTML = "";
    delete window.apiLoader;
    delete window.FSScheduledCallOverlay;
    delete window.FSOpenCreatorBookingDetails;
    delete window.FSOpenFanBookingDetails;
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
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("nocache")).toBe("1");

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

  it("treats an empty notice controller as ready and resynchronizes when notices appear", async () => {
    let hostReady = true;
    let mountOptions;
    const hostController = {
      update: vi.fn(({ notices }) => { hostReady = notices.length === 0; }),
      setConfig: vi.fn(),
      setBookingDetailsActive: vi.fn(),
      destroy: vi.fn(),
      isReady: vi.fn(() => hostReady),
    };
    window.FSEventsEmbed.mountBookingNotices = vi.fn((options) => {
      mountOptions = options;
      return hostController;
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ...feed, bookings: [] }) })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    expect(window.FSBookingNoticeCoordinator.isReady()).toBe(true);

    window.FSBookingNoticeCoordinator.showTestNotices([{ id: "test-visible", type: "booking-confirmed" }]);
    expect(hostController.update).toHaveBeenLastCalledWith({
      notices: [expect.objectContaining({ id: "test-visible" })],
    });
    expect(window.FSBookingNoticeCoordinator.isReady()).toBe(false);

    hostReady = true;
    mountOptions.onReady({ position: "top-right" });
    expect(window.FSBookingNoticeCoordinator.isReady()).toBe(true);

    window.FSBookingNoticeCoordinator.clearTestNotices();
    expect(hostController.update).toHaveBeenLastCalledWith({ notices: [] });
    expect(window.FSBookingNoticeCoordinator.isReady()).toBe(true);
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

  it("purges superseded confirmation state and shows only the cancellation", async () => {
    const confirmationId = "confirmation-to-remove";
    const localDate = new Date();
    const day = [localDate.getFullYear(), String(localDate.getMonth() + 1).padStart(2, "0"), String(localDate.getDate()).padStart(2, "0")].join("-");
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      activityCursor: 1,
      openActivityIds: [confirmationId],
      openActivityTimestamps: { [confirmationId]: Date.now() },
      dismissedActivityIds: {},
      visibleSummaryItemIds: [confirmationId],
      summarySnapshotItemIds: [confirmationId],
      summaryOpen: true,
      dailyDismissalDate: day,
    }));
    const cancellation = {
      id: "cancellation-activity",
      type: "booking-cancelled",
      priority: "status-change",
      recipientRole: "fan",
      bookingId: "cancelled-booking",
      occurredAt: "2026-09-14T10:05:00.000Z",
      display: {
        title: "Cancelled booking",
        startIso: "2026-09-14T10:00:00.000Z",
        cancellationStatus: "cancelled_system",
        cancellationReason: "both_no_show_auto_cancel",
      },
    };
    const staleConfirmedStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...feed,
        activities: [cancellation],
        supersessions: [{
          id: "silent-cancellation-supersession",
          bookingId: "cancelled-booking",
          terminalState: "cancelled_system",
          supersedesActivityIds: [confirmationId],
        }],
        bookings: [{ bookingId: "cancelled-booking", status: "confirmed", startIso: staleConfirmedStart }],
        nextCursor: 2,
      }),
    })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved.openActivityIds).not.toContain(confirmationId);
    expect(saved.visibleSummaryItemIds).not.toContain(confirmationId);
    expect(saved.summarySnapshotItemIds).not.toContain(confirmationId);
    expect(saved.supersededActivityIds[confirmationId]).toBeTypeOf("number");
    expect(saved.openActivityIds).toContain("cancellation-activity");
    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    expect(notices).toEqual([expect.objectContaining({
      id: "cancellation-activity",
      type: "booking-cancelled",
      serverActivityIds: ["cancellation-activity"],
    })]);
    expect(notices.some((notice) => notice.id === "booking-activity-summary")).toBe(false);
  });

  it("fully purges a requested open activity that is no longer on the server", async () => {
    const missingId = "deleted-on-server";
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      activityCursor: 4,
      openActivityIds: [missingId],
      openActivityTimestamps: { [missingId]: Date.now() },
      dismissedActivityIds: {},
      visibleSummaryItemIds: [missingId],
      summarySnapshotItemIds: [missingId],
      summaryOpen: true,
    }));
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...feed, activities: [], supersessions: [], bookings: [] }),
    })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved.openActivityIds).not.toContain(missingId);
    expect(saved.visibleSummaryItemIds).not.toContain(missingId);
    expect(saved.summarySnapshotItemIds).not.toContain(missingId);
    expect(saved.supersededActivityIds[missingId]).toBeTypeOf("number");
  });

  it("uses the fan identity for a creator-facing cancellation", async () => {
    const localDate = new Date();
    const day = [localDate.getFullYear(), String(localDate.getMonth() + 1).padStart(2, "0"), String(localDate.getDate()).padStart(2, "0")].join("-");
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      openActivityIds: [], openActivityTimestamps: {}, dismissedActivityIds: {}, dailyDismissalDate: day,
    }));
    const creatorCancellationFeed = {
      ...feed,
      viewer: { id: 1407, role: "creator", displayName: "Creator" },
      bookings: [],
      activities: [{
        id: "fan-cancelled-activity",
        type: "booking-cancelled",
        priority: "status-change",
        recipientRole: "creator",
        bookingId: "fan-cancelled-booking",
        occurredAt: new Date().toISOString(),
        display: {
          title: "Fan cancellation",
          status: "cancelled_user",
          cancellationStatus: "cancelled_user",
          cancellationReason: "fan_cancelled",
          fanId: 2615,
          fanName: "Cosmania Fan",
          fanAvatar: "https://example.test/fan.jpg",
          creatorName: "Cosmania Creator",
        },
      }],
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => creatorCancellationFeed })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    const cancellation = notices.find((notice) => notice.id === "fan-cancelled-activity");
    expect(cancellation).toMatchObject({
      audience: "creator",
      actor: { displayName: "Cosmania Fan" },
      cancellationStatus: "cancelled_user",
      action: null,
    });
    expect(cancellation.items[0].person).toMatchObject({ userId: 2615, name: "Cosmania Fan" });
  });

  it.each([
    ["cancelled_system", "both_no_show_auto_cancel", "system", "booking-cancelled"],
    ["no_show_creator", "creator_no_show_auto_cancel", "system", "booking-cancelled"],
    ["completed", "", "", null],
    ["no_show_fan", "fan_no_show", "system", null],
    ["cancelled", "fan_cancelled", "user", null],
  ])("reconciles a historical confirmation against current %s state", async (status, cancelReason, cancellationActor, expectedType) => {
    const localDate = new Date();
    const day = [localDate.getFullYear(), String(localDate.getMonth() + 1).padStart(2, "0"), String(localDate.getDate()).padStart(2, "0")].join("-");
    const historicalConfirmation = {
      id: `historical-${status}`,
      type: "booking-confirmed",
      priority: "general-information",
      recipientRole: "fan",
      bookingId: `booking-${status}`,
      occurredAt: "2026-09-14T10:00:00.000Z",
      display: { title: "Historical confirmation", startIso: "2026-09-14T10:00:00.000Z" },
    };
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      activityCursor: 0,
      openActivityIds: [],
      openActivityTimestamps: {},
      dismissedActivityIds: {},
      dailyDismissalDate: day,
    }));
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ...feed,
        activities: [historicalConfirmation],
        bookings: [{
          bookingId: `booking-${status}`,
          status,
          cancelReason,
          cancellationActor,
          userDisplayName: "Creator",
          booking_user_id: 1407,
          startIso: "2026-09-14T10:00:00.000Z",
        }],
        nextCursor: 1,
      }),
    })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    if (expectedType) {
      expect(notices).toHaveLength(1);
      expect(notices[0]).toMatchObject({
        id: historicalConfirmation.id,
        type: expectedType,
        activityType: expectedType,
        cancellationStatus: status,
      });
    } else {
      expect(notices).toEqual([]);
    }
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

  it("never renders an empty summary and keeps the creator review route", async () => {
    window.FSBookingNoticeSettings.config.summary = { emptyBehavior: "show" };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => feed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();
    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    expect(mountOptions.notices).toEqual([]);
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

  it("keeps individually closed standalone notices dismissed after a coordinator reload", async () => {
    vi.setSystemTime(new Date(2026, 8, 16, 12, 0, 0));
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      openActivityIds: [],
      openActivityTimestamps: {},
      dismissedActivityIds: {},
      dailyDismissalDate: "2026-09-16",
    }));
    window.FSBookingNoticeSettings.config = { refreshIntervalSeconds: 10, groupRelatedChanges: false };
    const activities = ["one", "two", "three"].map((suffix, index) => ({
      id: `standalone-${suffix}`,
      type: "booking-declined",
      priority: "status-change",
      recipientRole: "fan",
      bookingId: `booking-${suffix}`,
      occurredAt: new Date(2026, 8, 16, 10, index, 0).toISOString(),
      display: {
        title: `Declined ${suffix}`,
        startIso: new Date(2026, 8, 20 + index, 10, 0, 0).toISOString(),
      },
    }));
    const activityFeed = { ...feed, bookings: [], activities, nextCursor: 3 };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => activityFeed })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const firstMountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    expect(firstMountOptions.notices.map((notice) => notice.id)).toEqual(activities.map((activity) => activity.id));
    const stateVersions = [];
    activities.forEach((activity) => {
      firstMountOptions.onClose({ noticeId: activity.id, dismissedItemIds: [] });
      stateVersions.push(JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10")).updatedAt);
    });
    expect(stateVersions[1]).toBeGreaterThan(stateVersions[0]);
    expect(stateVersions[2]).toBeGreaterThan(stateVersions[1]);
    const savedBeforeReload = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(Object.keys(savedBeforeReload.dismissedActivityIds)).toEqual(expect.arrayContaining(activities.map((activity) => activity.id)));

    window.FSBookingNoticeCoordinator.destroy();
    delete window.FSBookingNoticeCoordinator;
    window.FSEventsEmbed.mountBookingNotices.mockClear();
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    expect(window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices).toEqual([]);
    const savedAfterReload = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(Object.keys(savedAfterReload.dismissedActivityIds)).toEqual(expect.arrayContaining(activities.map((activity) => activity.id)));
  });

  it("preserves a dismissal written by another tab while a stale refresh is in flight", async () => {
    vi.setSystemTime(new Date(2026, 8, 16, 12, 0, 0));
    const activity = {
      id: "closed-in-another-tab",
      type: "booking-declined",
      priority: "status-change",
      recipientRole: "fan",
      bookingId: "booking-cross-tab",
      occurredAt: new Date(2026, 8, 16, 10, 0, 0).toISOString(),
      display: { title: "Cross-tab booking", startIso: new Date(2026, 8, 20, 10, 0, 0).toISOString() },
    };
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      openActivityIds: [],
      openActivityTimestamps: {},
      dismissedActivityIds: {},
      dailyDismissalDate: "2026-09-16",
      updatedAt: 1,
    }));
    let resolveFeed;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((resolve) => { resolveFeed = resolve; })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      openActivityIds: [],
      openActivityTimestamps: {},
      dismissedActivityIds: { [activity.id]: Date.now() },
      dailyDismissalDate: "2026-09-16",
      updatedAt: Date.now() + 1,
    }));
    resolveFeed({ ok: true, json: async () => ({ ...feed, bookings: [], activities: [activity], nextCursor: 1 }) });
    await vi.runAllTicks();
    await vi.advanceTimersByTimeAsync(0);

    expect(window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices).toEqual([]);
    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved.dismissedActivityIds[activity.id]).toBeDefined();
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

  it("uses the original standalone Review Adjustment action for one summary candidate", async () => {
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
    expect(mountOptions.notices).toEqual([expect.objectContaining({
      id: "activity-summary-item",
      type: "price-adjustment",
      action: expect.objectContaining({ id: "review-adjustment" }),
    })]);
    mountOptions.onPrimaryAction({
      noticeId: "activity-summary-item",
      action: { id: "review-adjustment", bookingId: "booking-summary-item" },
      dismissedItemIds: ["activity-summary-item"],
    });

    expect(window.FSEventsEmbed.openBookingDetailsPopup).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking-summary-item",
      userRole: "fan",
      fanId: 10,
    }));
  });

  it("formats notice times like the designs and opens real fan Detail with the required account context", async () => {
    window.FSBookingNoticeSettings.dismissEndpoint = "https://example.test/wp-json/api/bookings/notices-dismiss";
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
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => activityFeed }));
    vi.stubGlobal("fetch", fetchMock);
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
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === "POST")).toBe(false);
    delete window.siteData;
    delete window.userData;
  });

  it.each([
    ["creator", "FSOpenCreatorBookingDetails"],
    ["fan", "FSOpenFanBookingDetails"],
  ])("demotes notices before opening an existing %s booking-details slide-in", async (role, openerName) => {
    const opener = vi.fn();
    window[openerName] = opener;
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...feed, viewer: { ...feed.viewer, role } }),
    })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const noticeController = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
    mountOptions.onDetail({ noticeId: "detail-stays-open", item: { bookingId: "booking-detail" } });

    expect(noticeController.setBookingDetailsActive).toHaveBeenCalledWith(true);
    expect(opener).toHaveBeenCalledWith("booking-detail", null, {});
  });

  it("restores notice layering when an existing booking-details opener throws", async () => {
    window.FSOpenFanBookingDetails = vi.fn(() => {
      throw new Error("details failed");
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => feed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const noticeController = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
    expect(() => {
      mountOptions.onDetail({ noticeId: "detail-stays-open", item: { bookingId: "booking-detail" } });
    }).toThrow("details failed");
    expect(noticeController.setBookingDetailsActive.mock.calls.map(([active]) => active)).toEqual([true, false]);
  });

  it("restores the layer and uses the fallback when an existing details opener declines to open", async () => {
    window.FSOpenFanBookingDetails = vi.fn(() => false);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => feed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const noticeController = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
    mountOptions.onDetail({ noticeId: "detail-stays-open", item: { bookingId: "booking-detail" } });

    expect(noticeController.setBookingDetailsActive.mock.calls.map(([active]) => active)).toEqual([true, false, true]);
    expect(window.FSEventsEmbed.openBookingDetailsPopup).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking-detail",
      userRole: "fan",
    }));
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

  it("keeps Ready notices through the booking end and safely handles missing end times", async () => {
    vi.setSystemTime(new Date("2026-09-14T10:05:00.000Z"));
    const booking = (bookingId, status, startIso, endIso) => ({
      bookingId,
      status,
      startIso,
      ...(endIso === undefined ? {} : { endIso }),
      booking_user_id: 1407,
      userDisplayName: "Creator",
    });
    const readyFeed = {
      ...feed,
      activities: [],
      bookings: [
        booking("live-valid", "confirmed", "2026-09-14T10:00:00.000Z", "2026-09-14T10:10:00.000Z"),
        booking("ending-now", "accepted", "2026-09-14T10:00:00.000Z", "2026-09-14T10:05:00.000Z"),
        booking("already-ended", "confirmed", "2026-09-14T09:50:00.000Z", "2026-09-14T10:04:59.000Z"),
        booking("missing-end-started", "confirmed", "2026-09-14T10:00:00.000Z"),
        booking("invalid-end-started", "confirmed", "2026-09-14T10:00:00.000Z", "not-a-date"),
        booking("missing-end-upcoming", "confirmed", "2026-09-14T10:08:00.000Z"),
        booking("cancelled-live", "cancelled", "2026-09-14T10:00:00.000Z", "2026-09-14T10:10:00.000Z"),
      ],
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => readyFeed })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    const readyBookingIds = notices
      .filter((notice) => notice.type === "ready-to-join")
      .map((notice) => notice.items[0].bookingId);
    expect(readyBookingIds).toEqual(["live-valid", "missing-end-upcoming"]);
  });

  it("keeps an ongoing Ready booking dismissed after reload without revealing related notices", async () => {
    vi.setSystemTime(new Date("2026-09-14T10:05:00.000Z"));
    const startIso = "2026-09-14T10:00:00.000Z";
    const readyId = `ready|ongoing-dismissed|${startIso}|10`;
    const confirmationId = "confirmation-ongoing-dismissed";
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      activityCursor: 1,
      openActivityIds: [confirmationId],
      openActivityTimestamps: { [confirmationId]: Date.now() },
      dismissedActivityIds: { [readyId]: Date.now() },
      supersededActivityIds: {},
      pendingActivityDismissalIds: {},
    }));
    const ongoingFeed = {
      ...feed,
      activities: [{
        id: confirmationId,
        type: "booking-confirmed",
        priority: "general-information",
        recipientRole: "fan",
        bookingId: "ongoing-dismissed",
        occurredAt: "2026-09-14T09:30:00.000Z",
        display: { title: "Ongoing booking", startIso },
      }],
      bookings: [{
        bookingId: "ongoing-dismissed",
        status: "confirmed",
        startIso,
        endIso: "2026-09-14T10:30:00.000Z",
        booking_user_id: 1407,
        userDisplayName: "Creator",
      }],
      nextCursor: 1,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ongoingFeed })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    expect(window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices).toEqual([]);
  });

  it("does not reclassify a dismissed Ready booking as Events today", async () => {
    vi.setSystemTime(new Date("2026-09-14T09:57:00.000Z"));
    window.FSScheduledCallOverlay = { open: vi.fn(() => ({ close() {} })) };
    const readyFeed = {
      ...feed,
      activities: [],
      bookings: [{
        bookingId: "booking-ready-only",
        status: "confirmed",
        startIso: "2026-09-14T10:00:00.000Z",
        endIso: "2026-09-14T10:30:00.000Z",
        booking_user_id: 1407,
        userDisplayName: "Creator",
        joinUrl: "/scheduled-meeting/?booking_id=booking-ready-only",
      }],
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => readyFeed })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const controller = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
    const ready = mountOptions.notices.find((notice) => notice.type === "ready-to-join");
    expect(ready).toBeDefined();

    mountOptions.onPrimaryAction({
      noticeId: ready.id,
      dismissedItemIds: [],
      action: {
        id: "join-call",
        bookingId: "booking-ready-only",
        url: "/scheduled-meeting/?booking_id=booking-ready-only",
      },
    });

    const noticesAfterJoin = controller.update.mock.calls.at(-1)[0].notices;
    expect(noticesAfterJoin).toEqual([]);
    expect(noticesAfterJoin.some((notice) => notice.type === "events-today")).toBe(false);
  });

  it("builds Events today from future local-day bookings, promotes Ready items, and represents matching confirmations", async () => {
    vi.setSystemTime(new Date(2026, 8, 14, 10, 0, 0));
    const postMessage = vi.fn();
    vi.stubGlobal("BroadcastChannel", class {
      postMessage(payload) { postMessage(payload); }
      close() {}
    });
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
    let responseData = {
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
    const readyNotice = mountOptions.notices.find((notice) => notice.type === "ready-to-join");
    const summary = mountOptions.notices.find((notice) => notice.id === "booking-activity-summary");
    expect(readyNotice).toMatchObject({
      type: "ready-to-join",
      serverActivityIds: ["confirm-ready"],
    });
    expect(readyNotice.items[0]).toMatchObject({
      bookingId: "ready-booking",
      representedActivityIds: ["confirm-ready"],
    });
    expect(summary.audience).toBe("fan");
    expect(summary.sections.map((section) => section.type)).toEqual(["events-today", "booking-confirmed"]);
    const todaySection = summary.sections[0];
    expect(todaySection).toMatchObject({ priority: "events-today", totalCount: 2 });
    expect(todaySection.items.map((item) => item.bookingId)).toEqual(["today-confirmed", "today-accepted"]);
    expect(todaySection.items[0].representedActivityIds).toEqual(["confirm-today"]);
    expect(summary.allItemIds).toEqual(expect.arrayContaining(["confirm-today", "confirm-today-hidden"]));
    expect(summary.allItemIds).not.toContain("confirm-ready");
    expect(summary.allItemIds).toContain("confirm-tomorrow");
    const confirmedSection = summary.sections[1];
    expect(confirmedSection).toMatchObject({ type: "booking-confirmed", totalCount: 1 });
    expect(confirmedSection.items[0]).toMatchObject({ bookingId: "tomorrow", id: "confirm-tomorrow" });
    expect(confirmedSection.items.map((item) => item.bookingId)).not.toEqual(expect.arrayContaining(["ready-booking", "today-confirmed", "today-accepted"]));

    const savedBeforeClose = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(savedBeforeClose.visibleSummaryItemIds).toEqual(expect.arrayContaining(["confirm-today", "confirm-today-hidden"]));
    expect(savedBeforeClose.visibleSummaryItemIds).not.toContain("confirm-ready");
    expect(savedBeforeClose.visibleSummaryItemIds).not.toContain("confirm-tomorrow");
    expect(savedBeforeClose.visibleSummaryItemIds).toContain(todaySection.items[1].id);
    mountOptions.onClose({
      noticeId: "booking-activity-summary",
      dismissedItemIds: summary.allItemIds,
    });
    const savedAfterClose = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(savedAfterClose.dismissedActivityIds["confirm-ready"]).toBeUndefined();
    expect(savedAfterClose.dismissedActivityIds["confirm-today"]).toBeDefined();
    expect(savedAfterClose.dismissedActivityIds["confirm-today-hidden"]).toBeDefined();
    expect(savedAfterClose.dismissedActivityIds["confirm-tomorrow"]).toBeDefined();
    const remainingReadyNotices = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value.update.mock.calls.at(-1)[0].notices;
    expect(remainingReadyNotices).toHaveLength(2);
    expect(remainingReadyNotices).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "ready-to-join", items: [expect.objectContaining({ bookingId: "ready-booking" })] }),
      expect.objectContaining({ type: "ready-to-join", items: [expect.objectContaining({ bookingId: "already-started" })] }),
    ]));

    const dismissedBroadcast = postMessage.mock.calls
      .map(([message]) => message)
      .find((message) => message.type === "state"
        && summary.allItemIds.every((id) => message.state.dismissedActivityIds[id]));
    expect(dismissedBroadcast).toBeDefined();

    const newActivity = {
      id: "new-after-summary-close",
      type: "booking-declined",
      priority: "status-change",
      recipientRole: "fan",
      bookingId: "new-booking",
      occurredAt: at(0, 10, 10),
      display: { title: "New after close", startIso: at(2, 10, 30) },
    };
    responseData = {
      ...responseData,
      activities: [...responseData.activities, newActivity],
      nextCursor: 5,
    };
    window.FSBookingNoticeCoordinator.refresh("new-after-summary-close");
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();
    const latestNotices = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value.update.mock.calls.at(-1)[0].notices;
    expect(latestNotices.some((notice) => notice.id === newActivity.id)).toBe(true);
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

  it("uses the creator identity for fan notices instead of the action actor", async () => {
    const identityFeed = {
      ...feed,
      bookings: [{
        bookingId: "booking-role-correct-fan",
        status: "confirmed",
        startIso: "2026-09-21T10:00:00.000Z",
        endIso: "2026-09-21T10:30:00.000Z",
        booking_user_id: 1407,
        userDisplayName: "Booked-slot creator",
        userHeadshot: "booked-slot-creator.png",
      }],
      activities: [{
        id: "activity-role-correct-fan",
        type: "booking-confirmed",
        priority: "general-information",
        recipientRole: "fan",
        actorId: 2615,
        bookingId: "booking-role-correct-fan",
        occurredAt: "2026-09-13T10:00:00.000Z",
        display: {
          title: "Confirmed booking",
          startIso: "2026-09-21T10:00:00.000Z",
          endIso: "2026-09-21T10:30:00.000Z",
          actorName: "The fan who booked",
          actorAvatar: "fan-actor.png",
          creatorId: 1407,
          creatorName: "Stored creator",
          creatorAvatar: "stored-creator.png",
        },
      }],
      nextCursor: 1,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => identityFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    const notice = notices.find((candidate) => candidate.id === "activity-role-correct-fan");
    expect(notice.items[0].person).toEqual({
      userId: 1407,
      name: "Stored creator",
      avatar: "stored-creator.png",
    });
  });

  it("uses the fan identity for creator notices instead of the action actor", async () => {
    window.FSBookingNoticeSettings.userId = 1407;
    const identityFeed = {
      ...feed,
      viewer: { id: 1407, role: "creator", displayName: "Creator" },
      bookings: [{
        bookingId: "booking-role-correct-creator",
        status: "confirmed",
        startIso: "2026-09-21T10:00:00.000Z",
        endIso: "2026-09-21T10:30:00.000Z",
        booking_user_id: 2615,
        userDisplayName: "Booked-slot fan",
        userHeadshot: "booked-slot-fan.png",
      }],
      activities: [{
        id: "activity-role-correct-creator",
        type: "price-adjustment-accepted",
        priority: "status-change",
        recipientRole: "creator",
        actorId: 1407,
        bookingId: "booking-role-correct-creator",
        occurredAt: "2026-09-13T10:00:00.000Z",
        display: {
          title: "Accepted adjustment",
          startIso: "2026-09-21T10:00:00.000Z",
          endIso: "2026-09-21T10:30:00.000Z",
          actorName: "The creator actor",
          actorAvatar: "creator-actor.png",
          fanId: 2615,
          fanName: "Stored fan",
          fanAvatar: "stored-fan.png",
        },
      }],
      nextCursor: 1,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => identityFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    const notice = notices.find((candidate) => candidate.id === "activity-role-correct-creator");
    expect(notice.items[0].person).toEqual({
      userId: 2615,
      name: "Stored fan",
      avatar: "stored-fan.png",
    });
  });

  it("groups all open creator booking requests before the visible notice limit", async () => {
    window.FSBookingNoticeSettings.userId = 1407;
    window.FSBookingNoticeSettings.config = { refreshIntervalSeconds: 10, maxVisibleNotices: 1 };
    localStorage.setItem("fsBookingNoticeState:v1:1407", JSON.stringify({
      openActivityIds: [], openActivityTimestamps: {}, dismissedActivityIds: {},
      dailyDismissalDate: [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, "0"), String(new Date().getDate()).padStart(2, "0")].join("-"),
    }));
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
    const grouped = mountOptions.notices.find((notice) => notice.id === "notice-group|1407|booking-request||creator");
    expect(grouped).toMatchObject({
      type: "booking-request",
      heading: "You have 2 new pending bookings:",
      totalCount: 2,
      showDetail: true,
      dismissItemIds: ["activity-sooner", "activity-later"],
      action: { id: "review-bookings", label: "REVIEW", showArrow: false },
    });
    expect(grouped.items.map((item) => item.id)).toEqual(["activity-sooner", "activity-later"]);

    expect(mountOptions.notices.some((notice) => notice.id === "booking-activity-summary")).toBe(false);

    mountOptions.onClose({ noticeId: grouped.id, dismissedItemIds: grouped.dismissItemIds });
    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:1407"));
    expect(Object.keys(saved.dismissedActivityIds)).toEqual(expect.arrayContaining(grouped.dismissItemIds));
    expect(saved.openActivityIds).toEqual([]);
  });

  it("groups every repeatable standalone type without combining adjustment states", async () => {
    vi.setSystemTime(new Date(2026, 8, 16, 12, 0, 0));
    window.FSBookingNoticeSettings.config = { refreshIntervalSeconds: 10, maxVisibleNotices: 10 };
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      openActivityIds: [], openActivityTimestamps: {}, dismissedActivityIds: {}, dailyDismissalDate: "2026-09-16",
    }));
    const types = [
      "booking-confirmed",
      "booking-cancelled",
      "price-adjustment-sent",
      "price-adjustment-accepted",
      "price-adjustment-declined",
    ];
    const activities = types.flatMap((type, typeIndex) => [1, 2].map((number) => ({
      id: `${type}-${number}`,
      type,
      priority: type === "price-adjustment-sent" ? "action-required" : "status-change",
      recipientRole: "fan",
      bookingId: `${type}-booking-${number}`,
      occurredAt: new Date(2026, 8, 16, 10, typeIndex * 2 + number).toISOString(),
      display: {
        title: `${type} ${number}`,
        startIso: new Date(2026, 8, 20 + typeIndex, 10, number).toISOString(),
      },
    })));
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ ...feed, bookings: [], activities, nextCursor: activities.length }),
    })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const notices = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    expect(notices).toHaveLength(5);
    expect(notices.map((notice) => notice.heading)).toEqual(expect.arrayContaining([
      "You have 2 confirmed bookings:",
      "You have 2 cancelled bookings:",
      "You have 2 new price adjustment requests:",
      "You have 2 accepted price adjustments:",
      "You have 2 declined price adjustments:",
    ]));
    expect(notices.filter((notice) => notice.type === "price-adjustment").map((notice) => notice.priceAdjustmentState))
      .toEqual(expect.arrayContaining(["request-sent", "accepted", "declined"]));
    expect(notices.every((notice) => notice.totalCount === 2 && notice.serverActivityIds.length === 2)).toBe(true);
  });

  it("filters fan booking requests and does not consume the summary trigger for a one-item fallback", async () => {
    const request = (id, recipientRole) => ({
      id,
      type: "booking-request",
      priority: "action-required",
      recipientRole,
      bookingId: `booking-${id}`,
      occurredAt: "2026-09-13T10:00:00.000Z",
      display: { title: id, startIso: "2026-09-20T10:00:00.000Z" },
    });
    const adjustment = (id) => ({
      id,
      type: "price-adjustment-sent",
      priority: "action-required",
      recipientRole: "fan",
      bookingId: `booking-${id}`,
      occurredAt: "2026-09-13T10:00:00.000Z",
      display: { title: id, startIso: "2026-09-20T11:00:00.000Z" },
    });
    let responseData = {
      ...feed,
      bookings: [],
      activities: [request("fan-request", "fan"), request("legacy-request", ""), adjustment("adjustment-one")],
      nextCursor: 3,
    };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => responseData })));

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const initial = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0].notices;
    expect(initial).toEqual([expect.objectContaining({
      id: "adjustment-one",
      type: "price-adjustment",
      action: expect.objectContaining({ id: "review-adjustment" }),
    })]);
    let saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved.dailyDismissalDate).toBeUndefined();

    responseData = {
      ...responseData,
      activities: [...responseData.activities, adjustment("adjustment-two")],
      nextCursor: 4,
    };
    window.FSBookingNoticeCoordinator.refresh("second-summary-item");
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const updated = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value.update.mock.calls.at(-1)[0].notices;
    expect(updated).toEqual([expect.objectContaining({
      id: "booking-activity-summary",
      allItemIds: expect.arrayContaining(["adjustment-one", "adjustment-two"]),
    })]);
    saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved.summaryOpen).toBe(true);
  });

  it("keeps booking requests separate when related-change grouping is disabled", async () => {
    window.FSBookingNoticeSettings.userId = 1407;
    window.FSBookingNoticeSettings.config = { refreshIntervalSeconds: 10, groupRelatedChanges: false };
    localStorage.setItem("fsBookingNoticeState:v1:1407", JSON.stringify({
      openActivityIds: [], openActivityTimestamps: {}, dismissedActivityIds: {},
      dailyDismissalDate: [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, "0"), String(new Date().getDate()).padStart(2, "0")].join("-"),
    }));
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
    expect(notices.some((notice) => String(notice.id).startsWith("notice-group|"))).toBe(false);
  });

  it("persists only server-backed activity IDs when a notice closes", async () => {
    vi.setSystemTime(new Date(2026, 8, 16, 12, 0, 0));
    window.FSBookingNoticeSettings.dismissEndpoint = "https://example.test/wp-json/api/bookings/notices-dismiss";
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      openActivityIds: [],
      openActivityTimestamps: {},
      dismissedActivityIds: {},
      dailyDismissalDate: "2026-09-16",
    }));
    const activity = {
      id: "server-activity-close",
      type: "booking-declined",
      priority: "status-change",
      recipientRole: "fan",
      bookingId: "booking-close",
      occurredAt: new Date().toISOString(),
      display: { title: "Declined", startIso: new Date(2026, 8, 20, 10, 0, 0).toISOString() },
    };
    const fetchMock = vi.fn(async (url, options = {}) => {
      if (options.method === "POST") {
        return { ok: true, json: async () => ({ success: true, dismissedActivityIds: [activity.id] }) };
      }
      return { ok: true, json: async () => ({ ...feed, bookings: [], activities: [activity], nextCursor: 1 }) };
    });
    vi.stubGlobal("fetch", fetchMock);

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    mountOptions.onClose({ noticeId: activity.id, dismissedItemIds: [activity.id] });
    await vi.advanceTimersByTimeAsync(0);
    await vi.runAllTicks();

    const dismissalCall = fetchMock.mock.calls.find(([, options]) => options?.method === "POST");
    expect(dismissalCall?.[0]).toBe(window.FSBookingNoticeSettings.dismissEndpoint);
    expect(JSON.parse(dismissalCall?.[1]?.body)).toEqual({ activityIds: [activity.id] });
    const saved = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(saved.dismissedActivityIds[activity.id]).toBeTypeOf("number");
    expect(saved.pendingActivityDismissalIds[activity.id]).toBeUndefined();
  });

  it("keeps Ready separate and syncs only activity-backed IDs when the summary closes", async () => {
    vi.setSystemTime(new Date(2026, 8, 16, 12, 0, 0));
    window.FSBookingNoticeSettings.dismissEndpoint = "https://example.test/wp-json/api/bookings/notices-dismiss";
    const readyStart = new Date(2026, 8, 16, 12, 4, 0).toISOString();
    const todayStart = new Date(2026, 8, 16, 13, 0, 0).toISOString();
    const activities = [
      {
        id: "confirmation-ready-separate",
        type: "booking-confirmed",
        priority: "general-information",
        recipientRole: "fan",
        bookingId: "ready-booking",
        occurredAt: new Date().toISOString(),
        display: { title: "Ready booking", startIso: readyStart },
      },
      {
        id: "confirmation-events-today",
        type: "booking-confirmed",
        priority: "general-information",
        recipientRole: "fan",
        bookingId: "today-booking",
        occurredAt: new Date().toISOString(),
        display: { title: "Today booking", startIso: todayStart },
      },
      {
        id: "declined-summary-activity",
        type: "booking-declined",
        priority: "status-change",
        recipientRole: "fan",
        bookingId: "declined-booking",
        occurredAt: new Date().toISOString(),
        display: { title: "Declined booking", startIso: new Date(2026, 8, 18, 12, 0, 0).toISOString() },
      },
    ];
    const fetchMock = vi.fn(async (_url, options = {}) => {
      if (options.method === "POST") {
        const ids = JSON.parse(options.body).activityIds;
        return { ok: true, json: async () => ({ success: true, dismissedActivityIds: ids }) };
      }
      return { ok: true, json: async () => ({
        ...feed,
        activities,
        bookings: [
          { bookingId: "ready-booking", status: "confirmed", startIso: readyStart },
          { bookingId: "today-booking", status: "confirmed", startIso: todayStart },
        ],
        nextCursor: 3,
      }) };
    });
    vi.stubGlobal("fetch", fetchMock);

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const ready = mountOptions.notices.find((notice) => notice.type === "ready-to-join");
    const summary = mountOptions.notices.find((notice) => notice.id === "booking-activity-summary");
    const calculatedTodayId = summary.sections.find((section) => section.type === "events-today").items[0].id;
    expect(ready.serverActivityIds).toEqual(["confirmation-ready-separate"]);
    expect(summary.serverActivityIds).toEqual(expect.arrayContaining([
      "confirmation-events-today",
      "declined-summary-activity",
    ]));
    expect(summary.serverActivityIds).not.toContain("confirmation-ready-separate");
    expect(summary.allItemIds).toEqual(expect.arrayContaining([
      calculatedTodayId,
      "confirmation-events-today",
      "declined-summary-activity",
    ]));

    mountOptions.onClose({ noticeId: summary.id, dismissedItemIds: summary.allItemIds });
    await vi.runAllTicks();
    const dismissalCall = fetchMock.mock.calls.find(([, options]) => options?.method === "POST");
    expect(JSON.parse(dismissalCall?.[1]?.body).activityIds).toEqual(expect.arrayContaining([
      "confirmation-events-today",
      "declined-summary-activity",
    ]));
    expect(JSON.parse(dismissalCall?.[1]?.body).activityIds).not.toContain("confirmation-ready-separate");
    expect(JSON.parse(dismissalCall?.[1]?.body).activityIds).not.toContain(calculatedTodayId);
  });

  it("keeps failed activity dismissals queued and retries them on focus", async () => {
    vi.setSystemTime(new Date(2026, 8, 16, 12, 0, 0));
    window.FSBookingNoticeSettings.dismissEndpoint = "https://example.test/wp-json/api/bookings/notices-dismiss";
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      openActivityIds: [], openActivityTimestamps: {}, dismissedActivityIds: {}, dailyDismissalDate: "2026-09-16",
    }));
    const activity = {
      id: "retry-dismissal",
      type: "booking-declined",
      priority: "status-change",
      recipientRole: "fan",
      bookingId: "retry-booking",
      occurredAt: new Date().toISOString(),
      display: { title: "Retry dismissal", startIso: new Date(2026, 8, 20, 10, 0, 0).toISOString() },
    };
    let dismissalShouldFail = true;
    const fetchMock = vi.fn(async (_url, options = {}) => {
      if (options.method === "POST") {
        if (dismissalShouldFail) throw new Error("offline");
        return { ok: true, json: async () => ({ success: true, dismissedActivityIds: [activity.id] }) };
      }
      return { ok: true, json: async () => ({ ...feed, bookings: [], activities: [activity], nextCursor: 1 }) };
    });
    vi.stubGlobal("fetch", fetchMock);

    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();
    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    mountOptions.onClose({ noticeId: activity.id, dismissedItemIds: [activity.id] });
    await vi.runAllTicks();
    expect(JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10")).pendingActivityDismissalIds[activity.id]).toBeTypeOf("number");

    dismissalShouldFail = false;
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();
    expect(JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10")).pendingActivityDismissalIds[activity.id]).toBeUndefined();
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

  it("does not let a newer stale tab state erase a dismissal", async () => {
    vi.setSystemTime(new Date(2026, 8, 16, 12, 0, 0));
    let channel;
    vi.stubGlobal("BroadcastChannel", class {
      constructor() { channel = this; }
      postMessage() {}
      close() {}
    });
    localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
      openActivityIds: [],
      openActivityTimestamps: {},
      dismissedActivityIds: {},
      dailyDismissalDate: "2026-09-16",
      updatedAt: 1,
    }));
    const activity = {
      id: "cross-tab-dismissed",
      type: "booking-declined",
      priority: "status-change",
      recipientRole: "fan",
      bookingId: "booking-cross-tab-dismissed",
      occurredAt: new Date(2026, 8, 16, 10, 0, 0).toISOString(),
      display: { title: "Declined", startIso: new Date(2026, 8, 20, 10, 0, 0).toISOString() },
    };
    const activityFeed = { ...feed, bookings: [], activities: [activity], nextCursor: 1 };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => activityFeed })));
    window.eval(coordinatorSource);
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTicks();

    const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
    const controller = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
    mountOptions.onClose({ noticeId: activity.id, dismissedItemIds: [] });
    const dismissedState = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    channel.onmessage({ data: { type: "state", state: {
      openActivityIds: [activity.id],
      openActivityTimestamps: { [activity.id]: Date.now() },
      dismissedActivityIds: {},
      dailyDismissalDate: "2026-09-16",
      updatedAt: dismissedState.updatedAt + 10,
    } } });

    const repairedState = JSON.parse(localStorage.getItem("fsBookingNoticeState:v1:10"));
    expect(repairedState.dismissedActivityIds[activity.id]).toBeDefined();
    expect(controller.update.mock.calls.at(-1)[0].notices).toEqual([]);
  });

	it("scopes browser-only Lab configuration to Lab notices without changing real notices", async () => {
	  const now = new Date();
	  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
	  localStorage.setItem("fsBookingNoticeState:v1:10", JSON.stringify({
		openActivityIds: [],
		openActivityTimestamps: {},
		dismissedActivityIds: {},
		dailyDismissalDate: today,
	  }));
	  const realActivity = {
		id: "real-booking-confirmed-1",
		type: "booking-declined",
		priority: "status-change",
		recipientRole: "fan",
		bookingId: "real-booking-1",
		occurredAt: now.toISOString(),
		display: {
		  title: "Real declined booking",
		  startIso: new Date(now.getTime() + 86_400_000).toISOString(),
		},
	  };
	  vi.stubGlobal("fetch", vi.fn(async () => ({
		ok: true,
		json: async () => ({ ...feed, bookings: [], activities: [realActivity], nextCursor: 1 }),
	  })));
	  window.eval(coordinatorSource);
	  await vi.advanceTimersByTimeAsync(50);
	  await vi.runAllTicks();

	  const testAction = vi.fn();
	  window.addEventListener("FS_BOOKING_NOTICE_TEST_ACTION", testAction);
	  const shown = window.FSBookingNoticeCoordinator.showTestNotices([{
		id: "lab-booking-confirmed-1",
		type: "booking-confirmed",
		items: [{ id: "lab-item-1", bookingId: "lab-booking-1" }],
	  }], { desktopPosition: "top-left", attentionAnimation: "blink", summary: { totalLimit: 1 } });
	  expect(shown).toBe(true);

	  const mountOptions = window.FSEventsEmbed.mountBookingNotices.mock.calls[0][0];
	  const controller = window.FSEventsEmbed.mountBookingNotices.mock.results[0].value;
	  expect(controller.setConfig).toHaveBeenLastCalledWith(expect.objectContaining({
		desktopPosition: "top-right",
		attentionAnimation: "pulse",
	  }));
	  const displayed = controller.update.mock.calls.at(-1)[0].notices;
	  expect(displayed.map((notice) => notice.id)).toEqual([
		"lab-booking-confirmed-1",
		"real-booking-confirmed-1",
	  ]);
	  expect(displayed[0].config).toMatchObject({
		desktopPosition: "top-left",
		attentionAnimation: "blink",
		summary: { totalLimit: 1 },
	  });
	  expect(displayed[1].config).toBeUndefined();

	  mountOptions.onDetail({ noticeId: "lab-booking-confirmed-1", item: { id: "lab-item-1" } });
	  mountOptions.onPrimaryAction({ noticeId: "lab-booking-confirmed-1", action: { bookingId: "lab-booking-1" } });
	  expect(testAction).toHaveBeenCalled();
	  const noticesAfterLabDismissal = controller.update.mock.calls.at(-1)[0].notices;
	  expect(noticesAfterLabDismissal.map((notice) => notice.id)).toEqual([realActivity.id]);
	  expect(noticesAfterLabDismissal[0].config).toBeUndefined();
	  window.removeEventListener("FS_BOOKING_NOTICE_TEST_ACTION", testAction);
	});
});
