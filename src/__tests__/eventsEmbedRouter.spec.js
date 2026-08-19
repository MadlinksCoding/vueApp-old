import { describe, expect, it } from "vitest";

describe("events embed router", () => {
  it("routes booking-details bootstrap directly to the focused details page", async () => {
    const { default: router, routeLocationFromInitialRoute } = await import("@/embeds/events/router.js");

    expect(routeLocationFromInitialRoute("booking-details")).toEqual({
      name: "events-embed-booking-details",
    });
    expect(router.getRoutes().some((route) => route.name === "events-embed-booking-details")).toBe(true);
  });

  it("keeps unknown initial routes on the normal events dashboard", async () => {
    const { routeLocationFromInitialRoute } = await import("@/embeds/events/router.js");
    expect(routeLocationFromInitialRoute("unknown")).toEqual({ name: "events-embed-events" });
  });
});
