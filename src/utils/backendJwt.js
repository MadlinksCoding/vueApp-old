function normalizeToken(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBackendJwtStorageKey() {
  return "__FSBackendJwtToken";
}

export function getBackendJwtToken() {
  if (typeof window !== "undefined") {
    const globalToken = normalizeToken(window[getBackendJwtStorageKey()]);
    if (globalToken) return globalToken;
  }

  return normalizeToken(import.meta.env.VITE_JWT_TEST_KEY || "");
}

export function setBackendJwtToken(token = "") {
  if (typeof window === "undefined") return "";
  const normalized = normalizeToken(token);
  window[getBackendJwtStorageKey()] = normalized;
  return normalized;
}

export function clearBackendJwtToken() {
  if (typeof window === "undefined") return;
  window[getBackendJwtStorageKey()] = "";
}
