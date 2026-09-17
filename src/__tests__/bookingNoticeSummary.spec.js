import { describe, expect, it } from "vitest";
import {
  BOOKING_NOTICE_PRIORITIES,
  BOOKING_NOTICE_TYPES,
  DEFAULT_BOOKING_NOTICE_CONFIG,
  resolveBookingNoticeConfig,
} from "@/components/ui/card/event/bookingNoticeConfig";
import {
  buildBookingNoticeSummary,
  dismissSummary,
  getSummaryDismissedItemIds,
  markSummaryOpen,
  shouldShowStandaloneNotice,
  shouldShowSummary,
} from "@/components/ui/card/event/bookingNoticeSummary";

const item = (id, eventAt, occurredAt = eventAt) => ({ id, eventAt, occurredAt });

describe("booking notice configuration", () => {
  it("provides the agreed defaults and supports per-type overrides", () => {
    const config = resolveBookingNoticeConfig(BOOKING_NOTICE_TYPES.READY_TO_JOIN, {
      durationSeconds: 8,
      summary: { totalLimit: 9 },
      noticeTypes: {
        [BOOKING_NOTICE_TYPES.READY_TO_JOIN]: { durationSeconds: 2, attentionAnimation: "blink" },
      },
    });

    expect(DEFAULT_BOOKING_NOTICE_CONFIG.desktopPosition).toBe("top-right");
    expect(DEFAULT_BOOKING_NOTICE_CONFIG.mobilePosition).toBe("top");
    expect(DEFAULT_BOOKING_NOTICE_CONFIG.summary.desktopPosition).toBe("top-right");
    expect(DEFAULT_BOOKING_NOTICE_CONFIG.summary.mobilePosition).toBe("bottom");
    expect(DEFAULT_BOOKING_NOTICE_CONFIG.summary.sectionOrder.slice(0, 2)).toEqual([
      BOOKING_NOTICE_TYPES.EVENTS_TODAY,
      BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
    ]);
    expect(DEFAULT_BOOKING_NOTICE_CONFIG.summary.priorityOrder.slice(0, 2)).toEqual([
      BOOKING_NOTICE_PRIORITIES.READY,
      BOOKING_NOTICE_PRIORITIES.TODAY,
    ]);
    expect(DEFAULT_BOOKING_NOTICE_CONFIG.durationSeconds).toBe(0);
    expect(config.durationSeconds).toBe(2);
    expect(config.attentionAnimation).toBe("blink");
    expect(config.summary.perSectionLimit).toBe(3);
    expect(config.summary.totalLimit).toBe(9);
  });
});

