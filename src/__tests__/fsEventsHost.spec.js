import { beforeEach, describe, expect, it, vi } from "vitest";

describe("fs-events-host openFanBookingPopup", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = "";
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
});
