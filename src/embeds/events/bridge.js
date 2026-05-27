export const FS_EVENTS_BOOTSTRAP = "FS_EVENTS_BOOTSTRAP";
export const FS_EVENTS_CHILD_READY = "FS_EVENTS_CHILD_READY";
export const FS_EVENTS_RESIZE = "FS_EVENTS_RESIZE";
export const FS_EVENTS_OPEN_URL = "FS_EVENTS_OPEN_URL";
export const FS_EVENTS_SCROLL_TO_TOP = "FS_EVENTS_SCROLL_TO_TOP";
export const FS_EVENTS_FORM_DIRTY_STATE = "FS_EVENTS_FORM_DIRTY_STATE";

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