describe("buildBookingNoticeSummary", () => {
  it("preserves split price-adjustment variants while applying base-type limits", () => {
    const summary = buildBookingNoticeSummary([
      { id: "price:sent", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "request-sent", items: [item("sent", "2026-04-25")] },
      { id: "price:accepted", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "accepted", priority: BOOKING_NOTICE_PRIORITIES.STATUS, items: [item("accepted", "2026-04-26")] },
      { id: "price:declined", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "declined", priority: BOOKING_NOTICE_PRIORITIES.STATUS, items: [item("declined", "2026-04-27")] },
    ], { sectionLimits: { [BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT]: 1 }, totalLimit: 3 });

    expect(summary.sections.map((section) => section.variant)).toEqual(["request-sent", "accepted", "declined"]);
    expect(summary.sections.every((section) => section.items.length === 1)).toBe(true);
  });

  it("shows full counts, applies both limits, and returns one combined overflow", () => {
    const summary = buildBookingNoticeSummary([
      {
        type: BOOKING_NOTICE_TYPES.EVENTS_TODAY,
        label: "Events today",
        totalCount: 4,
        sort: "soonest-first",
        items: [item("confirmed-late", "2026-04-25T15:00:00"), item("confirmed-early", "2026-04-25T10:00:00")],
      },
      {
        type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
        label: "Pending",
        totalCount: 5,
        sort: "oldest-first",
        items: [
          item("pending-2", "2026-04-26T12:00:00", "2026-04-20T11:00:00"),
          item("pending-1", "2026-04-25T12:00:00", "2026-04-20T09:00:00"),
          item("pending-3", "2026-04-27T12:00:00", "2026-04-20T12:00:00"),
          item("pending-4", "2026-04-28T12:00:00", "2026-04-20T13:00:00"),
        ],
      },
    ], { perSectionLimit: 3, totalLimit: 4 });

    expect(summary.totalCount).toBe(9);
    expect(summary.visibleCount).toBe(4);
    expect(summary.hiddenCount).toBe(5);
    expect(summary.overflowText).toBe("and 5 more");
    expect(summary.sections[0].type).toBe(BOOKING_NOTICE_TYPES.EVENTS_TODAY);
    expect(summary.sections[0].totalCount).toBe(4);
    expect(summary.sections[0].items.map(({ id }) => id)).toEqual(["confirmed-early", "confirmed-late"]);
    expect(summary.sections[1].items.map(({ id }) => id)).toEqual(["pending-1", "pending-2"]);
    expect(summary.allItemIds).toEqual([
      "confirmed-early", "confirmed-late", "pending-1", "pending-2", "pending-3", "pending-4",
    ]);
  });

  it("reveals up to ten more items while keeping the configured order", () => {
    const pending = Array.from({ length: 13 }, (_, index) => item(`pending-${index + 1}`, `2026-04-${String(index + 1).padStart(2, "0")}`));
    const confirmed = Array.from({ length: 13 }, (_, index) => item(`confirmed-${index + 1}`, `2026-05-${String(index + 1).padStart(2, "0")}`));
    const sections = [
      { type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST, label: "Pending", items: pending },
      { type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, label: "Events today", items: confirmed },
    ];

    const initial = buildBookingNoticeSummary(sections, { perSectionLimit: 3, totalLimit: 6 });
    const expandedOnce = buildBookingNoticeSummary(
      sections,
      { perSectionLimit: 3, totalLimit: 6 },
      { additionalVisibleItems: 10 },
    );
    const expandedTwice = buildBookingNoticeSummary(
      sections,
      { perSectionLimit: 3, totalLimit: 6 },
      { additionalVisibleItems: 20 },
    );

    expect(initial.visibleCount).toBe(6);
    expect(initial.hiddenCount).toBe(20);
    expect(expandedOnce.visibleCount).toBe(16);
    expect(expandedOnce.hiddenCount).toBe(10);
    expect(expandedTwice.visibleCount).toBe(26);
    expect(expandedTwice.hiddenCount).toBe(0);
  });

  it("excludes ready-to-join items and fan pending requests from summary content", () => {
    const sections = [
      { type: BOOKING_NOTICE_TYPES.READY_TO_JOIN, label: "Ready", items: [item("ready-1", "2026-04-25")] },
      { type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, label: "Events today", items: [item("today-1", "2026-04-25")] },
      { type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST, label: "Pending", items: [item("pending-1", "2026-04-25")] },
    ];

    const creator = buildBookingNoticeSummary(sections, { totalLimit: 3 }, { viewerRole: "creator" });
    const fan = buildBookingNoticeSummary(sections, { totalLimit: 3 }, { viewerRole: "fan" });

    expect(creator.allItemIds).toEqual(["today-1", "pending-1"]);
    expect(fan.allItemIds).toEqual(["today-1"]);
  });

  it("suppresses and dismisses every contained item, including hidden overflow and represented activities", () => {
    const summary = buildBookingNoticeSummary([
      {
        type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
        label: "Confirmed",
        items: [item("confirmed-visible", "2026-04-25"), item("confirmed-hidden", "2026-04-26")],
      },
      {
        type: BOOKING_NOTICE_TYPES.EVENTS_TODAY,
        label: "Events today",
        items: [{ ...item("today-hidden", "2026-04-27"), representedActivityIds: ["info-hidden"] }],
      },
    ], { totalLimit: 1 });

    expect(shouldShowStandaloneNotice({ id: "confirmed-visible", type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED }, summary)).toBe(false);
    expect(shouldShowStandaloneNotice({ id: "confirmed-hidden", type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED }, summary)).toBe(false);
    expect(shouldShowStandaloneNotice({ id: "info-hidden", type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED }, summary)).toBe(false);
    expect(shouldShowStandaloneNotice({ id: "action-hidden", priority: BOOKING_NOTICE_PRIORITIES.ACTION }, summary)).toBe(true);
    expect(shouldShowStandaloneNotice({
      id: "synthetic-group-id",
      type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
      items: [{ id: "confirmed-visible" }, { id: "confirmed-hidden" }],
    }, summary)).toBe(false);
    expect(getSummaryDismissedItemIds(summary)).toEqual([
      "today-hidden",
      "info-hidden",
      "confirmed-visible",
      "confirmed-hidden",
    ]);
  });

  it("falls back to the complete visible and hidden set for older summary data", () => {
    expect(getSummaryDismissedItemIds({
      visibleItemIds: ["visible", "represented"],
      hiddenItemIds: ["hidden", "represented"],
    })).toEqual(["visible", "represented", "hidden"]);
  });
});

describe("summary trigger state", () => {
  const now = new Date(2026, 3, 25, 10, 0, 0);

  it("keeps an open summary eligible and ignores an empty hidden summary", () => {
    expect(shouldShowSummary({ state: { isOpen: true }, now })).toBe(true);
    expect(shouldShowSummary({ state: {}, now, hasContent: false })).toBe(false);
  });

  it("handles once-per-day dismissal using the local calendar day", () => {
    const open = markSummaryOpen({}, now);
    const dismissed = dismissSummary({ state: open, settings: { trigger: "once-per-day" }, now });
    expect(shouldShowSummary({ state: dismissed, settings: { trigger: "once-per-day" }, now })).toBe(false);
    expect(shouldShowSummary({ state: dismissed, settings: { trigger: "once-per-day" }, now: new Date(2026, 3, 26, 0, 1) })).toBe(true);
  });

  it("handles every-login and every-X-minutes from dismissal", () => {
    const loginState = dismissSummary({ state: {}, settings: { trigger: "every-login" }, now, sessionId: "login-a" });
    expect(shouldShowSummary({ state: loginState, settings: { trigger: "every-login" }, now, sessionId: "login-a" })).toBe(false);
    expect(shouldShowSummary({ state: loginState, settings: { trigger: "every-login" }, now, sessionId: "login-b" })).toBe(true);

    const intervalState = dismissSummary({ state: {}, settings: { trigger: "every-x-minutes" }, now });
    expect(shouldShowSummary({ state: intervalState, settings: { trigger: "every-x-minutes", intervalMinutes: 60 }, now: new Date(now.getTime() + 59 * 60_000) })).toBe(false);
    expect(shouldShowSummary({ state: intervalState, settings: { trigger: "every-x-minutes", intervalMinutes: 60 }, now: new Date(now.getTime() + 60 * 60_000) })).toBe(true);
  });
});
