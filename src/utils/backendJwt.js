function normalizeToken(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeBackendAuthContext(payload = {}) {
  const source = payload?.response && typeof payload.response === "object"
    ? { ...payload.response, ...payload }
    : payload;
  const userId = [
    source?.userId,
    source?.user_id,
    source?.userData?.userID,
    source?.userData?.user_id,
    source?.data?.userId,
    source?.data?.user_id,
  ]
    .map(Number)
    .find((value) => Number.isFinite(value) && value > 0) || 0;
  const backendJwtToken = [
    source?.backendJwtToken,
    source?.jwtToken,
    source?.backend_jwt_token,
    source?.jwt_token,
    source?.data?.backendJwtToken,
    source?.data?.jwtToken,
    source?.userData?.jwtToken,
  ]
    .map(normalizeToken)
    .find(Boolean) || "";

  return { userId, backendJwtToken };
}

const BACKEND_JWT_STORAGE_KEY = "__FSBackendJwtToken";
const DEV_TEST_JWT_FALLBACK = typeof __FS_DEV_JWT_TEST_KEY__ === "string" ? __FS_DEV_JWT_TEST_KEY__ : "";

function getBackendJwtStorageKey() {
  return BACKEND_JWT_STORAGE_KEY;
}

export function getBackendJwtToken() {
  return getRuntimeBackendJwtToken() || normalizeToken(DEV_TEST_JWT_FALLBACK);
}

export function getRuntimeBackendJwtToken() {
  if (typeof window !== "undefined") {
    const globalToken = normalizeToken(window[getBackendJwtStorageKey()]);
    if (globalToken) return globalToken;
  }

  return "";
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
