import { describe, expect, it, vi } from "vitest";
import { APIHandler } from "@/services/api/apiHandler.js";
import { fetchChatUsersDataFlow } from "@/services/chat/flows/fetchChatUsersDataFlow.js";

describe("chat users data cache controls", () => {
  it("forwards fetch cache mode through the shared API handler", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const api = new APIHandler({}, { emitEvents: false, authTokenResolver: () => "" });

    await api.get("/wp-json/api/chat/get-users-data", { cache: "no-store" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/wp-json/api/chat/get-users-data",
      expect.objectContaining({ cache: "no-store" })
    );

    vi.unstubAllGlobals();
  });

  it("requests chat user data with no client-side cache", async () => {
    const signal = new AbortController().signal;
    const api = {
      get: vi.fn(async () => ({ users: { 12: { id: 12, name: "R" } } })),
    };

    const result = await fetchChatUsersDataFlow({
      payload: { userIds: [12] },
      context: { requestHeaders: { Authorization: "Bearer token" }, signal },
      api,
    });

    expect(result.ok).toBe(true);
    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining("/wp-json/api/chat/get-users-data?user_ids=12"),
      {
        headers: { Authorization: "Bearer token" },
        signal,
        cache: "no-store",
      }
    );
  });
});
