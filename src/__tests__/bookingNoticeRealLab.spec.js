import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const source = readFileSync(resolve(
  process.cwd(),
  "../wp/wp-content/plugins/fansocial/assets/js/booking-notice-real-lab.js",
), "utf8");

describe("WordPress real-data booking notice lab", () => {
  let coordinator;

  beforeEach(() => {
    document.body.innerHTML = `
      <main data-real-lab-root>
        <section data-account></section><div data-scenarios></div><div data-runs></div>
        <button data-prepare-standalone></button><button data-prepare-summary></button>
        <button data-clean-all></button><button data-refresh></button>
      </main>`;
    coordinator = {
      prepareRealLabFeed: vi.fn(),
      clearRealLabPresentation: vi.fn(),
      refresh: vi.fn(),
    };
    window.FSBookingNoticeCoordinator = coordinator;
    window.FSBookingNoticeRealLabSettings = {
      enabled: true,
      nonce: "nonce",
      runsEndpoint: "/wp-json/api/bookings/notices-real-lab/runs",
      currentUser: { id: 1407, role: "creator", displayName: "Creator" },
    };
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete window.FSBookingNoticeCoordinator;
    delete window.FSBookingNoticeRealLabSettings;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders every real scenario and prepares standalone or summary presentation", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, preflight: { ok: true }, runs: [] }),
    })));
    window.eval(source);
    await vi.waitFor(() => expect(document.querySelectorAll("[data-scenario]")).toHaveLength(8));

    expect(document.body.textContent).toContain("New booking request");
    expect(document.body.textContent).toContain("Build creator and fan summaries");
    document.querySelector("[data-prepare-standalone]").click();
    document.querySelector("[data-prepare-summary]").click();
    expect(coordinator.prepareRealLabFeed).toHaveBeenNthCalledWith(1, [], false);
    expect(coordinator.prepareRealLabFeed).toHaveBeenNthCalledWith(2, [], true);
  });

  it("creates a run and advances it until the real webhook-backed scenario completes", async () => {
    vi.useFakeTimers();
    const created = {
      id: "real-lab-run", scenario: "booking-request", status: "ready", phase: "create-event",
      message: "Ready", eventId: "", bookings: [], expectedActivities: [], observedActivityIds: [], updatedAt: new Date().toISOString(),
    };
    const complete = {
      ...created, status: "complete", phase: "complete", eventId: "evt_real",
      bookings: [{ bookingId: "booking_real" }], expectedActivities: [{ bookingId: "booking_real" }], observedActivityIds: ["activity-real"],
    };
    const fetchMock = vi.fn(async (_url, options = {}) => ({
      ok: true,
      json: async () => options.method === "POST" && String(_url).endsWith("/advance")
        ? { success: true, run: complete }
        : options.method === "POST"
          ? { success: true, run: created }
          : { success: true, runs: [] },
    }));
    vi.stubGlobal("fetch", fetchMock);
    window.eval(source);
    await vi.runAllTicks();
    document.querySelector("[data-scenario='booking-request']").click();
    await vi.runAllTicks();
    await vi.advanceTimersByTimeAsync(300);

    expect(fetchMock).toHaveBeenCalledWith(
      "/wp-json/api/bookings/notices-real-lab/runs",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ scenario: "booking-request" }) }),
    );
    expect(coordinator.prepareRealLabFeed).toHaveBeenCalledWith(["activity-real"], false);
    expect(document.body.textContent).toContain("evt_real");
    expect(document.body.textContent).toContain("booking_real");
  });
});
