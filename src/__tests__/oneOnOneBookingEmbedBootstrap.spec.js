import { beforeEach, describe, expect, it, vi } from "vitest";

describe("one-on-one booking embed bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    window.history.replaceState({}, "", "/");
  });

  it("normalizes bootstrap payloads from the parent page", async () => {
    const {
      applyOneOnOneBookingBootstrap,
      useOneOnOneBookingBootstrap,
    } = await import("@/embeds/fanBooking/bootstrap.js");

    applyOneOnOneBookingBootstrap({
      creatorId: "1407",
      fanId: "25",
      eventId: "evt_123",
      apiBaseUrl: "https://api.example.com",
      jwtToken: "jwt_abc",
      creatorData: {
        avatar: "https://example.com/avatar.webp",
        name: "Creator Name",
        isVerified: true,
      },
    });

    const state = useOneOnOneBookingBootstrap();
    expect(state.creatorId).toBe(1407);
    expect(state.fanId).toBe(25);
    expect(state.eventId).toBe("evt_123");
    expect(state.apiBaseUrl).toBe("https://api.example.com");
    expect(state.jwtToken).toBe("jwt_abc");
    expect(state.creatorData).toEqual({
      avatar: "https://example.com/avatar.webp",
      name: "Creator Name",
      isVerified: true,
    });
    expect(state.bootstrapped).toBe(true);
  });

  it("reads fallback bootstrap data from URL params", async () => {
    window.history.replaceState(
      {},
      "",
      "/?creatorId=1407&fanId=25&eventId=evt_query&apiBaseUrl=https%3A%2F%2Fapi.example.com&jwtToken=jwt_query&creatorAvatar=https%3A%2F%2Fexample.com%2Favatar.webp&creatorName=Creator%20Name&creatorVerified=true",
    );

    const { readOneOnOneBookingBootstrapFromUrl } = await import("@/embeds/fanBooking/bootstrap.js");
    const bootstrap = readOneOnOneBookingBootstrapFromUrl();

    expect(bootstrap).toEqual({
      creatorId: 1407,
      fanId: 25,
      eventId: "evt_query",
      apiBaseUrl: "https://api.example.com",
      jwtToken: "jwt_query",
      creatorData: {
        avatar: "https://example.com/avatar.webp",
        name: "Creator Name",
        isVerified: true,
      },
      translations: {},
      locale: "en",
    });
  });

  it("accepts fanId 0 while still requiring a positive creator id", async () => {
    const {
      applyOneOnOneBookingBootstrap,
      useOneOnOneBookingBootstrap,
    } = await import("@/embeds/fanBooking/bootstrap.js");

    applyOneOnOneBookingBootstrap({
      creatorId: 0,
      fanId: "0",
      apiBaseUrl: "https://api.example.com",
      jwtToken: "jwt_invalid",
    });

    const state = useOneOnOneBookingBootstrap();
    expect(state.creatorId).toBe(null);
    expect(state.fanId).toBe(0);
    expect(state.apiBaseUrl).toBe("https://api.example.com");
    expect(state.jwtToken).toBe("jwt_invalid");
    expect(state.bootstrapped).toBe(false);
  });

  it("bootstraps guest popups from URL params with fanId 0", async () => {
    window.history.replaceState(
      {},
      "",
      "/?creatorId=1407&fanId=0&apiBaseUrl=https%3A%2F%2Fapi.example.com",
    );

    const { readOneOnOneBookingBootstrapFromUrl } = await import("@/embeds/fanBooking/bootstrap.js");
    const bootstrap = readOneOnOneBookingBootstrapFromUrl();

    expect(bootstrap).toEqual(expect.objectContaining({
      creatorId: 1407,
      fanId: 0,
      apiBaseUrl: "https://api.example.com",
    }));
  });

  it("still marks the popup bootstrapped when backend JWT caching throws", async () => {
    vi.doMock("@/utils/backendJwt.js", () => ({
      setBackendJwtToken: vi.fn(() => {
        throw new ReferenceError("Cannot access '_e' before initialization");
      }),
    }));

    const {
      applyOneOnOneBookingBootstrap,
      useOneOnOneBookingBootstrap,
    } = await import("@/embeds/fanBooking/bootstrap.js");

    applyOneOnOneBookingBootstrap({
      creatorId: 1407,
      fanId: 2615,
      apiBaseUrl: "https://api.example.com",
      jwtToken: "jwt_live",
    });

    const state = useOneOnOneBookingBootstrap();
    expect(state.creatorId).toBe(1407);
    expect(state.fanId).toBe(2615);
    expect(state.jwtToken).toBe("jwt_live");
    expect(state.bootstrapped).toBe(true);
  });

  it("applies auth updates without clearing existing creator context", async () => {
    const {
      applyOneOnOneBookingAuthUpdate,
      applyOneOnOneBookingBootstrap,
      useOneOnOneBookingBootstrap,
    } = await import("@/embeds/fanBooking/bootstrap.js");

    applyOneOnOneBookingBootstrap({
      creatorId: 1407,
      fanId: 0,
      apiBaseUrl: "https://api.example.com",
    });

    applyOneOnOneBookingAuthUpdate({
      fanId: 2615,
      jwtToken: "jwt_live",
    });

    const state = useOneOnOneBookingBootstrap();
    expect(state.creatorId).toBe(1407);
    expect(state.fanId).toBe(2615);
    expect(state.jwtToken).toBe("jwt_live");
    expect(state.bootstrapped).toBe(true);
  });

  it("can clear auth without losing popup bootstrap context", async () => {
    const {
      applyOneOnOneBookingAuthUpdate,
      applyOneOnOneBookingBootstrap,
      useOneOnOneBookingBootstrap,
    } = await import("@/embeds/fanBooking/bootstrap.js");

    applyOneOnOneBookingBootstrap({
      creatorId: 1407,
      fanId: 2615,
      jwtToken: "jwt_live",
    });

    applyOneOnOneBookingAuthUpdate({
      fanId: 0,
      jwtToken: "",
    });

    const state = useOneOnOneBookingBootstrap();
    expect(state.creatorId).toBe(1407);
    expect(state.fanId).toBe(0);
    expect(state.jwtToken).toBe("");
    expect(state.bootstrapped).toBe(true);
  });
});
