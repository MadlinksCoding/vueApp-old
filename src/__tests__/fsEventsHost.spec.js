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
