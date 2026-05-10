import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function getConfiguredTokenHandlerFallback() {
  return typeof __FS_DEV_TOKEN_HANDLER_KEY__ === "string" ? __FS_DEV_TOKEN_HANDLER_KEY__.trim() : "";
}

describe("TokenHandler", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.doUnmock("@/utils/backendJwt.js");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("builds auth headers from the runtime backend JWT token", async () => {
    vi.doMock("@/utils/backendJwt.js", () => ({
      getRuntimeBackendJwtToken: vi.fn(() => "runtime_jwt"),
    }));

    const { default: TokenHandler } = await import("@/utils/TokenHandler.js");

    expect(TokenHandler.getAuthHeaders()).toEqual({
      Authorization: "Bearer runtime_jwt",
      "Content-Type": "application/json",
    });
  });

  it("falls back to the TokenHandler-specific dev/test token when no runtime JWT is set", async () => {
    vi.doMock("@/utils/backendJwt.js", () => ({
      getRuntimeBackendJwtToken: vi.fn(() => ""),
    }));

    const { default: TokenHandler } = await import("@/utils/TokenHandler.js");
    expect(TokenHandler.tokenFallback).toBe(getConfiguredTokenHandlerFallback());
    const fallback = "token_handler_dev_token";
    TokenHandler.tokenFallback = fallback;

    expect(TokenHandler.getAuthHeaders()).toEqual({
      Authorization: `Bearer ${fallback}`,
      "Content-Type": "application/json",
    });
  });

  it("throws a generic auth error when no runtime or TokenHandler fallback token is configured", async () => {
    vi.doMock("@/utils/backendJwt.js", () => ({
      getRuntimeBackendJwtToken: vi.fn(() => ""),
    }));

    const { default: TokenHandler } = await import("@/utils/TokenHandler.js?missing-token");
    TokenHandler.tokenFallback = "";

    expect(() => TokenHandler.getAuthHeaders()).toThrow("Backend JWT token is not configured.");
  });

  it("returns the provided default balance value instead of fetching when no auth is available", async () => {
    vi.doMock("@/utils/backendJwt.js", () => ({
      getRuntimeBackendJwtToken: vi.fn(() => ""),
    }));
    const fetchMock = vi.fn();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetchMock);

    const { default: TokenHandler } = await import("@/utils/TokenHandler.js?default-balance");
    const fallback = { ok: false, data: null };
    TokenHandler.tokenFallback = "";

    await expect(TokenHandler.get({ userId: 2615, defaultValue: fallback })).resolves.toBe(fallback);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
