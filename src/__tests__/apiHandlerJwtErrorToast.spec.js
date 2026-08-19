import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock("@/utils/toastBus.js", () => ({ showToast }));
vi.mock("@/utils/backendJwt.js", () => ({
  getBackendJwtToken: () => "runtime.jwt.token",
}));

import { APIHandler } from "@/services/api/apiHandler.js";

describe("APIHandler JWT authentication errors", () => {
  beforeEach(() => {
    showToast.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("presents one auth toast with the exact request JWT and marks the error handled", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: false,
      error: "jwt_expired",
      message: "JWT is expired",
    }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })));
    const api = new APIHandler({}, { emitEvents: false });

    let caught;
    try {
      await api.get("https://api.example.test/bookings", { backendJwtToken: "request.jwt.token" });
    } catch (error) {
      caught = error;
    }

    expect(caught?.meta?.backendJwtErrorPresented).toBe(true);
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      message: "JWT is expired",
      action: expect.objectContaining({ value: "request.jwt.token" }),
    }));
  });
});
