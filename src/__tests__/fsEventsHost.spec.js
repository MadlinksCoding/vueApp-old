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

  it("rejects fanId 0", () => {
    expect(() => {
      window.FSEventsEmbed.openFanBookingPopup({
        creatorId: 1407,
        fanId: 0,
      });
    }).toThrow("positive fanId");
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
