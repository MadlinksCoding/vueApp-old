import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function getConfiguredTokenHandlerFallback() {
  return typeof __FS_DEV_TOKEN_HANDLER_KEY__ === "string" ? __FS_DEV_TOKEN_HANDLER_KEY__.trim() : "";
}

describe("TokenHandler", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.doUnmock("@/utils/backendJwt.js");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
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

  it("builds token requests from the configured env URL", async () => {
    vi.stubEnv("VITE_TOKEN_HANDLER_API_URL", " https://tokens.example.test/dev/// ");
    vi.doMock("@/utils/backendJwt.js", () => ({
      getRuntimeBackendJwtToken: vi.fn(() => "runtime_jwt"),
    }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { balance: 12 } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { default: TokenHandler } = await import("@/utils/TokenHandler.js?env-api-url");

    expect(TokenHandler.apiUrl).toBe("https://tokens.example.test/dev");
    await expect(TokenHandler.get({ userId: 2615 })).resolves.toEqual({ ok: true, data: { balance: 12 } });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://tokens.example.test/dev/balance/2615",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lets a runtime URL override take precedence over the env URL", async () => {
    vi.stubEnv("VITE_TOKEN_HANDLER_API_URL", "https://tokens.example.test/env");
    vi.doMock("@/utils/backendJwt.js", () => ({
      getRuntimeBackendJwtToken: vi.fn(() => "runtime_jwt"),
    }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, tx: { id: "tx_1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { default: TokenHandler, setRuntimeTokenHandlerApiUrl } = await import("@/utils/TokenHandler.js?runtime-api-url");
    setRuntimeTokenHandlerApiUrl(" https://tokens.example.test/runtime/ ");

    expect(TokenHandler.apiUrl).toBe("https://tokens.example.test/runtime");
    await expect(TokenHandler.deduct({ userId: 2615, amount: 3 })).resolves.toEqual({
      ok: true,
      tx: { id: "tx_1" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://tokens.example.test/runtime/deduct",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns controlled failures when the token handler API URL is missing", async () => {
    vi.stubEnv("VITE_TOKEN_HANDLER_API_URL", "");
    vi.doMock("@/utils/backendJwt.js", () => ({
      getRuntimeBackendJwtToken: vi.fn(() => "runtime_jwt"),
    }));
    const fetchMock = vi.fn();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetchMock);

    const { default: TokenHandler } = await import("@/utils/TokenHandler.js?missing-api-url");
    const fallback = { ok: false, data: null };

    await expect(TokenHandler.get({ userId: 2615, defaultValue: fallback })).resolves.toBe(fallback);
    const holdResult = await TokenHandler.hold({ userId: 2615, receiverId: 1407, amount: 5 });
    expect(holdResult.ok).toBe(false);
    expect(holdResult.error.message).toBe("Token handler API URL is not configured.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns the provided default balance value instead of fetching when no auth is available", async () => {
    vi.stubEnv("VITE_TOKEN_HANDLER_API_URL", "https://tokens.example.test/dev");
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
