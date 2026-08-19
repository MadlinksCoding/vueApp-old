import { getBackendJwtToken } from "@/utils/backendJwt.js";
import { showToast } from "@/utils/toastBus.js";

export const BACKEND_JWT_AUTH_ERROR_CODES = new Set([
  "missing_bearer_token",
  "missing_jwt_secret_key",
  "invalid_jwt_issuer",
  "invalid_jwt_audience",
  "jwt_missing_exp",
  "jwt_invalid_exp",
  "jwt_expired",
  "invalid_jwt_user_id",
  "invalid_jwt_token",
  "missing_backend_auth_context",
  "auth_user_resolution_failed",
]);

const DEFINITIVE_MESSAGES = Object.freeze({
  jwt_missing_exp: "JWT is missing exp",
  jwt_invalid_exp: "JWT exp is invalid",
  jwt_expired: "JWT is expired",
});

function normalizeCode(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function walkObjects(value, visit, depth = 0, seen = new Set()) {
  if (!value || typeof value !== "object" || depth > 7 || seen.has(value)) return null;
  seen.add(value);

  const result = visit(value);
  if (result) return result;

  const nestedKeys = ["error", "details", "data", "response", "body", "validation"];
  for (const key of nestedKeys) {
    const nested = value[key];
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const found = walkObjects(item, visit, depth + 1, seen);
        if (found) return found;
      }
      continue;
    }
    const found = walkObjects(nested, visit, depth + 1, seen);
    if (found) return found;
  }
  return null;
}

export function findBackendJwtAuthError(source) {
  return walkObjects(source, (candidate) => {
    const values = [candidate.error, candidate.code];
    const code = values.map(normalizeCode).find((value) => BACKEND_JWT_AUTH_ERROR_CODES.has(value));
    if (!code) return null;
    const message = typeof candidate.message === "string" && candidate.message.trim()
      ? candidate.message.trim()
      : DEFINITIVE_MESSAGES[code] || "JWT authentication failed";
    return { code, message };
  });
}

export function isBackendJwtAuthError(source) {
  return Boolean(findBackendJwtAuthError(source));
}

export function presentBackendJwtAuthError(source, options = {}) {
  const authError = findBackendJwtAuthError(source);
  if (!authError || typeof document === "undefined") return false;

  const explicitToken = typeof options.token === "string" ? options.token.trim() : "";
  const token = explicitToken || getBackendJwtToken();
  showToast({
    type: "error",
    title: options.title || "Authentication Failed",
    message: DEFINITIVE_MESSAGES[authError.code] || authError.message,
    autoClose: false,
    dedupeKey: "backend-jwt-auth-error",
    ...(token ? {
      action: {
        type: "copy",
        label: "Copy",
        successLabel: "Copied",
        failureLabel: "Copy failed",
        value: token,
      },
    } : {}),
  });
  return true;
}

