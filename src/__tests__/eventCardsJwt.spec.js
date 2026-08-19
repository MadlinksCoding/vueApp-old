import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("WordPress event-card JWT resolution", () => {
  beforeEach(() => {
    delete window.FanSocialEventCards;
    delete window.__FSHeroRightButtonsSlotLogic;
    window.userData = { userID: "2615", jwtToken: "jwt_runtime_fresh" };
    window.siteData = {
      bookingsBackendLambdaEndpoint: "https://bookings.example",
      tokensLambdaEndpoint: "https://tokens.example",
    };
    window.translation_strings = {};
    window.FSEventsEmbed = { openFanBookingPopup: vi.fn() };

    const source = readFileSync(
      resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/assets/shared/event-cards.js"),
      "utf8",
    );
    window.eval(source);
  });

  afterEach(() => {
    delete window.FanSocialEventCards;
    delete window.__FSHeroRightButtonsSlotLogic;
    delete window.FSEventsEmbed;
  });

  it("prefers the refreshed runtime JWT over the token captured at initialization", () => {
    window.FanSocialEventCards.openBookingPopupForEvent({
      eventId: "evt_123",
      creatorId: 1407,
    }, {
      creatorId: 1407,
      currentFanId: 2615,
      jwtToken: "jwt_initial_stale",
    });

    expect(window.FSEventsEmbed.openFanBookingPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorId: 1407,
        fanId: 2615,
        eventId: "evt_123",
        jwtToken: "jwt_runtime_fresh",
      }),
    );
  });
});
