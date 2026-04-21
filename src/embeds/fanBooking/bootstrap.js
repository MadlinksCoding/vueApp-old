import { reactive } from "vue";
import { toNumberOr } from "@/utils/contextIds.js";
import { logFanBookingDebug } from "@/embeds/fanBooking/debug.js";
import { normalizeCreatorPresentationInput } from "@/components/FanBookingFlow/OneOnOneBookingFlow/creatorPresentation.js";
import { setBackendJwtToken } from "@/utils/backendJwt.js";
import { normalizeBookingLocale, normalizeBookingTranslations } from "@/i18n/bookingTranslations.js";

const DEFAULT_BOOTSTRAP = {
  creatorId: null,
  fanId: null,
  eventId: null,
  apiBaseUrl: "",
  jwtToken: "",
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
  } catch (error) {
    logFanBookingDebug("bootstrap", "jwt:set-failed", {
      message: error?.message || "Failed to set backend JWT token.",
    });
  }
}

function normalizeEventId(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function toPositiveNumberOr(value, fallback = null) {
  const numeric = toNumberOr(value, fallback);
  if (numeric == null) return fallback;
  return numeric > 0 ? numeric : fallback;
}

function toNonNegativeNumberOr(value, fallback = null) {
  const numeric = toNumberOr(value, fallback);
  if (numeric == null) return fallback;
  return numeric >= 0 ? numeric : fallback;
}

export function normalizeOneOnOneBookingBootstrap(payload = {}) {
  return {
    creatorId: toPositiveNumberOr(payload.creatorId, null),
    fanId: toNonNegativeNumberOr(payload.fanId, null),
    eventId: normalizeEventId(payload.eventId),
    apiBaseUrl: typeof payload.apiBaseUrl === "string" ? payload.apiBaseUrl : "",
    jwtToken: typeof payload.jwtToken === "string" ? payload.jwtToken : "",
    creatorData: normalizeCreatorPresentationInput(payload.creatorData || {
      avatar: payload.creatorAvatar,
      name: payload.creatorName,
      isVerified: payload.creatorVerified,
    }),
    translations: normalizeBookingTranslations(payload.translations),
    locale: normalizeBookingLocale(payload.locale),
  };
}

export function applyOneOnOneBookingBootstrap(payload = {}) {
  const normalized = normalizeOneOnOneBookingBootstrap(payload);
  logFanBookingDebug("bootstrap", "apply:start", {
    payload,
    normalized,
  });
  bootstrapState.creatorId = normalized.creatorId;
  bootstrapState.fanId = normalized.fanId;
  bootstrapState.eventId = normalized.eventId;
  bootstrapState.apiBaseUrl = normalized.apiBaseUrl;
  bootstrapState.jwtToken = normalized.jwtToken;
  bootstrapState.creatorData = normalized.creatorData;
  bootstrapState.translations = normalized.translations;
  bootstrapState.locale = normalized.locale;
  bootstrapState.bootstrapped = normalized.creatorId != null;
  applyBackendJwtTokenSafely(normalized.jwtToken);
  logFanBookingDebug("bootstrap", "apply:end", {
    state: {
      creatorId: bootstrapState.creatorId,
      fanId: bootstrapState.fanId,
      eventId: bootstrapState.eventId,
      apiBaseUrl: bootstrapState.apiBaseUrl,
      jwtToken: bootstrapState.jwtToken,
      creatorData: bootstrapState.creatorData,
      translations: bootstrapState.translations,
      locale: bootstrapState.locale,
      bootstrapped: bootstrapState.bootstrapped,
    },
  });
  return normalized;
}

export function applyOneOnOneBookingAuthUpdate(payload = {}) {
  const fanId = toNonNegativeNumberOr(payload.fanId, null);
  const hasJwtToken = Object.prototype.hasOwnProperty.call(payload, "jwtToken");
  const jwtToken = hasJwtToken && typeof payload.jwtToken === "string" ? payload.jwtToken : "";

  logFanBookingDebug("bootstrap", "auth-update:start", {
    payload,
    normalized: { fanId, jwtToken },
  });

  if (fanId != null) {
    bootstrapState.fanId = fanId;
  }

  if (hasJwtToken) {
    bootstrapState.jwtToken = jwtToken;
    applyBackendJwtTokenSafely(jwtToken);
  }

  bootstrapState.bootstrapped = bootstrapState.creatorId != null;
  return {
    fanId: bootstrapState.fanId,
    jwtToken: bootstrapState.jwtToken,
  };
}

export function readOneOnOneBookingBootstrapFromUrl() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const creatorId = toPositiveNumberOr(params.get("creatorId"), null);
  const fanId = toNonNegativeNumberOr(params.get("fanId"), null);
  if (creatorId == null) {
    logFanBookingDebug("bootstrap", "url:missing", {
      creatorId,
      fanId,
      search: window.location.search,
    });
    return null;
  }

  const normalized = normalizeOneOnOneBookingBootstrap({
    creatorId,
    fanId,
    eventId: params.get("eventId"),
    apiBaseUrl: params.get("apiBaseUrl") || "",
    jwtToken: params.get("jwtToken") || "",
    creatorAvatar: params.get("creatorAvatar"),
    creatorName: params.get("creatorName"),
    creatorVerified: params.get("creatorVerified"),
    locale: params.get("locale") || "en",
  });
  logFanBookingDebug("bootstrap", "url:resolved", normalized);
  return normalized;
}

export function useOneOnOneBookingBootstrap() {
  return bootstrapState;
}
