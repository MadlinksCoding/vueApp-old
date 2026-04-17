import { beforeEach, describe, expect, it, vi } from "vitest";

describe("fetchSpendingRequirementItemsFlow", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("uses the resolved wp-json site root for subscription collection requests", async () => {
    const apiGet = vi.fn().mockResolvedValue({
      status: "success",
      results: [{ id: 1, title: "VIP" }],
      total_count: 1,
    });

    const { fetchSpendingRequirementItemsFlow } = await import("@/services/events/flows/fetchSpendingRequirementItemsFlow.js");
    const result = await fetchSpendingRequirementItemsFlow({
      payload: {
        type: "subscription",
        creatorId: 1407,
        count: 20,
        offset: 0,
      },
      context: {
        requestHeaders: {},
        signal: null,
        requestTimeoutMs: 5000,
      },
      api: {
        get: apiGet,
      },
    });

    expect(result.ok).toBe(true);
    expect(apiGet).toHaveBeenCalledTimes(1);
    const [url, options] = apiGet.mock.calls[0];
    expect(url).toBe("https://fansocial.app/wp-json/api/subscriptions/plans/list");
    expect(url).not.toContain("/undefined/");
    expect(url).not.toContain("/null/");
    expect(options).toEqual(expect.objectContaining({
      params: expect.objectContaining({
        creator_id: 1407,
        count: 20,
      }),
    }));
  });
});
