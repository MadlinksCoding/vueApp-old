import { reactive } from "vue";
import { toNumberOr } from "@/utils/contextIds.js";
import { normalizeCreatorPresentationInput } from "@/components/FanBookingFlow/OneOnOneBookingFlow/creatorPresentation.js";
import { setBackendJwtToken } from "@/utils/backendJwt.js";
import { setRuntimeTokenHandlerApiUrl } from "@/utils/TokenHandler.js";
import { normalizeBookingLocale, normalizeBookingTranslations } from "@/i18n/bookingTranslations.js";
import { normalizeDashboardBookingRole } from "@/utils/dashboardRole.js";

const DEFAULT_BOOTSTRAP = {
  creatorId: null,
  fanId: null,
  userRole: "creator",
  apiBaseUrl: "",
  tokenHandlerApiUrl: "",
  jwtToken: "",
  initialRoute: "events",
  initialAction: "",
  bookingId: "",
  bookingSnapshot: null,
  hostViewportWidth: null,
  creatorData: {
    avatar: null,
    name: null,
    isVerified: null,
  },
  translations: {},
  locale: "en",
  bootstrapped: false,
};

const bootstrapState = reactive({ ...DEFAULT_BOOTSTRAP });

function applyBackendJwtTokenSafely(jwtToken = "") {
  try {
    setBackendJwtToken(jwtToken);
  } catch (_error) {
    // Keep the embed bootstrapped even if the host JWT cache cannot be written.
  }
}

function normalizeInitialRoute(value) {
  const normalized = String(value || "events").trim().toLowerCase();
  if (["events", "create-private", "create-group", "booking-details"].includes(normalized)) {
    return normalized;
  }
  return "events";
}

function normalizeInitialAction(value) {
  return String(value || "").trim().toLowerCase() === "cancel" ? "cancel" : "";
}

function normalizeRuntimeUrl(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function applyTokenHandlerApiUrlSafely(tokenHandlerApiUrl = "") {
  const normalized = normalizeRuntimeUrl(tokenHandlerApiUrl);
  if (!normalized) return "";

  try {
    return setRuntimeTokenHandlerApiUrl(normalized);
  } catch (_error) {
    return normalized;
  }
}

export function normalizeEventsEmbedBootstrap(payload = {}) {
  const normalizedUserRole = typeof payload.userRole === "string" && payload.userRole
    ? payload.userRole
    : "creator";
  const normalizedFanId = toNumberOr(payload.fanId, null);

  return {
    creatorId: toNumberOr(payload.creatorId, null),
    fanId: normalizedFanId,
    userRole: normalizedUserRole,
    apiBaseUrl: typeof payload.apiBaseUrl === "string" ? payload.apiBaseUrl : "",
    tokenHandlerApiUrl: normalizeRuntimeUrl(payload.tokenHandlerApiUrl),
    jwtToken: typeof payload.jwtToken === "string" ? payload.jwtToken : "",
    initialRoute: normalizeInitialRoute(payload.initialRoute),
    initialAction: normalizeInitialAction(payload.initialAction),
    bookingId: typeof payload.bookingId === "string" || typeof payload.bookingId === "number"
      ? String(payload.bookingId).trim()
      : "",
    bookingSnapshot: payload.bookingSnapshot && typeof payload.bookingSnapshot === "object"
      ? payload.bookingSnapshot
      : null,
    hostViewportWidth: toNumberOr(payload.hostViewportWidth, null),
    creatorData: normalizeCreatorPresentationInput(payload.creatorData || {
      avatar: payload.creatorAvatar,
      name: payload.creatorName,
      isVerified: payload.creatorVerified,
    }),
    translations: normalizeBookingTranslations(payload.translations),
    locale: normalizeBookingLocale(payload.locale),
  };
}

export function applyEventsEmbedBootstrap(payload = {}) {
  const normalized = normalizeEventsEmbedBootstrap(payload);
  bootstrapState.creatorId = normalized.creatorId;
  bootstrapState.fanId = normalized.fanId;
  bootstrapState.userRole = normalized.userRole;
  bootstrapState.apiBaseUrl = normalized.apiBaseUrl;
  bootstrapState.tokenHandlerApiUrl = applyTokenHandlerApiUrlSafely(normalized.tokenHandlerApiUrl);
  bootstrapState.jwtToken = normalized.jwtToken;
  bootstrapState.initialRoute = normalized.initialRoute;
  bootstrapState.initialAction = normalized.initialAction;
  bootstrapState.bookingId = normalized.bookingId;
  bootstrapState.bookingSnapshot = normalized.bookingSnapshot;
  bootstrapState.hostViewportWidth = normalized.hostViewportWidth;
  bootstrapState.creatorData = normalized.creatorData;
  bootstrapState.translations = normalized.translations;
  bootstrapState.locale = normalized.locale;
  bootstrapState.bootstrapped = normalizeDashboardBookingRole(normalized.userRole) === "fan"
    ? normalized.fanId != null
    : normalized.creatorId != null;
  applyBackendJwtTokenSafely(normalized.jwtToken);
  return normalized;
}

export function applyEventsEmbedAuthUpdate(payload = {}) {
  if (typeof payload.jwtToken !== "string") return bootstrapState.jwtToken;

  bootstrapState.jwtToken = payload.jwtToken;
  applyBackendJwtTokenSafely(payload.jwtToken);
  return bootstrapState.jwtToken;
}

export function applyEventsEmbedHostViewport(payload = {}) {
  const hostViewportWidth = toNumberOr(payload.hostViewportWidth, null);
  bootstrapState.hostViewportWidth = Number.isFinite(hostViewportWidth) && hostViewportWidth > 0
    ? hostViewportWidth
    : null;
  return bootstrapState.hostViewportWidth;
}

export function readEventsEmbedBootstrapFromUrl() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const creatorId = toNumberOr(params.get("creatorId"), null);
  const userRole = params.get("userRole") || "creator";
  const fanId = toNumberOr(params.get("fanId"), null);

  if (normalizeDashboardBookingRole(userRole) === "fan") {
    if (fanId == null) return null;
  } else if (creatorId == null) {
    return null;
  }

  return normalizeEventsEmbedBootstrap({
    creatorId,
    fanId,
    userRole,
    apiBaseUrl: params.get("apiBaseUrl") || "",
    tokenHandlerApiUrl: params.get("tokenHandlerApiUrl") || "",
    jwtToken: params.get("jwtToken") || "",
    initialRoute: params.get("initialRoute") || "events",
    initialAction: "",
    bookingId: params.get("bookingId") || "",
    hostViewportWidth: window.innerWidth,
    creatorAvatar: params.get("creatorAvatar"),
    creatorName: params.get("creatorName"),
    creatorVerified: params.get("creatorVerified"),
    locale: params.get("locale") || "en",
  });
}

export function useEventsEmbedBootstrap() {
  return bootstrapState;
}
