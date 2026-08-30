import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hostCss = readFileSync(resolve(process.cwd(), "public/bookings-embed/fs-events-host.css"), "utf8");

describe("fs-events-host openFanBookingPopup", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = "";
    delete window.FSScheduledCallOverlay;
    delete window.tokenManager;
    delete window.openTipPopup;
    delete window.__fsTokenBalanceUiRefreshState;
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: false,
      text: () => Promise.resolve(""),
    })));
    await import("../../public/bookings-embed/fs-events-host.js");
  });

  it("rejects creatorId 0", () => {
    expect(() => {
      window.FSEventsEmbed.openFanBookingPopup({
        creatorId: 0,
        fanId: 25,
      });
    }).toThrow("positive creatorId");
  });

  it("accepts fanId 0 for guest booking popups", () => {
    const popup = window.FSEventsEmbed.openFanBookingPopup({
      creatorId: 1407,
      fanId: 0,
    });

    expect(popup.iframe.src).toContain("fanId=0");
  });

  it("opens booking details in a right-side overlay and keeps booking data out of the iframe URL", () => {
    const bookingSnapshot = {
      bookingId: "booking_secret_123",
      status: "cancelled_creator",
      cancellation: { actor: "creator", refundedTokens: 25 },
    };
    const popup = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking_secret_123",
      creatorId: 1407,
      userRole: "creator",
      jwtToken: "jwt_secret",
      bookingSnapshot,
    });
    const postMessage = vi.spyOn(popup.iframe.contentWindow, "postMessage");

    popup.iframe.dispatchEvent(new Event("load"));

    expect(popup.overlay.matches("[data-fs-booking-details-popup]")).toBe(true);
    expect(popup.overlay.querySelector(".fs-booking-details-popup__panel")).not.toBeNull();
    expect(new URL(popup.iframe.src).searchParams.get("fsDetailsVersion")).toMatch(/^\d+$/);
    expect(popup.iframe.src).not.toContain("booking_secret_123");
    expect(popup.iframe.src).not.toContain("jwt_secret");
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FS_EVENTS_BOOTSTRAP",
        payload: expect.objectContaining({
          initialRoute: "booking-details",
          bookingId: "booking_secret_123",
          bookingSnapshot,
          jwtToken: "jwt_secret",
          hostViewportWidth: window.innerWidth,
        }),
      }),
      window.location.origin,
    );

    popup.destroy();
  });

  it("keeps the initial drawer animation without reapplying it from the decision modifier", () => {
    const panelRule = hostCss.match(/\.fs-booking-details-popup__panel\s*\{([^}]*)\}/)?.[1] || "";
    const decisionRule = hostCss.match(/\.fs-booking-details-popup__panel--decision-open\s*\{([^}]*)\}/)?.[1] || "";
    const closingRule = hostCss.match(/\.fs-booking-details-popup__panel--closing\s*\{([^}]*)\}/)?.[1] || "";

    expect(panelRule).toContain("animation: fs-booking-details-slide-in 220ms ease-out");
    expect(decisionRule).not.toMatch(/\banimation\s*:/);
    expect(closingRule).toContain("transform: translateX(100%)");
    expect(closingRule).toContain("transition: transform 220ms ease-in");
  });

  it("expands only the active booking-details iframe while a decision popup is open", () => {
    const popup = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking_123",
      fanId: 25,
      userRole: "fan",
    });
    const panel = popup.overlay.querySelector(".fs-booking-details-popup__panel");

    window.dispatchEvent(new MessageEvent("message", {
      source: window,
      data: { type: "FS_EVENTS_BOOKING_DETAILS_DECISION_VISIBILITY", payload: { open: true } },
      origin: window.location.origin,
    }));
    expect(panel.classList.contains("fs-booking-details-popup__panel--decision-open")).toBe(false);

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_EVENTS_BOOKING_DETAILS_DECISION_VISIBILITY", payload: { open: true } },
      origin: window.location.origin,
    }));
    expect(panel.classList.contains("fs-booking-details-popup__panel--decision-open")).toBe(true);

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_EVENTS_BOOKING_DETAILS_DECISION_VISIBILITY", payload: { open: false } },
      origin: window.location.origin,
    }));
    expect(panel.classList.contains("fs-booking-details-popup__panel--decision-open")).toBe(false);

    panel.classList.add("fs-booking-details-popup__panel--decision-open");
    popup.destroy();
    expect(panel.classList.contains("fs-booking-details-popup__panel--decision-open")).toBe(false);
  });

  it("bootstraps direct fan cancellation full-screen and keeps it expanded until destruction", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    const popup = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking_123",
      fanId: 25,
      userRole: "fan",
      initialAction: "cancel",
      loadingLabel: "Loading",
      returnFocusElement: trigger,
    });
    const panel = popup.overlay.querySelector(".fs-booking-details-popup__panel");
    const postMessage = vi.spyOn(popup.iframe.contentWindow, "postMessage");

    expect(panel.classList.contains("fs-booking-details-popup__panel--decision-open")).toBe(true);
    expect(panel.classList.contains("fs-booking-details-popup__panel--decision-direct")).toBe(true);
    expect(popup.iframe.style.visibility).toBe("hidden");
    expect(panel.querySelector(".fs-booking-details-popup__loading-label")).toBeNull();
    expect(panel.querySelector(".fs-booking-details-popup__loading")?.textContent).toBe("");
    popup.iframe.dispatchEvent(new Event("load"));
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ initialAction: "cancel" }),
    }), window.location.origin);

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_EVENTS_BOOKING_DETAILS_DECISION_VISIBILITY", payload: { open: false } },
      origin: window.location.origin,
    }));
    expect(panel.classList.contains("fs-booking-details-popup__panel--decision-open")).toBe(true);

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_EVENTS_BOOKING_DETAILS_READY", payload: { ok: true } },
      origin: window.location.origin,
    }));
    expect(popup.iframe.style.visibility).toBe("visible");
    expect(panel.querySelector(".fs-booking-details-popup__loading")?.classList.contains(
      "fs-booking-details-popup__loading--hidden",
    )).toBe(true);

    popup.destroy();
    expect(panel.classList.contains("fs-booking-details-popup__panel--decision-direct")).toBe(false);
  });

  it("bootstraps direct creator cancellation in the same full-screen decision host", () => {
    const popup = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking_creator_cancel",
      creatorId: 1407,
      userRole: "creator",
      initialAction: "cancel",
    });
    const panel = popup.overlay.querySelector(".fs-booking-details-popup__panel");
    const postMessage = vi.spyOn(popup.iframe.contentWindow, "postMessage");

    expect(panel.classList.contains("fs-booking-details-popup__panel--decision-open")).toBe(true);
    expect(panel.classList.contains("fs-booking-details-popup__panel--decision-direct")).toBe(true);
    expect(panel.querySelector(".fs-booking-details-popup__loading-label")).toBeNull();
    expect(panel.querySelector(".fs-booking-details-popup__loading")?.textContent).toBe("");
    popup.iframe.dispatchEvent(new Event("load"));
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ userRole: "creator", initialAction: "cancel" }),
    }), window.location.origin);
    popup.destroy();
  });

  it("keeps the direct cancellation loading layer transparent without a fade", () => {
    const directLoadingRule = hostCss.match(
      /\.fs-booking-details-popup__panel--decision-direct\s+\.fs-booking-details-popup__loading\s*\{([^}]*)\}/,
    )?.[1] || "";
    const spinnerRule = hostCss.match(
      /\.fs-booking-details-popup__spinner\s*\{([^}]*)\}/,
    )?.[1] || "";

    expect(directLoadingRule).toContain("background: transparent");
    expect(directLoadingRule).toContain("transition: none");
    expect(spinnerRule).toContain("display: block");
    expect(spinnerRule).toContain("flex: 0 0 32px");
    expect(spinnerRule).toContain("min-width: 32px");
    expect(spinnerRule).toContain("min-height: 32px");
  });

  it("closes only the booking-details overlay and restores focus", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const popup = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking_123",
      creatorId: 1407,
      returnFocusElement: trigger,
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_EVENTS_BOOKING_DETAILS_CLOSE_REQUEST", payload: {} },
      origin: window.location.origin,
    }));

    expect(document.body.contains(popup.overlay)).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("notifies the host once after a booking mutation and removes the overlay", () => {
    const onBookingUpdated = vi.fn();
    const popup = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking_123",
      creatorId: 1407,
      onBookingUpdated,
    });
    const payload = { bookingId: "booking_123", action: "approve" };

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_EVENTS_BOOKING_DETAILS_UPDATED", payload },
      origin: window.location.origin,
    }));

    const panel = popup.overlay.querySelector(".fs-booking-details-popup__panel");
    expect(panel.classList.contains("fs-booking-details-popup__panel--closing")).toBe(true);
    expect(onBookingUpdated).not.toHaveBeenCalled();
    expect(document.body.contains(popup.overlay)).toBe(true);

    const transitionEvent = new Event("transitionend");
    Object.defineProperty(transitionEvent, "propertyName", { value: "transform" });
    panel.dispatchEvent(transitionEvent);

    expect(onBookingUpdated).toHaveBeenCalledTimes(1);
    expect(onBookingUpdated).toHaveBeenCalledWith(payload);
    expect(document.body.contains(popup.overlay)).toBe(false);
  });

  it("retains the booking-details iframe for mobile creator review updates", () => {
    const onBookingUpdated = vi.fn();
    const popup = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking_123",
      creatorId: 1407,
      onBookingUpdated,
    });
    const payload = { bookingId: "booking_123", action: "approve", retainOpen: true };

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_EVENTS_BOOKING_DETAILS_UPDATED", payload },
      origin: window.location.origin,
    }));

    const panel = popup.overlay.querySelector(".fs-booking-details-popup__panel");
    expect(panel.classList.contains("fs-booking-details-popup__panel--closing")).toBe(false);
    expect(document.body.contains(popup.overlay)).toBe(true);
    expect(onBookingUpdated).toHaveBeenCalledTimes(1);
    expect(onBookingUpdated).toHaveBeenCalledWith(payload);

    popup.destroy();
  });

  it("opens token top-up only for messages from the active booking-details iframe", async () => {
    window.openTipPopup = vi.fn();
    const popup = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking_123",
      fanId: 25,
      userRole: "fan",
    });
    const postMessage = vi.spyOn(popup.iframe.contentWindow, "postMessage");

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED",
        payload: { requiredTokens: 15, currentUserId: "25", creatorUserId: "1407" },
      },
      origin: window.location.origin,
    }));

    expect(window.openTipPopup).toHaveBeenCalledWith(expect.objectContaining({
      topup_amount: 15,
      user_id: "25",
      creator_id: "1407",
      topupFor: "booking_confirm",
    }));

    await window.openTipPopup.mock.calls[0][0].successCallback();
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS",
      payload: { bookingId: "booking_123" },
    }), window.location.origin);

    popup.destroy();
  });

  it("opens token top-up for the dashboard embed as well as the details popup", async () => {
    window.openTipPopup = vi.fn();
    const embed = window.FSEventsEmbed.mount(document.body, {
      creatorId: 1407,
      fanId: 25,
      userRole: "fan",
    });
    const postMessage = vi.spyOn(embed.iframe.contentWindow, "postMessage");

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED",
        payload: { bookingId: "booking_9", requiredTokens: 20, currentUserId: "25", creatorUserId: "1407" },
      },
      origin: window.location.origin,
    }));

    expect(window.openTipPopup).toHaveBeenCalledWith(expect.objectContaining({
      topup_amount: 20,
      user_id: "25",
      creator_id: "1407",
      topupFor: "booking_confirm",
    }));

    await window.openTipPopup.mock.calls[0][0].successCallback();
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS",
      payload: expect.objectContaining({ bookingId: "booking_9" }),
    }), window.location.origin);

    embed.destroy();
  });

  it("tells the dashboard embed when top-up is unavailable", () => {
    delete window.openTipPopup;
    const embed = window.FSEventsEmbed.mount(document.body, { creatorId: 1407, fanId: 25 });
    const postMessage = vi.spyOn(embed.iframe.contentWindow, "postMessage");

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED",
        payload: { bookingId: "booking_9", requiredTokens: 20 },
      },
      origin: window.location.origin,
    }));

    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_FAILED",
      payload: expect.objectContaining({ reason: "topup_unavailable" }),
    }), window.location.origin);

    embed.destroy();
  });

  it("posts translations and locale in fan booking bootstrap without putting them in the iframe URL", () => {
    const popup = window.FSEventsEmbed.openFanBookingPopup({
      creatorId: 1407,
      fanId: 0,
      translations: {
        fan_booking_book_now: "Reservar",
        ignored: 12,
      },
      locale: "es-MX",
    });
    const postMessage = vi.spyOn(popup.iframe.contentWindow, "postMessage");

    popup.iframe.dispatchEvent(new Event("load"));

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FS_FAN_BOOKING_BOOTSTRAP",
        payload: expect.objectContaining({
          translations: { fan_booking_book_now: "Reservar" },
          locale: "es-MX",
        }),
      }),
      window.location.origin,
    );
    expect(popup.iframe.src).not.toContain("translations");
    expect(popup.iframe.src).not.toContain("Reservar");
    expect(popup.iframe.src).not.toContain("locale=es-MX");
  });

  it("posts inviteSecret in fan booking bootstrap without putting it in the iframe URL", () => {
    const popup = window.FSEventsEmbed.openFanBookingPopup({
      creatorId: 1407,
      fanId: 25,
      eventId: "evt_invite",
      inviteSecret: "invite_secret_123",
    });
    const postMessage = vi.spyOn(popup.iframe.contentWindow, "postMessage");

    popup.iframe.dispatchEvent(new Event("load"));

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FS_FAN_BOOKING_BOOTSTRAP",
        payload: expect.objectContaining({
          eventId: "evt_invite",
          inviteSecret: "invite_secret_123",
        }),
      }),
      window.location.origin,
    );
    expect(popup.iframe.src).toContain("eventId=evt_invite");
    expect(popup.iframe.src).not.toContain("inviteSecret");
    expect(popup.iframe.src).not.toContain("invite_secret_123");
  });

  it("posts translations and locale in events mount bootstrap without putting them in the iframe URL", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "agent",
      initialRoute: "create-group",
      translations: {
        dashboard_new_events: "Nuevos eventos",
        ignored: {},
      },
      locale: "fr-CA",
    });
    const postMessage = vi.spyOn(embed.iframe.contentWindow, "postMessage");

    embed.sendBootstrap();

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FS_EVENTS_BOOTSTRAP",
        payload: expect.objectContaining({
          userRole: "agent",
          initialRoute: "create-group",
          translations: { dashboard_new_events: "Nuevos eventos" },
          locale: "fr-CA",
          hostViewportWidth: window.innerWidth,
        }),
      }),
      window.location.origin,
    );
    expect(embed.iframe.src).not.toContain("translations");
    expect(embed.iframe.src).not.toContain("Nuevos");
    expect(embed.iframe.src).not.toContain("locale=fr-CA");
    expect(embed.iframe.src).toContain("userRole=agent");
    expect(embed.iframe.src).toContain("initialRoute=create-group");
  });

  it("passes tokenHandlerApiUrl through events mount URL and bootstrap payload", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "creator",
      tokenHandlerApiUrl: "https://tokens.example.test/dev",
    });
    const postMessage = vi.spyOn(embed.iframe.contentWindow, "postMessage");

    embed.sendBootstrap();

    expect(new URL(embed.iframe.src).searchParams.get("tokenHandlerApiUrl")).toBe("https://tokens.example.test/dev");
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FS_EVENTS_BOOTSTRAP",
        payload: expect.objectContaining({
          tokenHandlerApiUrl: "https://tokens.example.test/dev",
        }),
      }),
      window.location.origin,
    );
  });

  it("passes tokenHandlerApiUrl through fan booking popup URL and bootstrap payload", () => {
    const popup = window.FSEventsEmbed.openFanBookingPopup({
      creatorId: 1407,
      fanId: 25,
      tokenHandlerApiUrl: "https://tokens.example.test/dev",
    });
    const postMessage = vi.spyOn(popup.iframe.contentWindow, "postMessage");

    popup.iframe.dispatchEvent(new Event("load"));

    expect(new URL(popup.iframe.src).searchParams.get("tokenHandlerApiUrl")).toBe("https://tokens.example.test/dev");
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FS_FAN_BOOKING_BOOTSTRAP",
        payload: expect.objectContaining({
          tokenHandlerApiUrl: "https://tokens.example.test/dev",
        }),
      }),
      window.location.origin,
    );
  });

  it("scrolls the parent page to the events iframe when the child requests top reset", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "creator",
      initialRoute: "events",
    });
    const originalScrollTo = window.scrollTo;

    window.scrollTo = vi.fn();
    embed.root.scrollIntoView = vi.fn();
    embed.root.getBoundingClientRect = vi.fn(() => ({ top: 240 }));
    Object.defineProperty(window, "pageYOffset", {
      configurable: true,
      value: 60,
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_SCROLL_TO_TOP",
        payload: { behavior: "auto", reason: "created" },
      },
      origin: window.location.origin,
    }));

    expect(embed.root.scrollIntoView).not.toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 300,
      left: 0,
      behavior: "auto",
    });

    window.scrollTo = originalScrollTo;
  });

  it("keeps the events toolbar below the visible WordPress mobile header on initial reset", () => {
    const mobileHeader = document.createElement("div");
    mobileHeader.setAttribute("data-mobile-header", "");
    mobileHeader.style.position = "fixed";
    mobileHeader.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      bottom: 60,
      height: 60,
    }));
    document.body.appendChild(mobileHeader);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "creator",
      initialRoute: "events",
    });
    const originalScrollTo = window.scrollTo;

    window.scrollTo = vi.fn();
    embed.root.scrollIntoView = vi.fn();
    embed.root.getBoundingClientRect = vi.fn(() => ({ top: 0 }));
    Object.defineProperty(window, "pageYOffset", {
      configurable: true,
      value: 60,
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_SCROLL_TO_TOP",
        payload: { behavior: "auto", reason: "events-page-mounted" },
      },
      origin: window.location.origin,
    }));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
    expect(embed.root.scrollIntoView).not.toHaveBeenCalled();

    window.scrollTo = originalScrollTo;
  });

  it("uses the parent viewport immediately and ignores the child iframe's self-reported viewport height", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 768,
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "creator",
      initialRoute: "events",
    });

    expect(embed.iframe.classList.contains("fs-events-embed__iframe--viewport")).toBe(true);
    expect(embed.iframe.style.getPropertyValue("--fs-events-embed-height")).toBe("768px");

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_RESIZE",
        payload: { mode: "viewport", height: 512 },
      },
      origin: window.location.origin,
    }));

    expect(embed.iframe.classList.contains("fs-events-embed__iframe--viewport")).toBe(true);
    expect(embed.iframe.style.getPropertyValue("--fs-events-embed-height")).toBe("768px");
  });

  it("subtracts the visible WordPress mobile header from the events iframe viewport height", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 768,
    });
    const mobileHeader = document.createElement("div");
    mobileHeader.setAttribute("data-mobile-header", "");
    mobileHeader.style.position = "fixed";
    mobileHeader.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      bottom: 60,
      height: 60,
    }));
    document.body.appendChild(mobileHeader);

    const container = document.createElement("div");
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "creator",
      initialRoute: "events",
    });

    expect(embed.iframe.style.getPropertyValue("--fs-events-embed-height")).toBe("708px");
    expect(hostCss.match(/\.fs-events-embed__iframe--viewport\s*\{([^}]*)\}/)?.[1] || "")
      .toContain("min-height: 0");
  });

  it("raises only the active events iframe while booking details are visible and restores it on close", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "creator",
      initialRoute: "events",
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: window,
      data: {
        type: "FS_EVENTS_BOOKING_DETAILS_VISIBILITY",
        payload: { open: true },
      },
      origin: window.location.origin,
    }));
    expect(embed.iframe.classList.contains("fs-events-embed__iframe--booking-details-open")).toBe(false);

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_BOOKING_DETAILS_VISIBILITY",
        payload: { open: true },
      },
      origin: window.location.origin,
    }));
    expect(embed.iframe.classList.contains("fs-events-embed__iframe--booking-details-open")).toBe(true);

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_BOOKING_DETAILS_VISIBILITY",
        payload: { open: false },
      },
      origin: window.location.origin,
    }));
    expect(embed.iframe.classList.contains("fs-events-embed__iframe--booking-details-open")).toBe(false);

    embed.iframe.classList.add("fs-events-embed__iframe--booking-details-open");
    embed.destroy();
    expect(embed.iframe.classList.contains("fs-events-embed__iframe--booking-details-open")).toBe(false);
  });

  it("limits the fixed full-viewport booking-details host layer to mobile", () => {
    const mobileRuleStart = hostCss.indexOf("@media screen and (max-width: 1023px)");
    const mobileCss = mobileRuleStart >= 0 ? hostCss.slice(mobileRuleStart) : "";
    const rule = mobileCss.match(/\.fs-events-embed__iframe--booking-details-open\s*\{([^}]*)\}/)?.[1] || "";

    expect(mobileRuleStart).toBeGreaterThanOrEqual(0);
    expect(rule).toContain("position: fixed");
    expect(rule).toContain("inset: 0");
    expect(rule).toContain("z-index: 100200");
    expect(rule).toContain("height: 100dvh");
  });

  it("warns the WordPress host page before unload when the events form is dirty", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "creator",
      initialRoute: "create-private",
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_FORM_DIRTY_STATE",
        payload: { dirty: true },
      },
      origin: window.location.origin,
    }));

    const dirtyBeforeUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirtyBeforeUnload);
    expect(dirtyBeforeUnload.defaultPrevented).toBe(true);

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_FORM_DIRTY_STATE",
        payload: { dirty: false },
      },
      origin: window.location.origin,
    }));

    const cleanBeforeUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(cleanBeforeUnload);
    expect(cleanBeforeUnload.defaultPrevented).toBe(false);
  });

  it("refreshes viewport iframe height from the parent visual viewport and stops after destroy", () => {
    const visualViewport = new EventTarget();
    Object.defineProperty(visualViewport, "height", {
      configurable: true,
      writable: true,
      value: 640,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: visualViewport,
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "creator",
      initialRoute: "events",
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_RESIZE",
        payload: { mode: "viewport", height: 512 },
      },
      origin: window.location.origin,
    }));
    expect(embed.iframe.style.getPropertyValue("--fs-events-embed-height")).toBe("640px");

    visualViewport.height = 590;
    visualViewport.dispatchEvent(new Event("resize"));
    expect(embed.iframe.style.getPropertyValue("--fs-events-embed-height")).toBe("590px");

    embed.destroy();
    visualViewport.height = 700;
    visualViewport.dispatchEvent(new Event("resize"));
    expect(embed.iframe.style.getPropertyValue("--fs-events-embed-height")).toBe("590px");
  });

  it("reactively posts settled host viewport widths and stops after destroy", () => {
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 820,
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "creator",
      initialRoute: "events",
    });
    const postMessage = vi.spyOn(embed.iframe.contentWindow, "postMessage");

    vi.advanceTimersByTime(0);
    expect(postMessage).toHaveBeenCalledWith({
      type: "FS_EVENTS_HOST_VIEWPORT_UPDATE",
      payload: { hostViewportWidth: 820 },
    }, window.location.origin);

    postMessage.mockClear();
    window.innerWidth = 960;
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(320);
    expect(postMessage.mock.calls.filter(([message]) => (
      message.type === "FS_EVENTS_HOST_VIEWPORT_UPDATE"
      && message.payload.hostViewportWidth === 960
    ))).toHaveLength(3);

    postMessage.mockClear();
    embed.destroy();
    window.innerWidth = 1023;
    window.dispatchEvent(new Event("orientationchange"));
    vi.advanceTimersByTime(500);
    expect(postMessage).not.toHaveBeenCalled();

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
  });

  it("posts auth updates to the active booking popup without remounting", () => {
    const popup = window.FSEventsEmbed.openFanBookingPopup({
      creatorId: 1407,
      fanId: 0,
    });
    const postMessage = vi.spyOn(popup.iframe.contentWindow, "postMessage");

    expect(window.FSEventsEmbed.updateFanBookingAuth({
      fanId: 2615,
      jwtToken: "jwt_live",
    })).toBe(true);

    expect(postMessage).toHaveBeenCalledWith(
      {
        type: "FS_FAN_BOOKING_AUTH_UPDATE",
        payload: {
          fanId: 2615,
          jwtToken: "jwt_live",
        },
      },
      window.location.origin,
    );
  });

  it("broadcasts auth updates to active events embeds and forgets destroyed embeds", () => {
    const firstContainer = document.createElement("div");
    const secondContainer = document.createElement("div");
    document.body.append(firstContainer, secondContainer);
    const first = window.FSEventsEmbed.mount(firstContainer, { creatorId: 1407 });
    const second = window.FSEventsEmbed.mount(secondContainer, { creatorId: 1407 });
    const firstPostMessage = vi.spyOn(first.iframe.contentWindow, "postMessage");
    const secondPostMessage = vi.spyOn(second.iframe.contentWindow, "postMessage");

    expect(window.FSEventsEmbed.updateAuth({ jwtToken: "jwt_fresh" })).toBe(2);
    expect(firstPostMessage).toHaveBeenCalledWith({
      type: "FS_EVENTS_AUTH_UPDATE",
      payload: { jwtToken: "jwt_fresh" },
    }, window.location.origin);
    expect(secondPostMessage).toHaveBeenCalledWith({
      type: "FS_EVENTS_AUTH_UPDATE",
      payload: { jwtToken: "jwt_fresh" },
    }, window.location.origin);

    first.destroy();
    firstPostMessage.mockClear();
    secondPostMessage.mockClear();
    expect(window.FSEventsEmbed.updateAuth({ jwtToken: "jwt_newer" })).toBe(1);
    expect(firstPostMessage).not.toHaveBeenCalled();
    expect(secondPostMessage).toHaveBeenCalledOnce();
  });

  it("hides the loading layer when the child-ready message arrives", () => {
    const popup = window.FSEventsEmbed.openFanBookingPopup({
      creatorId: 1407,
      fanId: 25,
    });

    const loadingLayer = popup.overlay.querySelector(".fs-fan-booking-popup__loading");
    expect(loadingLayer).not.toBeNull();

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_FAN_BOOKING_CHILD_READY", payload: {} },
      origin: window.location.origin,
    }));

    expect(loadingLayer.classList.contains("fs-fan-booking-popup__loading--hidden")).toBe(true);
    vi.advanceTimersByTime(250);
    expect(popup.overlay.querySelector(".fs-fan-booking-popup__loading")).toBeNull();
  });

  it("registers the message listener before iframe navigation starts", () => {
    const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "src");
    const originalAddEventListener = window.addEventListener.bind(window);
    let operationIndex = 0;
    let messageListenerCallIndex = -1;
    let iframeSrcCallIndex = -1;

    vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
      if (type === "message" && messageListenerCallIndex === -1) {
        messageListenerCallIndex = operationIndex++;
      }
      return originalAddEventListener(type, listener, options);
    });

    Object.defineProperty(HTMLIFrameElement.prototype, "src", {
      configurable: true,
      enumerable: srcDescriptor?.enumerable ?? true,
      get() {
        return srcDescriptor?.get ? srcDescriptor.get.call(this) : this.getAttribute("src");
      },
      set(value) {
        if (iframeSrcCallIndex === -1) {
          iframeSrcCallIndex = operationIndex++;
        }
        if (srcDescriptor?.set) {
          srcDescriptor.set.call(this, value);
          return;
        }
        this.setAttribute("src", value);
      },
    });

    try {
      window.FSEventsEmbed.openFanBookingPopup({
        creatorId: 1407,
        fanId: 25,
      });

      expect(messageListenerCallIndex).toBeGreaterThanOrEqual(0);
      expect(iframeSrcCallIndex).toBeGreaterThanOrEqual(0);
      expect(messageListenerCallIndex).toBeLessThan(iframeSrcCallIndex);
    } finally {
      if (srcDescriptor) {
        Object.defineProperty(HTMLIFrameElement.prototype, "src", srcDescriptor);
      }
    }
  });

  it("hides the loading layer on iframe load fallback when child-ready is missed", () => {
    const popup = window.FSEventsEmbed.openFanBookingPopup({
      creatorId: 1407,
      fanId: 25,
    });

    const loadingLayer = popup.overlay.querySelector(".fs-fan-booking-popup__loading");
    expect(loadingLayer).not.toBeNull();

    popup.iframe.dispatchEvent(new Event("load"));
    expect(loadingLayer.classList.contains("fs-fan-booking-popup__loading--hidden")).toBe(false);

    vi.advanceTimersByTime(200);
    expect(loadingLayer.classList.contains("fs-fan-booking-popup__loading--hidden")).toBe(true);
  });

  it("handles repeated ready and load signals without throwing or re-showing the skeleton", () => {
    const popup = window.FSEventsEmbed.openFanBookingPopup({
      creatorId: 1407,
      fanId: 25,
    });

    const loadingLayer = popup.overlay.querySelector(".fs-fan-booking-popup__loading");
    popup.iframe.dispatchEvent(new Event("load"));
    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_FAN_BOOKING_CHILD_READY", payload: {} },
      origin: window.location.origin,
    }));
    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_FAN_BOOKING_CHILD_READY", payload: {} },
      origin: window.location.origin,
    }));

    expect(loadingLayer.classList.contains("fs-fan-booking-popup__loading--hidden")).toBe(true);
    vi.advanceTimersByTime(250);
    expect(popup.overlay.querySelector(".fs-fan-booking-popup__loading")).toBeNull();
  });

  it("closes and tears down the popup when the iframe requests close", () => {
    const onClose = vi.fn();
    const popup = window.FSEventsEmbed.openFanBookingPopup({
      creatorId: 1407,
      fanId: 25,
      onClose,
    });

    expect(document.body.contains(popup.overlay)).toBe(true);

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_FAN_BOOKING_CLOSE_REQUEST", payload: {} },
      origin: window.location.origin,
    }));

    expect(document.body.contains(popup.overlay)).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(window.__FSFanBookingActivePopup).toBeNull();
  });

  it("queues token balance UI refreshes requested by the active booking iframe", async () => {
    let releaseFirstRefresh;
    const firstRefresh = new Promise((resolve) => {
      releaseFirstRefresh = resolve;
    });
    const updateBalanceUIs = vi.fn()
      .mockReturnValueOnce(firstRefresh)
      .mockResolvedValueOnce(undefined);
    window.tokenManager = { updateBalanceUIs };
    const popup = window.FSEventsEmbed.openFanBookingPopup({ creatorId: 1407, fanId: 25 });

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST", payload: { reason: "top-up" } },
      origin: window.location.origin,
    }));
    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST", payload: { reason: "booking" } },
      origin: window.location.origin,
    }));

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(updateBalanceUIs).toHaveBeenCalledTimes(1);
    releaseFirstRefresh();
    for (let index = 0; index < 10; index += 1) {
      await Promise.resolve();
    }
    expect(updateBalanceUIs).toHaveBeenCalledTimes(2);
  });

  it("ignores balance refresh messages from outside the active booking iframe", async () => {
    const updateBalanceUIs = vi.fn();
    window.tokenManager = { updateBalanceUIs };
    window.FSEventsEmbed.openFanBookingPopup({ creatorId: 1407, fanId: 25 });

    window.dispatchEvent(new MessageEvent("message", {
      source: window,
      data: { type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST", payload: { reason: "booking" } },
      origin: window.location.origin,
    }));
    await Promise.resolve();

    expect(updateBalanceUIs).not.toHaveBeenCalled();
  });

  it("contains token balance refresh failures", async () => {
    const refreshError = new Error("refresh failed");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    window.tokenManager = { updateBalanceUIs: vi.fn().mockRejectedValue(refreshError) };
    const popup = window.FSEventsEmbed.openFanBookingPopup({ creatorId: 1407, fanId: 25 });

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST", payload: { reason: "booking" } },
      origin: window.location.origin,
    }));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(
      "[FSEventsEmbed] Failed to refresh token balance UIs",
      refreshError,
    );
    consoleError.mockRestore();
  });

  it("continues processing later refreshes after one refresh rejects", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const updateBalanceUIs = vi.fn()
      .mockRejectedValueOnce(new Error("temporary refresh failure"))
      .mockResolvedValueOnce(undefined);
    window.tokenManager = { updateBalanceUIs };
    const popup = window.FSEventsEmbed.openFanBookingPopup({ creatorId: 1407, fanId: 25 });

    for (const reason of ["first", "second"]) {
      window.dispatchEvent(new MessageEvent("message", {
        source: popup.iframe.contentWindow,
        data: { type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST", payload: { reason } },
        origin: window.location.origin,
      }));
    }
    for (let index = 0; index < 12; index += 1) await Promise.resolve();

    expect(updateBalanceUIs).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });

  it("contains balance refresh requests when the WordPress token manager is unavailable", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const popup = window.FSEventsEmbed.openFanBookingPopup({ creatorId: 1407, fanId: 25 });

    window.dispatchEvent(new MessageEvent("message", {
      source: popup.iframe.contentWindow,
      data: { type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST", payload: { reason: "top-up" } },
      origin: window.location.origin,
    }));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleWarn).toHaveBeenCalledWith(
      "[FSEventsEmbed] tokenManager.updateBalanceUIs is unavailable",
      { reason: "top-up" },
    );
    consoleWarn.mockRestore();
  });

  it("refreshes balances for fan Events and booking-details iframes only", async () => {
    const updateBalanceUIs = vi.fn().mockResolvedValue(undefined);
    window.tokenManager = { updateBalanceUIs };

    const container = document.createElement("div");
    document.body.appendChild(container);
    const events = window.FSEventsEmbed.mount(container, {
      fanId: 25,
      userRole: "fan",
    });
    window.dispatchEvent(new MessageEvent("message", {
      source: events.iframe.contentWindow,
      data: {
        type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST",
        payload: { action: "decline_adjustment", bookingId: "booking-events" },
      },
    }));

    const details = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking-details",
      fanId: 25,
      userRole: "fan",
    });
    window.dispatchEvent(new MessageEvent("message", {
      source: details.iframe.contentWindow,
      data: {
        type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST",
        payload: { action: "accept_adjustment", bookingId: "booking-details" },
      },
    }));

    for (let index = 0; index < 8; index += 1) await Promise.resolve();
    expect(updateBalanceUIs).toHaveBeenCalledTimes(2);
  });

  it("rejects fan-balance messages from creator and unrelated Events frames", async () => {
    const updateBalanceUIs = vi.fn().mockResolvedValue(undefined);
    window.tokenManager = { updateBalanceUIs };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const events = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      userRole: "creator",
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: events.iframe.contentWindow,
      data: { type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST", payload: { action: "cancel" } },
    }));
    window.dispatchEvent(new MessageEvent("message", {
      source: window,
      data: { type: "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST", payload: { action: "cancel" } },
    }));
    await Promise.resolve();
    await Promise.resolve();

    expect(updateBalanceUIs).not.toHaveBeenCalled();
  });

  it("queues a balance refresh when a fan booking-details top-up succeeds", async () => {
    const updateBalanceUIs = vi.fn().mockResolvedValue(undefined);
    window.tokenManager = { updateBalanceUIs };
    let successPromise;
    window.openTipPopup = vi.fn((options) => {
      successPromise = options.successCallback();
      return successPromise;
    });
    const details = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking-topup",
      fanId: 25,
      userRole: "fan",
    });
    const postMessage = vi.spyOn(details.iframe.contentWindow, "postMessage");

    window.dispatchEvent(new MessageEvent("message", {
      source: details.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED",
        payload: { bookingId: "booking-topup", requiredTokens: 3, currentUserId: 25, creatorUserId: 1407 },
      },
    }));
    await successPromise;

    expect(updateBalanceUIs).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({
      type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS",
      payload: { bookingId: "booking-topup" },
    }, window.location.origin);
  });

  it("does not notify booking details of top-up success until the WordPress refresh settles", async () => {
    let resolveRefresh;
    let successPromise;
    const updateBalanceUIs = vi.fn(() => new Promise((resolve) => { resolveRefresh = resolve; }));
    window.tokenManager = { updateBalanceUIs };
    window.openTipPopup = vi.fn((options) => {
      successPromise = options.successCallback();
      return successPromise;
    });
    const details = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking-deferred-topup",
      fanId: 25,
      userRole: "fan",
    });
    const postMessage = vi.spyOn(details.iframe.contentWindow, "postMessage");

    window.dispatchEvent(new MessageEvent("message", {
      source: details.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED",
        payload: { bookingId: "booking-deferred-topup", requiredTokens: 100, currentUserId: 25, creatorUserId: 1407 },
      },
    }));
    await Promise.resolve();
    await Promise.resolve();

    expect(updateBalanceUIs).toHaveBeenCalledTimes(1);
    expect(postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS",
    }), expect.anything());

    resolveRefresh();
    await successPromise;
    expect(postMessage).toHaveBeenCalledWith({
      type: "FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS",
      payload: { bookingId: "booking-deferred-topup" },
    }, window.location.origin);
    details.destroy();
  });

  it("opens scheduled meeting URLs through the shared WordPress overlay", () => {
    const container = document.createElement("div");
    const onOpenUrl = vi.fn();
    const overlayOpen = vi.fn(() => ({ close: vi.fn() }));
    document.body.appendChild(container);
    window.FSScheduledCallOverlay = { open: overlayOpen };
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      onOpenUrl,
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: {
        type: "FS_EVENTS_OPEN_URL",
        payload: {
          url: "/scheduled-meeting/?booking_id=b_evt_123&source=calendar",
          target: "_self",
        },
      },
      origin: window.location.origin,
    }));

    expect(overlayOpen).toHaveBeenCalledWith(
      "/scheduled-meeting/?booking_id=b_evt_123&source=calendar",
      { source: "events_embed" },
    );
    expect(onOpenUrl).not.toHaveBeenCalled();
  });

  it("retains normal URL handling for unrelated URLs", () => {
    const container = document.createElement("div");
    const onOpenUrl = vi.fn();
    const overlayOpen = vi.fn();
    document.body.appendChild(container);
    window.FSScheduledCallOverlay = { open: overlayOpen };
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      onOpenUrl,
    });
    const payload = { url: "/dashboard/settings", target: "_self" };

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: { type: "FS_EVENTS_OPEN_URL", payload },
      origin: window.location.origin,
    }));

    expect(onOpenUrl).toHaveBeenCalledWith(payload);
    expect(overlayOpen).not.toHaveBeenCalled();
  });

  it("falls back to existing navigation handling when the overlay service is unavailable", () => {
    const container = document.createElement("div");
    const onOpenUrl = vi.fn();
    document.body.appendChild(container);
    const embed = window.FSEventsEmbed.mount(container, {
      creatorId: 1407,
      onOpenUrl,
    });
    const payload = {
      url: "/scheduled-meeting/?event_id=evt_group&start_iso=2026-07-28T12%3A00%3A00.000Z",
      target: "_self",
    };

    window.dispatchEvent(new MessageEvent("message", {
      source: embed.iframe.contentWindow,
      data: { type: "FS_EVENTS_OPEN_URL", payload },
      origin: window.location.origin,
    }));

    expect(onOpenUrl).toHaveBeenCalledWith(payload);
  });
});
