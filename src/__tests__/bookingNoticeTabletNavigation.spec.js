import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const eventsPageSource = readFileSync(resolve(
  process.cwd(),
  "../wp/wp-content/plugins/fansocial/assets/dashboard-v2/js/pages/events.js",
), "utf8");

describe("booking notice tablet navigation", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="fs-bookings-translations" data-translations="{}"></div>
      <div id="fs-bookings-embed"></div>
    `;
    window.history.replaceState({}, "", "/dashboard/events/");
    window.sessionStorage.setItem("fsBookingNoticeReviewIntent", JSON.stringify({
      action: "review-pending",
      createdAt: Date.now(),
    }));
    window.userData = {
      accountType: "creator",
      userID: "1407",
      jwtToken: "jwt",
      userAvatar: "",
      userDisplayName: "Creator",
    };
    window.siteData = {
      bookingsBackendLambdaEndpoint: "https://bookings.test",
      tokensLambdaEndpoint: "https://tokens.test",
    };
    window.getTheLocale = () => "en";
    window.FSEventsEmbed = { mount: vi.fn(() => ({ destroy: vi.fn() })) };
  });

  it("passes the one-time Pending-review action into the Events iframe and cleans the URL", () => {
    window.eval(eventsPageSource);

    expect(window.FSEventsEmbed.mount).toHaveBeenCalledWith(
      "#fs-bookings-embed",
      expect.objectContaining({
        creatorId: 1407,
        userRole: "creator",
        initialRoute: "events",
        initialAction: "review-pending",
      }),
    );
    expect(window.location.pathname).toBe("/dashboard/events/");
    expect(window.location.search).toBe("");
    expect(window.sessionStorage.getItem("fsBookingNoticeReviewIntent")).toBeNull();
  });
});
