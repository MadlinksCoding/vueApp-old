import { beforeEach, describe, expect, it, vi } from "vitest";

describe("eventsAudienceApi", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("builds subscription tier URLs at the wp-json site root without undefined segments", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { id: 1, title: "VIP" },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const { fetchActiveSubscriptionTiers } = await import("@/services/events/eventsAudienceApi.js");
    const result = await fetchActiveSubscriptionTiers({ creatorId: 1407 });

    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        label: "VIP",
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://fansocial.app/wp-json/api/subscriptions/plans/list?creator_id=1407&count=20");
    expect(url).not.toContain("/undefined/");
    expect(url).not.toContain("/null/");
    expect(options).toEqual(expect.objectContaining({
      method: "GET",
    }));
  });

  it("builds audience search URLs at the wp-json root", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { id: 25, username: "fan-user", display_name: "Fan User" },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const { searchInvitableUsers } = await import("@/services/events/eventsAudienceApi.js");
    const result = await searchInvitableUsers({ query: "fan" });

    expect(result).toEqual([
      expect.objectContaining({
        id: 25,
        username: "fan-user",
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://fansocial.app/wp-json/api/users/search?query=fan");
    expect(url).not.toContain("/undefined/");
    expect(url).not.toContain("/null/");
    expect(options).toEqual(expect.objectContaining({
      method: "GET",
    }));
  });
});
