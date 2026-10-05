import { beforeEach, describe, expect, it } from "vitest";

function getConfiguredDevTestFallback() {
  return typeof __FS_DEV_JWT_TEST_KEY__ === "string" ? __FS_DEV_JWT_TEST_KEY__.trim() : "";
}

describe("backend JWT cache", () => {
  beforeEach(() => {
    window.__FSBackendJwtToken = "";
  });

  it("prefers the runtime window token over the dev/test fallback", async () => {
    const { getBackendJwtToken, setBackendJwtToken } = await import("@/utils/backendJwt.js");

    setBackendJwtToken(" runtime_jwt ");

    expect(getBackendJwtToken()).toBe("runtime_jwt");
  });

  it("falls back to the dev/test token when no runtime token is set", async () => {
    const { clearBackendJwtToken, getBackendJwtToken } = await import("@/utils/backendJwt.js");

    clearBackendJwtToken();

    expect(getBackendJwtToken()).toBe(getConfiguredDevTestFallback());
  });

  it("clears only the runtime token", async () => {
    const { clearBackendJwtToken, getBackendJwtToken, setBackendJwtToken } = await import("@/utils/backendJwt.js");

    setBackendJwtToken("runtime_jwt");
    clearBackendJwtToken();

    expect(getBackendJwtToken()).toBe(getConfiguredDevTestFallback());
  });

  it("does not treat a gateway payment token as the backend JWT", async () => {
    const { normalizeBackendAuthContext } = await import("@/utils/backendJwt.js");

    expect(normalizeBackendAuthContext({
      user_id: 8073,
      token: "8ac7a4a0-payment-token",
      order_id: 50912,
    })).toEqual({
      userId: 8073,
      backendJwtToken: "",
    });
  });

  it("accepts only explicitly named backend JWT fields from checkout auth data", async () => {
    const { normalizeBackendAuthContext } = await import("@/utils/backendJwt.js");

    expect(normalizeBackendAuthContext({
      token: "gateway-token",
      userData: {
        userID: 8073,
        jwtToken: "fansocial.jwt.token",
      },
    })).toEqual({
      userId: 8073,
      backendJwtToken: "fansocial.jwt.token",
    });
  });
});
