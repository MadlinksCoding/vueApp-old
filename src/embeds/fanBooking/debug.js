const DEBUG_QUERY_KEYS = ["debugFanBooking", "debugBooking", "debug"];
const DEBUG_STORAGE_KEY = "fsFanBookingDebug";
const DEBUG_MESSAGE_TYPE = "FS_FAN_BOOKING_DEBUG";
const DEBUG_MESSAGE_SOURCE = "fs-fan-booking-embed";

function redactJwtFromDebugString(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/([?&]jwtToken=)[^&#]*/g, "$1[redacted]")
    .replace(/([?&]backendJwtToken=)[^&#]*/g, "$1[redacted]");
}

function isJwtDebugKey(key) {
  const normalized = String(key || "").toLowerCase().replace(/[_-]/g, "");
  return normalized === "jwttoken" || normalized === "backendjwttoken";
}

function redactJwtFromDebugPayload(value) {
  if (typeof value === "string") return redactJwtFromDebugString(value);
  if (!value || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(redactJwtFromDebugPayload);
  }

  return Object.keys(value).reduce((output, key) => {
    const normalizedKey = String(key || "").toLowerCase().replace(/[_-]/g, "");
    if (isJwtDebugKey(key)) {
      output[normalizedKey === "backendjwttoken" ? "hasBackendJwtToken" : "hasJwtToken"] =
        typeof value[key] === "string" && value[key].trim() !== "";
      return output;
    }

    output[key] = redactJwtFromDebugPayload(value[key]);
    return output;
  }, {});
}

function readWindowFlag() {
  if (typeof window === "undefined") return false;

  try {
    if (window.__FSFanBookingDebug === true) return true;
    if (window.__FSFanBookingDebug?.enabled === true) return true;
  } catch (_) {
    return false;
  }

  return false;
}

function readUrlFlag() {
  if (typeof window === "undefined") return false;

  try {
    const params = new URLSearchParams(window.location.search);
    return DEBUG_QUERY_KEYS.some((key) => {
      const value = params.get(key);
      return value === "1" || value === "true";
    });
  } catch (_) {
    return false;
  }
}

function readStorageFlag() {
  if (typeof window === "undefined") return false;

  try {
    const value = window.localStorage?.getItem(DEBUG_STORAGE_KEY);
    return value === "1" || value === "true";
  } catch (_) {
    return false;
  }
}

export function isFanBookingDebugEnabled() {
  return readWindowFlag() || readUrlFlag() || readStorageFlag();
}

export function logFanBookingDebug(scope, event, payload = undefined) {
  if (!isFanBookingDebugEnabled()) return;
  if (typeof window === "undefined") return;

  const safePayload = payload === undefined ? null : redactJwtFromDebugPayload(payload);
  const entry = {
    at: new Date().toISOString(),
    scope,
    event,
    payload: safePayload,
  };

  if (!window.__FSFanBookingDebug || window.__FSFanBookingDebug === true) {
    window.__FSFanBookingDebug = {
      enabled: true,
      entries: [],
    };
  }

  if (Array.isArray(window.__FSFanBookingDebug.entries)) {
    window.__FSFanBookingDebug.entries.push(entry);
  }

  try {
    console.log(`[FSFanBooking][${scope}] ${event}`, payload === undefined ? "" : safePayload);
  } catch (_) {
    // Ignore console serialization errors.
  }

  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        source: DEBUG_MESSAGE_SOURCE,
        type: DEBUG_MESSAGE_TYPE,
        payload: entry,
      }, "*");
    }
  } catch (_) {
    // Ignore cross-window debug forwarding errors.
  }
}

export function markFanBookingDebugEnabled(reason = "manual") {
  if (typeof window === "undefined") return;

  if (!window.__FSFanBookingDebug || window.__FSFanBookingDebug === true) {
    window.__FSFanBookingDebug = {
      enabled: true,
      entries: [],
    };
  } else {
    window.__FSFanBookingDebug.enabled = true;
  }

  try {
    window.localStorage?.setItem(DEBUG_STORAGE_KEY, "1");
  } catch (_) {
    // Ignore storage restrictions.
  }

  logFanBookingDebug("debug", "enabled", { reason });
}
