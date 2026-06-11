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
    const expectedBaseUrl = import.meta.env.VITE_WEB_BASE_URL || window.location.origin;
    expect(url).toBe(`${expectedBaseUrl.replace(/\/+$/, "")}/wp-json/api/subscriptions/plans/list`);
    expect(url).not.toContain("/undefined/");
    expect(url).not.toContain("/null/");
    expect(options).toEqual(expect.objectContaining({
      params: expect.objectContaining({
        creator_id: 1407,
        count: 20,
      }),
    }));
  });

  it("maps only published subscriptions into spending requirement items", async () => {
    const { mapFetchSpendingRequirementItemsFromResponse } = await import("@/services/events/mappers/fetchSpendingRequirementItemsMapper.js");

    const mapped = mapFetchSpendingRequirementItemsFromResponse({
      type: "subscription",
      results: [
        { id: 1, status: "publish", title: "Live Tier", price: 9 },
        { id: 2, status: "draft", title: "Draft Tier", price: 19 },
        { id: 3, status: "private", title: "Private Tier", price: 29 },
      ],
      totalCount: 3,
      count: 20,
      offset: 0,
    });

    expect(mapped.items).toHaveLength(1);
    expect(mapped.items[0]).toEqual(expect.objectContaining({
      id: 1,
      title: "Live Tier",
      type: "subscription",
    }));
    expect(mapped.nextOffset).toBe(3);
    expect(mapped.hasMore).toBe(false);
  });

  it("does not call a second endpoint when subscription loading fails", async () => {
    const apiGet = vi.fn().mockRejectedValue({ code: "HTTP_404", message: "Not found" });
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

    expect(result.ok).toBe(false);
    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(apiGet.mock.calls[0][0]).toContain("/wp-json/api/subscriptions/plans/list");
  });
});
