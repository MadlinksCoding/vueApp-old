export const FS_FAN_BOOKING_BOOTSTRAP = "FS_FAN_BOOKING_BOOTSTRAP";
export const FS_FAN_BOOKING_CHILD_READY = "FS_FAN_BOOKING_CHILD_READY";
export const FS_FAN_BOOKING_CLOSE_REQUEST = "FS_FAN_BOOKING_CLOSE_REQUEST";
export const FS_FAN_BOOKING_CREATED = "FS_FAN_BOOKING_CREATED";
export const FS_FAN_BOOKING_FAILED = "FS_FAN_BOOKING_FAILED";
export const FS_FAN_BOOKING_AUTH_UPDATE = "FS_FAN_BOOKING_AUTH_UPDATE";

const MESSAGE_SOURCE = "fs-fan-booking-embed";
import { logFanBookingDebug } from "@/embeds/fanBooking/debug.js";

export function isEmbeddedIframe() {
  return typeof window !== "undefined" && window.parent && window.parent !== window;
}

function postToParent(type, payload = {}) {
  if (!isEmbeddedIframe()) return;

  logFanBookingDebug("bridge", "postToParent", { type, payload });
  window.parent.postMessage({
    source: MESSAGE_SOURCE,
    type,
    payload,
  }, "*");
}

export function announceOneOnOneBookingReady() {
  postToParent(FS_FAN_BOOKING_CHILD_READY, {});
}

export function requestOneOnOneBookingClose() {
  postToParent(FS_FAN_BOOKING_CLOSE_REQUEST, {});
}

export function notifyOneOnOneBookingCreated(payload = {}) {
  postToParent(FS_FAN_BOOKING_CREATED, payload);
}

export function notifyOneOnOneBookingFailed(payload = {}) {
  postToParent(FS_FAN_BOOKING_FAILED, payload);
}

export function installOneOnOneBookingBootstrapListener(handler) {
  if (typeof window === "undefined") return () => { };

  const listener = (event) => {
    if (event.source !== window.parent) return;
    const data = event.data || {};
    if (data?.type !== FS_FAN_BOOKING_BOOTSTRAP) return;
    logFanBookingDebug("bridge", "bootstrap:received", {
      payload: data.payload || {},
      origin: event.origin,
    });
    handler(data.payload || {}, event);
  };

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

export function installOneOnOneBookingAuthUpdateListener(handler) {
  if (typeof window === "undefined") return () => { };

  const listener = (event) => {
    if (event.source !== window.parent) return;
    const data = event.data || {};
    if (data?.type !== FS_FAN_BOOKING_AUTH_UPDATE) return;
    logFanBookingDebug("bridge", "auth-update:received", {
      payload: data.payload || {},
      origin: event.origin,
    });
    handler(data.payload || {}, event);
  };

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
