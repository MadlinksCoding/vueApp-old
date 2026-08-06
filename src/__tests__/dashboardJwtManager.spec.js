import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function jwtWithExpiration(exp) {
  const encode = (value) => btoa(JSON.stringify(value))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${encode({ alg: "none" })}.${encode({ exp })}.signature`;
}

function loadJwtManager() {
  const source = readFileSync(
    resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/assets/FINAL/js/jwt-manager.js"),
    "utf8",
  );
  window.eval(source);
}

describe("shared WordPress JWT refresh manager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    delete window.FanSocialJwtManager;
    delete window.Dashboard_Main;
    window.userData = {
      userID: "2615",
      jwtToken: jwtWithExpiration(Math.floor(Date.now() / 1000) - 1),
    };
    window.siteData = {
      siteUrl: "https://fansocial.example",
      restNonce: "nonce-old",
    };
    window.FSEventsEmbed = {
      updateAuth: vi.fn(),
      updateFanBookingAuth: vi.fn(),
    };
    window.FSChatEmbed = { updateAuth: vi.fn() };

  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete window.FanSocialJwtManager;
    delete window.Dashboard_Main;
    delete window.FSEventsEmbed;
    delete window.FSChatEmbed;
  });

  it("refreshes an expired token once and propagates it to every active embed host", async () => {
    const freshToken = jwtWithExpiration(Math.floor(Date.now() / 1000) + 21600);
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        success: true,
        jwtToken: freshToken,
        restNonce: "nonce-new",
      }),
    });
    loadJwtManager();

    const first = window.FanSocialJwtManager.ensureFreshToken();
    const second = window.FanSocialJwtManager.ensureFreshToken();
    await expect(Promise.all([first, second])).resolves.toEqual([freshToken, freshToken]);

    expect(window.fetch).toHaveBeenCalledOnce();
    expect(window.fetch).toHaveBeenCalledWith(
      "https://fansocial.example/wp-json/api/users/jwt/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: expect.objectContaining({ "X-WP-Nonce": "nonce-old" }),
      }),
    );
    expect(window.userData.jwtToken).toBe(freshToken);
    expect(window.siteData.restNonce).toBe("nonce-new");
    expect(window.FSEventsEmbed.updateAuth).toHaveBeenCalledWith({ jwtToken: freshToken });
    expect(window.FSEventsEmbed.updateFanBookingAuth).toHaveBeenCalledWith({
      fanId: 2615,
      jwtToken: freshToken,
    });
    expect(window.FSChatEmbed.updateAuth).toHaveBeenCalledWith({ jwtToken: freshToken });
  });

  it("keeps a valid token and schedules refresh five minutes before its exp", async () => {
    const expiration = Math.floor(Date.now() / 1000) + 21600;
    const currentToken = jwtWithExpiration(expiration);
    window.userData.jwtToken = currentToken;
    window.fetch = vi.fn();
    loadJwtManager();

    await expect(window.FanSocialJwtManager.ensureFreshToken()).resolves.toBe(currentToken);

    expect(window.fetch).not.toHaveBeenCalled();
    expect(window.FanSocialJwtManager.refreshTimer).not.toBeNull();
  });

  it("is registered globally for logged-in frontend users and absent from dashboard.js", () => {
    const assetsSource = readFileSync(
      resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/includes/class-assets.php"),
      "utf8",
    );
    const dashboardSource = readFileSync(
      resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/assets/FINAL/js/dashboard.js"),
      "utf8",
    );
    const managerSource = readFileSync(
      resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/assets/FINAL/js/jwt-manager.js"),
      "utf8",
    );
    const adminEnqueue = assetsSource.slice(
      assetsSource.indexOf("public function admin_enqueue_scripts()"),
      assetsSource.indexOf("public function enqueue_scripts()"),
    );
    const frontendEnqueue = assetsSource.slice(assetsSource.indexOf("public function enqueue_scripts()"));

    expect(assetsSource).toContain("wp_register_script( 'fansocial-jwt-manager',");
    expect(assetsSource).toContain("array( 'main' )");
    expect(frontendEnqueue).toContain("if ( is_user_logged_in() )");
    expect(frontendEnqueue).toContain("wp_enqueue_script( 'fansocial-jwt-manager' );");
    expect(adminEnqueue).not.toContain("fansocial-jwt-manager");
    expect(dashboardSource).not.toContain("FanSocialJwtManager");
    expect(managerSource).toContain("window.FanSocialJwtManager.start().catch(() => {});");
    expect(managerSource).not.toContain("await window.FanSocialJwtManager.start()");
  });
});
