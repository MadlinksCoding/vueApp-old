import { describe, expect, it, vi, beforeEach } from "vitest";

describe("events embed bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    window.history.replaceState({}, "", "/");
  });

  it("normalizes bootstrap payloads from the parent page", async () => {
    const {
      applyEventsEmbedBootstrap,
      useEventsEmbedBootstrap,
    } = await import("@/embeds/events/bootstrap.js");

    applyEventsEmbedBootstrap({
      creatorId: "123",
      userRole: "creator",
      apiBaseUrl: "https://api.example.com",
      initialRoute: "create-group",
      creatorData: {
        avatar: "https://example.com/avatar.webp",
        name: "Creator Name",
        isVerified: true,
      },
    });

    const state = useEventsEmbedBootstrap();
    expect(state.creatorId).toBe(123);
    expect(state.userRole).toBe("creator");
    expect(state.apiBaseUrl).toBe("https://api.example.com");
    expect(state.initialRoute).toBe("create-group");
    expect(state.creatorData).toEqual({
      avatar: "https://example.com/avatar.webp",
      name: "Creator Name",
      isVerified: true,
    });
    expect(state.bootstrapped).toBe(true);
  });

  it("bootstraps fan embeds from fanId without requiring creatorId", async () => {
    const {
      applyEventsEmbedBootstrap,
      useEventsEmbedBootstrap,
    } = await import("@/embeds/events/bootstrap.js");

    applyEventsEmbedBootstrap({
      userRole: "fan",
      fanId: "2615",
      apiBaseUrl: "https://api.example.com",
      initialRoute: "events",
    });

    const state = useEventsEmbedBootstrap();
    expect(state.creatorId).toBe(null);
    expect(state.fanId).toBe(2615);
    expect(state.userRole).toBe("fan");
    expect(state.bootstrapped).toBe(true);
  });

  it("reads fallback bootstrap data from URL params", async () => {
    window.history.replaceState(
      {},
      "",
      "/?creatorId=55&userRole=agent&initialRoute=create-private&apiBaseUrl=https%3A%2F%2Fapi.example.com&creatorAvatar=https%3A%2F%2Fexample.com%2Favatar.webp&creatorName=Creator%20Name&creatorVerified=true",
    );

    const { readEventsEmbedBootstrapFromUrl } = await import("@/embeds/events/bootstrap.js");
    const bootstrap = readEventsEmbedBootstrapFromUrl();

    expect(bootstrap).toEqual({
      creatorId: 55,
      fanId: null,
      userRole: "agent",
      apiBaseUrl: "https://api.example.com",
      jwtToken: "",
      initialRoute: "create-private",
      creatorData: {
        avatar: "https://example.com/avatar.webp",
        name: "Creator Name",
        isVerified: true,
      },
    });
  });

  it("reads fan bootstrap data from URL params using fanId", async () => {
    window.history.replaceState(
      {},
      "",
      "/?userRole=fan&fanId=2615&apiBaseUrl=https%3A%2F%2Fapi.example.com",
    );

    const { readEventsEmbedBootstrapFromUrl } = await import("@/embeds/events/bootstrap.js");
    const bootstrap = readEventsEmbedBootstrapFromUrl();

    expect(bootstrap).toEqual({
      creatorId: null,
      fanId: 2615,
      userRole: "fan",
      apiBaseUrl: "https://api.example.com",
      jwtToken: "",
      initialRoute: "events",
      creatorData: {
        avatar: null,
        name: null,
        isVerified: null,
      },
    });
  });

  it("still bootstraps events embed when backend JWT caching throws", async () => {
    vi.doMock("@/utils/backendJwt.js", () => ({
      setBackendJwtToken: vi.fn(() => {
        throw new ReferenceError("Cannot access '_e' before initialization");
      }),
    }));

    const {
      applyEventsEmbedBootstrap,
      useEventsEmbedBootstrap,
    } = await import("@/embeds/events/bootstrap.js");

    applyEventsEmbedBootstrap({
      creatorId: 55,
      userRole: "creator",
      apiBaseUrl: "https://api.example.com",
      jwtToken: "jwt_live",
    });

    const state = useEventsEmbedBootstrap();
    expect(state.creatorId).toBe(55);
    expect(state.jwtToken).toBe("jwt_live");
    expect(state.bootstrapped).toBe(true);
  });
});
