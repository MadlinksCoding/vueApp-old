import { beforeEach, describe, expect, it, vi } from "vitest";

describe("fs-events-host openFanBookingPopup", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = "";
    delete window.FSScheduledCallOverlay;
    delete window.tokenManager;
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
    const popup = window.FSEventsEmbed.openBookingDetailsPopup({
      bookingId: "booking_secret_123",
      creatorId: 1407,
      userRole: "creator",
      jwtToken: "jwt_secret",
    });
    const postMessage = vi.spyOn(popup.iframe.contentWindow, "postMessage");

    popup.iframe.dispatchEvent(new Event("load"));

    expect(popup.overlay.matches("[data-fs-booking-details-popup]")).toBe(true);
    expect(popup.overlay.querySelector(".fs-booking-details-popup__panel")).not.toBeNull();
    expect(popup.iframe.src).not.toContain("booking_secret_123");
    expect(popup.iframe.src).not.toContain("jwt_secret");
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FS_EVENTS_BOOTSTRAP",
        payload: expect.objectContaining({
          initialRoute: "booking-details",
          bookingId: "booking_secret_123",
          jwtToken: "jwt_secret",
        }),
      }),
      window.location.origin,
    );

    popup.destroy();
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

    expect(onBookingUpdated).toHaveBeenCalledTimes(1);
    expect(onBookingUpdated).toHaveBeenCalledWith(payload);
    expect(document.body.contains(popup.overlay)).toBe(false);
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

    expect(embed.root.scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      inline: "nearest",
      behavior: "auto",
    });
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 300,
      left: 0,
      behavior: "auto",
    });

    window.scrollTo = originalScrollTo;
  });

  it("applies viewport resize payload height to the events iframe", () => {
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

    expect(embed.iframe.classList.contains("fs-events-embed__iframe--viewport")).toBe(true);
    expect(embed.iframe.style.getPropertyValue("--fs-events-embed-height")).toBe("512px");
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
    expect(embed.iframe.style.getPropertyValue("--fs-events-embed-height")).toBe("512px");

    visualViewport.height = 590;
    visualViewport.dispatchEvent(new Event("resize"));
    expect(embed.iframe.style.getPropertyValue("--fs-events-embed-height")).toBe("590px");

    embed.destroy();
    visualViewport.height = 700;
    visualViewport.dispatchEvent(new Event("resize"));
    expect(embed.iframe.style.getPropertyValue("--fs-events-embed-height")).toBe("590px");
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
