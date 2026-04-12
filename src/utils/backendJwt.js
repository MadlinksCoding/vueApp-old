const GLOBAL_BACKEND_JWT_KEY = "__FSBackendJwtToken";

function normalizeToken(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function getBackendJwtToken() {
  if (typeof window !== "undefined") {
    const globalToken = normalizeToken(window[GLOBAL_BACKEND_JWT_KEY]);
    if (globalToken) return globalToken;
  }

  return normalizeToken(import.meta.env.VITE_JWT_TEST_KEY || "");
}

export function setBackendJwtToken(token = "") {
  if (typeof window === "undefined") return "";
  const normalized = normalizeToken(token);
  window[GLOBAL_BACKEND_JWT_KEY] = normalized;
  return normalized;
}

export function clearBackendJwtToken() {
  if (typeof window === "undefined") return;
  window[GLOBAL_BACKEND_JWT_KEY] = "";
}
