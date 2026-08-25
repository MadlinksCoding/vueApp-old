export const FS_EVENTS_BOOTSTRAP = "FS_EVENTS_BOOTSTRAP";
export const FS_EVENTS_AUTH_UPDATE = "FS_EVENTS_AUTH_UPDATE";
export const FS_EVENTS_HOST_VIEWPORT_UPDATE = "FS_EVENTS_HOST_VIEWPORT_UPDATE";
export const FS_EVENTS_CHILD_READY = "FS_EVENTS_CHILD_READY";
export const FS_EVENTS_RESIZE = "FS_EVENTS_RESIZE";
export const FS_EVENTS_OPEN_URL = "FS_EVENTS_OPEN_URL";
export const FS_EVENTS_SCROLL_TO_TOP = "FS_EVENTS_SCROLL_TO_TOP";
export const FS_EVENTS_FORM_DIRTY_STATE = "FS_EVENTS_FORM_DIRTY_STATE";
export const FS_EVENTS_FORM_OPEN_STATE = "FS_EVENTS_FORM_OPEN_STATE";
export const FS_EVENTS_BOOKING_DETAILS_VISIBILITY = "FS_EVENTS_BOOKING_DETAILS_VISIBILITY";
export const FS_EVENTS_BOOKING_DETAILS_READY = "FS_EVENTS_BOOKING_DETAILS_READY";
export const FS_EVENTS_BOOKING_DETAILS_CLOSE_REQUEST = "FS_EVENTS_BOOKING_DETAILS_CLOSE_REQUEST";
export const FS_EVENTS_BOOKING_DETAILS_UPDATED = "FS_EVENTS_BOOKING_DETAILS_UPDATED";
export const FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED = "FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED";
export const FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS = "FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS";
export const FS_EVENTS_BOOKING_DETAILS_TOPUP_FAILED = "FS_EVENTS_BOOKING_DETAILS_TOPUP_FAILED";
export const FS_EVENTS_BOOKING_DETAILS_DECISION_VISIBILITY = "FS_EVENTS_BOOKING_DETAILS_DECISION_VISIBILITY";
export const FS_EVENTS_BOOKING_CHAT_SYNC = "FS_EVENTS_BOOKING_CHAT_SYNC";

const MESSAGE_SOURCE = "fs-events-embed";

export function isEmbeddedIframe() {
  return typeof window !== "undefined" && window.parent && window.parent !== window;
}

function postToParent(type, payload = {}) {
  if (!isEmbeddedIframe()) return;

  window.parent.postMessage({
    source: MESSAGE_SOURCE,
    type,
    payload,
  }, "*");
}

export function announceEventsEmbedReady() {
  postToParent(FS_EVENTS_CHILD_READY, {});
}

export function notifyEventsEmbedResize(height, options = {}) {
  const safeHeight = Number.isFinite(Number(height)) ? Math.max(320, Number(height)) : 320;
  postToParent(FS_EVENTS_RESIZE, {
    height: safeHeight,
    mode: options.mode === "viewport" ? "viewport" : "content",
  });
}

export function requestEventsEmbedOpenUrl(payload = {}) {
  postToParent(FS_EVENTS_OPEN_URL, payload);
}

export function requestEventsEmbedScrollToTop(payload = {}) {
  postToParent(FS_EVENTS_SCROLL_TO_TOP, {
    reason: typeof payload.reason === "string" ? payload.reason : "",
    behavior: payload.behavior === "smooth" ? "smooth" : "auto",
  });
}

export function notifyEventsEmbedFormDirtyState(isDirty) {
  postToParent(FS_EVENTS_FORM_DIRTY_STATE, {
    dirty: Boolean(isDirty),
  });
}

export function notifyEventsEmbedFormOpenState(isOpen) {
  postToParent(FS_EVENTS_FORM_OPEN_STATE, {
    isOpen: Boolean(isOpen),
  });
}

export function notifyEventsEmbedBookingDetailsVisibility(isOpen) {
  postToParent(FS_EVENTS_BOOKING_DETAILS_VISIBILITY, {
    open: Boolean(isOpen),
  });
}

export function notifyBookingDetailsReady(payload = {}) {
  postToParent(FS_EVENTS_BOOKING_DETAILS_READY, payload);
}

export function requestBookingDetailsClose(payload = {}) {
  postToParent(FS_EVENTS_BOOKING_DETAILS_CLOSE_REQUEST, payload);
}

export function notifyBookingDetailsUpdated(payload = {}) {
  postToParent(FS_EVENTS_BOOKING_DETAILS_UPDATED, payload);
}

export function requestBookingDetailsTopup(payload = {}) {
  postToParent(FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED, payload);
}

/**
 * Asks the chat embed mounted on the same host page to mirror a booking change:
 * refresh its cached booking, re-render the request bubble, socket-push it to the
 * other participant and append an activity log. The events embed has no chat socket
 * of its own, so it delegates that half of the update through the host.
 *
 * Best effort — nothing happens when no chat embed is mounted.
 */
export function requestBookingChatSync(payload = {}) {
  postToParent(FS_EVENTS_BOOKING_CHAT_SYNC, payload);
}

export function notifyBookingDetailsDecisionVisibility(isOpen) {
  postToParent(FS_EVENTS_BOOKING_DETAILS_DECISION_VISIBILITY, {
    open: Boolean(isOpen),
  });
}

export function installBookingDetailsTopupListener(handler) {
  if (typeof window === "undefined") return () => {};

  const listener = (event) => {
    if (event.source !== window.parent) return;
    const type = event.data?.type;
    if (![FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS, FS_EVENTS_BOOKING_DETAILS_TOPUP_FAILED].includes(type)) return;
    handler({ ok: type === FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS, payload: event.data?.payload || {} }, event);
  };

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

export function installEventsEmbedBootstrapListener(handler) {
  if (typeof window === "undefined") return () => {};

  const listener = (event) => {
    if (event.source !== window.parent) return;
    const data = event.data || {};
    if (data?.type !== FS_EVENTS_BOOTSTRAP) return;
    handler(data.payload || {}, event);
  };

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

export function installEventsEmbedAuthUpdateListener(handler) {
  if (typeof window === "undefined") return () => {};

  const listener = (event) => {
    if (event.source !== window.parent) return;
    const data = event.data || {};
    if (data?.type !== FS_EVENTS_AUTH_UPDATE) return;
    handler(data.payload || {}, event);
  };

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

export function installEventsEmbedHostViewportListener(handler) {
  if (typeof window === "undefined") return () => {};

  const listener = (event) => {
    if (event.source !== window.parent) return;
    const data = event.data || {};
    if (data?.type !== FS_EVENTS_HOST_VIEWPORT_UPDATE) return;
    handler(data.payload || {}, event);
  };

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
