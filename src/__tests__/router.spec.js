import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "@/stores/useAuthStore";
import routeGuard from "@/router/routeGuard";

describe("Route Guard", () => {
  let auth;

  beforeEach(() => {
    setActivePinia(createPinia());
    auth = useAuthStore();
  });

  it("allows dashboard access for creator without onboarding when dashboard has no dependency requirement", async () => {
    auth.simulateRole("creator", { onboardingPassed: false, kycPassed: true });

    const next = vi.fn();

    await routeGuard(
      { path: "/dashboard", fullPath: "/dashboard", meta: {} },
      { path: "/", fullPath: "/" },
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it("allows dashboard access for creator without KYC when dashboard has no dependency requirement", async () => {
    auth.simulateRole("creator", { onboardingPassed: true, kycPassed: false });

    const next = vi.fn();

    await routeGuard(
      { path: "/dashboard", fullPath: "/dashboard", meta: {} },
      { path: "/", fullPath: "/" },
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it("lets vendor with all requirements access dashboard", async () => {
    auth.simulateRole("vendor", { onboardingPassed: true, kycPassed: true });

    const next = vi.fn();

    await routeGuard(
      { path: "/dashboard", fullPath: "/dashboard", meta: {} },
      { path: "/", fullPath: "/" },
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it("redirects unknown routes to /404", async () => {
    auth.simulateRole("vendor", { onboardingPassed: true, kycPassed: true });

    const next = vi.fn();
    await routeGuard({ path: "/non-existent" }, {}, next);
    expect(next).toHaveBeenCalledWith("/404");
  });
});
