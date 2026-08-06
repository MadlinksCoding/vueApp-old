import { beforeEach, describe, expect, it, vi } from "vitest";

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));
let runtimeToken = "runtime.jwt.token";

vi.mock("@/utils/toastBus.js", () => ({ showToast }));
vi.mock("@/utils/backendJwt.js", () => ({
  getBackendJwtToken: () => runtimeToken,
}));

import {
  findBackendJwtAuthError,
  presentBackendJwtAuthError,
} from "@/utils/backendJwtErrorToast.js";

describe("backend JWT error toasts", () => {
  beforeEach(() => {
    showToast.mockReset();
    runtimeToken = "runtime.jwt.token";
  });

  it.each([
    ["jwt_missing_exp", "JWT is missing exp"],
    ["jwt_invalid_exp", "JWT exp is invalid"],
    ["jwt_expired", "JWT is expired"],
  ])("keeps the definitive message for %s", (code, message) => {
    const source = {
      ok: false,
      error: { code: "HTTP_401", details: { error: code, message: "ambiguous server text" } },
    };

    expect(findBackendJwtAuthError(source)).toEqual({ code, message: "ambiguous server text" });
    expect(presentBackendJwtAuthError(source)).toBe(true);
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      message,
      action: expect.objectContaining({ type: "copy", value: "runtime.jwt.token" }),
    }));
  });

  it("uses the request token instead of the runtime fallback", () => {
    presentBackendJwtAuthError(
      { error: "invalid_jwt_issuer", message: "JWT issuer is invalid." },
      { token: "request.jwt.token" },
    );

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      message: "JWT issuer is invalid.",
      action: expect.objectContaining({ value: "request.jwt.token" }),
    }));
  });

  it("omits Copy when no token exists", () => {
    runtimeToken = "";
    presentBackendJwtAuthError({
      error: "missing_bearer_token",
      message: "Authorization header must be a Bearer token.",
    });

    expect(showToast).toHaveBeenCalledWith(expect.not.objectContaining({ action: expect.anything() }));
  });

  it("ignores non-authentication backend errors", () => {
    expect(presentBackendJwtAuthError({ error: "event_not_found" })).toBe(false);
    expect(showToast).not.toHaveBeenCalled();
  });
});
