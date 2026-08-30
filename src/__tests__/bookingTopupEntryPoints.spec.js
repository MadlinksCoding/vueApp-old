import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("price-adjustment top-up entry points", () => {
  it.each([
    ["events dashboard", "src/features/events/DashboardEventsFeature.vue", "resumePendingPriceAdjustment"],
    ["booking-details iframe", "src/embeds/events/pages/EventsEmbedBookingDetailsPage.vue", "resumePendingTopupAdjustment"],
    ["chat", "src/components/ui/chat/ChatWindow.vue", "resumePendingChatTopup"],
  ])("gates %s confirmation on the shared balance readiness coordinator", (_name, relativePath, resumeFunction) => {
    const contents = source(relativePath);

    expect(contents).toContain("resumePriceAdjustmentAfterTopup");
    expect(contents).toContain("requiredBalanceTokens");
    expect(contents).toContain(`@retry-after-topup=\"${resumeFunction}\"`);
    expect(contents).toContain(`void ${resumeFunction}()`);
  });

  it.each(["fs-chat-host.js", "fs-events-host.js"])(
    "keeps the packaged WordPress %s byte-for-byte aligned with the frontend host",
    (filename) => {
      const frontendHost = source(`public/bookings-embed/${filename}`);
      const wordpressHost = source(`../wp/wp-content/plugins/fansocial/bookings-embed/${filename}`);

      expect(wordpressHost).toBe(frontendHost);
      expect(frontendHost).toContain("successCallback: async function ()");
      expect(frontendHost).toContain("await queueTokenBalanceUiRefresh({");
    },
  );
});
