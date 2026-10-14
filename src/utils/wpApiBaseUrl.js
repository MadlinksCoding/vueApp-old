function normalizeWpSiteBaseUrl(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) return "";

  const lowered = normalized.toLowerCase();
  if (lowered === "undefined" || lowered === "null") return "";

  return normalized.replace(/\/+$/, "");
}

function getConfiguredWpSiteBaseUrl() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_WEB_BASE_URL) {
    return import.meta.env.VITE_WEB_BASE_URL;
  }

  return "";
}

function getBrowserOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  if (typeof globalThis !== "undefined" && globalThis.location?.origin) {
    return globalThis.location.origin;
  }

  return "";
}

export function resolveWpSiteBaseUrl(options = {}) {
  const pathname = options.pathname !== undefined
    ? options.pathname
    : (typeof window !== "undefined" ? window.location?.pathname : "");
  const browserOrigin = normalizeWpSiteBaseUrl(
    options.origin !== undefined ? options.origin : getBrowserOrigin(),
  );
  // WordPress embeds can be copied between environments without rebuilding.
  // Keep their links and callbacks on the site that actually serves the embed.
  if (browserOrigin && /^\/wp-content\/plugins\/fansocial\/bookings-embed\//.test(String(pathname || ""))) {
    return browserOrigin;
  }

  const configured = normalizeWpSiteBaseUrl(
    options.envValue !== undefined ? options.envValue : getConfiguredWpSiteBaseUrl(),
  );
  if (configured) return configured;

  if (browserOrigin) return browserOrigin;

  return "";
}

export function buildWpApiUrl(path = "", options = {}) {
  const baseUrl = resolveWpSiteBaseUrl(options);
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  const apiRoot = baseUrl ? `${baseUrl}/wp-json/api` : "/wp-json/api";

  if (!normalizedPath) return apiRoot;
  return `${apiRoot}/${normalizedPath}`;
}

export { normalizeWpSiteBaseUrl };
