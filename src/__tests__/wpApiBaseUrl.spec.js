import { describe, expect, it, vi } from "vitest";
import { buildScheduledMeetingUrl, buildScheduledGroupMeetingUrl, getBookingJoinState } from "@/utils/bookingJoinUtils.js";

import {
  buildWpApiUrl,
  normalizeWpSiteBaseUrl,
  resolveWpSiteBaseUrl,
} from "@/utils/wpApiBaseUrl.js";

describe("wpApiBaseUrl", () => {
  it("normalizes trailing slashes and invalid string values", () => {
    expect(normalizeWpSiteBaseUrl("https://fansocial.app///")).toBe("https://fansocial.app");
    expect(normalizeWpSiteBaseUrl(" undefined ")).toBe("");
    expect(normalizeWpSiteBaseUrl("null")).toBe("");
  });

  it("prefers the configured env value when present", () => {
    expect(resolveWpSiteBaseUrl({
      envValue: "https://fansocial.app/",
      origin: "https://site.com",
    })).toBe("https://fansocial.app");
  });

  it("keeps WordPress embeds on their serving host even with a production build URL", () => {
    const options = {
      envValue: "https://fansocial.app",
      origin: "https://fansocial.local",
      pathname: "/wp-content/plugins/fansocial/bookings-embed/fan-booking.html",
    };
    expect(resolveWpSiteBaseUrl(options)).toBe("https://fansocial.local");
    expect(buildWpApiUrl("bookings/create", options)).toBe("https://fansocial.local/wp-json/api/bookings/create");
    expect(resolveWpSiteBaseUrl({ ...options, pathname: "/dashboard/" })).toBe("https://fansocial.app");
  });

  it("uses the embedded WordPress origin for default booking and creator join links", () => {
    vi.stubEnv("VITE_WEB_BASE_URL", "https://fansocial.app");
    vi.stubGlobal("window", { location: {
      origin: "https://fansocial.local",
      pathname: "/wp-content/plugins/fansocial/bookings-embed/dashboard.html",
    } });
    try {
      expect(buildScheduledMeetingUrl("b_test")).toBe("https://fansocial.local/scheduled-meeting/?booking_id=b_test");
      expect(buildScheduledGroupMeetingUrl({ eventId: "evt_test", startIso: "2026-10-14T08:30:00Z" })).toMatch(/^https:\/\/fansocial\.local\/scheduled-meeting\//);
      expect(getBookingJoinState({ bookingId: "b_test", startAt: "2026-10-14T08:30:00Z", endAt: "2026-10-14T11:30:00Z", status: "confirmed", now: "2026-10-14T09:00:00Z" }).joinUrl).toBe("https://fansocial.local/scheduled-meeting/?booking_id=b_test");
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });

  it("falls back to browser origin when env is missing or invalid", () => {
    expect(resolveWpSiteBaseUrl({
      envValue: "",
      origin: "https://site.com/",
    })).toBe("https://site.com");

    expect(resolveWpSiteBaseUrl({
      envValue: "undefined",
      origin: "https://site.com/",
    })).toBe("https://site.com");
  });

  it("builds wp-json api URLs without undefined or null path segments", () => {
    expect(buildWpApiUrl("/subscriptions/plans/list", {
      envValue: "undefined",
      origin: "https://site.com/",
    })).toBe("https://site.com/wp-json/api/subscriptions/plans/list");

    expect(buildWpApiUrl("users/search", {
      envValue: "null",
      origin: "https://site.com/",
    })).toBe("https://site.com/wp-json/api/users/search");
  });
});
