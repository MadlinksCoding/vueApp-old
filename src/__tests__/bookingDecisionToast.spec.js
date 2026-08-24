import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatBookingDecisionSchedule,
  showBookingDecisionToast,
} from "@/utils/bookingDecisionToast.js";
import { bookingT } from "@/i18n/bookingTranslations.js";

const mocks = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock("@/utils/toastBus.js", () => ({ showToast: mocks.showToast }));

const t = bookingT;

const CONFIRMED = {
  bookingId: "booking_1",
  status: "confirmed",
  startAtIso: "2026-08-24T15:00:00.000Z",
  endAtIso: "2026-08-24T15:05:00.000Z",
};

function cancelled(extra = {}) {
  return { ...CONFIRMED, status: "cancelled_user", ...extra };
}

function installHost() {
  const showToast = vi.fn();
  // The embed reaches the dashboard toast through its parent window.
  vi.spyOn(window, "parent", "get").mockReturnValue({ showToast });
  return showToast;
}

describe("formatBookingDecisionSchedule", () => {
  it("matches the dashboard's day-month-year and 12-hour range", () => {
    expect(formatBookingDecisionSchedule(CONFIRMED.startAtIso, CONFIRMED.endAtIso, "en-US"))
      .toMatch(/^24-08-2026 \d{2}:\d{2} [AP]M-\d{2}:\d{2} [AP]M$/);
  });

  it("returns nothing when either boundary is unusable", () => {
    expect(formatBookingDecisionSchedule("", CONFIRMED.endAtIso)).toBe("");
    expect(formatBookingDecisionSchedule(CONFIRMED.startAtIso, "not-a-date")).toBe("");
  });
});

describe("showBookingDecisionToast", () => {
  beforeEach(() => {
    mocks.showToast.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("raises the confirmation on the host when one is available", () => {
    const hostToast = installHost();

    expect(showBookingDecisionToast({
      decision: "confirmed",
      booking: CONFIRMED,
      counterpartyName: "nhs0801",
      counterpartyAvatarUrl: "https://example.test/creator.webp",
      t,
      locale: "en-US",
    })).toBe(true);

    expect(mocks.showToast).not.toHaveBeenCalled();
    const [message, type, duration, options] = hostToast.mock.calls[0];
    expect(type).toBe("success");
    expect(duration).toBe(-1);
    expect(options.title).toBe("Your session with nhs0801 is confirmed!");
    expect(message).toContain("24-08-2026");
    expect(options.icon_url).toBe("https://example.test/creator.webp");
    expect(options.small_icon_name).toBe("check");
    expect(options.new_dashboard).toBe(true);
  });

  it.each([
    ["full", { paymentStatus: "refunded" }, "Your session with nhs0801 has been cancelled and refunded"],
    ["partial", { paymentStatus: "partially_refunded" }, "Your session with nhs0801 has been cancelled and partially refunded"],
    ["none", {}, "Your session with nhs0801 has been cancelled"],
  ])("uses the %s-refund cancellation copy", (_label, refundFields, expectedTitle) => {
    const hostToast = installHost();

    showBookingDecisionToast({
      decision: "cancelled",
      booking: cancelled(refundFields),
      counterpartyName: "nhs0801",
      t,
      locale: "en-US",
    });

    const [, type, , options] = hostToast.mock.calls[0];
    expect(type).toBe("destructive");
    expect(options.title).toBe(expectedTitle);
    expect(options.small_icon_name).toBe("x-close");
    // The chat bubble already links to the booking.
    expect(options.show_cta).toBe(false);
    expect(options.link).toBe("");
  });

  it("drops the schedule from the copy when the booking has no usable range", () => {
    const hostToast = installHost();

    showBookingDecisionToast({
      decision: "cancelled",
      booking: { bookingId: "booking_1", paymentStatus: "refunded" },
      counterpartyName: "nhs0801",
      t,
    });

    expect(hostToast.mock.calls[0][0]).toBe("Your session has been cancelled and refunded.");
  });

  it("falls back to the in-app toast without a host", () => {
    vi.spyOn(window, "parent", "get").mockReturnValue(window);

    expect(showBookingDecisionToast({
      decision: "cancelled",
      booking: cancelled({ paymentStatus: "refunded" }),
      counterpartyName: "nhs0801",
      t,
      locale: "en-US",
    })).toBe(true);

    expect(mocks.showToast).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      status: "declined",
      title: "Your session with nhs0801 has been cancelled and refunded",
      persistent: true,
    }));
  });

  it("names an unknown counterparty rather than leaving the copy blank", () => {
    const hostToast = installHost();

    showBookingDecisionToast({ decision: "confirmed", booking: CONFIRMED, t, locale: "en-US" });

    expect(hostToast.mock.calls[0][1]).toBe("success");
    expect(hostToast.mock.calls[0][3].title).toContain("Creator");
  });

  it("escapes counterparty text before it reaches the host's markup", () => {
    const hostToast = installHost();

    showBookingDecisionToast({
      decision: "confirmed",
      booking: CONFIRMED,
      counterpartyName: '<img src=x onerror="alert(1)">',
      t,
      locale: "en-US",
    });

    expect(hostToast.mock.calls[0][3].title).not.toContain("<img");
    expect(hostToast.mock.calls[0][3].title).toContain("&lt;img");
  });
});
