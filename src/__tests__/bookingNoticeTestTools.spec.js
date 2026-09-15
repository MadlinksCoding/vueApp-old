import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const source = readFileSync(resolve(
  process.cwd(),
  "../wp/wp-content/plugins/fansocial/assets/js/booking-notice-test-tools.js",
), "utf8");

describe("WordPress booking notice test tools", () => {
  let coordinator;

  beforeEach(() => {
    localStorage.clear();
	sessionStorage.clear();
    history.replaceState({}, "", "/dashboard/overview/?fs-notice-test=1&fs-notice-mode=feed");
    coordinator = {
      showTestNotices: vi.fn(() => true),
      clearTestNotices: vi.fn(),
      prepareTestFeed: vi.fn(),
      clearTestPresentation: vi.fn(),
      refresh: vi.fn(),
    };
    window.FSBookingNoticeCoordinator = coordinator;
    window.FSBookingNoticeTestSettings = {
      enabled: true,
      role: "fan",
      userId: 10,
      nonce: "nonce",
      generateEndpoint: "/wp-json/api/bookings/notices-test/generate",
      clearEndpoint: "/wp-json/api/bookings/notices-test/clear",
      labUrl: "/wp-content/plugins/fansocial/bookings-embed/notices-lab.html",
    };
  });

  afterEach(() => {
    document.querySelector(".fs-booking-notice-test-panel")?.remove();
    document.querySelector("style[data-fs-booking-notice-test-tools]")?.remove();
    delete window.FSBookingNoticeCoordinator;
    delete window.FSBookingNoticeTestSettings;
    vi.unstubAllGlobals();
	vi.useRealTimers();
    history.replaceState({}, "", "/");
	sessionStorage.clear();
  });

  it("loads a saved browser preview on the actual WordPress page", () => {
    localStorage.setItem("fsBookingNoticePreview:v1", JSON.stringify({
      expiresAt: Date.now() + 60000,
      notices: [{ id: "lab-booking-confirmed-1", type: "booking-confirmed" }],
      config: { attentionAnimation: "pulse" },
    }));
    window.eval(source);
	expect(Number(sessionStorage.getItem("fsBookingNoticeTestTools:v1"))).toBeGreaterThan(Date.now());

    document.querySelector("[data-preview]").click();
    expect(coordinator.showTestNotices).toHaveBeenCalledWith(
      [expect.objectContaining({ id: "lab-booking-confirmed-1" })],
      expect.objectContaining({ attentionAnimation: "pulse" }),
    );
  });

  it("generates and clears temporary feed fixtures through guarded endpoints", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async (_url, options) => ({
      ok: true,
      json: async () => options.method === "DELETE"
        ? { success: true, deleted: 3 }
        : { success: true, generatedActivityIds: ["test-1"], readyFixtureCount: 0 },
    }));
    vi.stubGlobal("fetch", fetchMock);
    window.eval(source);

    const type = document.querySelector("[data-test-type]");
    type.value = "booking-confirmed";
    document.querySelector("[data-generate]").click();
    await vi.runAllTicks();
    await vi.advanceTimersByTimeAsync(300);

    expect(fetchMock).toHaveBeenCalledWith(
      "/wp-json/api/bookings/notices-test/generate",
      expect.objectContaining({ method: "POST" }),
    );
    expect(coordinator.prepareTestFeed).toHaveBeenCalledWith(false);
    expect(coordinator.refresh).toHaveBeenCalled();

    document.querySelector("[data-clear]").click();
	await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledWith(
      "/wp-json/api/bookings/notices-test/clear",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(coordinator.clearTestPresentation).toHaveBeenCalled();
  });

  it("clearly identifies generated records as simulations rather than end-to-end bookings", () => {
    window.eval(source);
    expect(document.querySelector(".fs-booking-notice-test-panel").textContent).toContain("Visual/feed testing only");
    expect(document.querySelector("[data-generate]").textContent).toBe("Simulate stored notice");
  });
});
