import { reactive } from "vue";
import { toNumberOr } from "@/utils/contextIds.js";
import { logFanBookingDebug } from "@/embeds/fanBooking/debug.js";
import { normalizeCreatorPresentationInput } from "@/components/FanBookingFlow/OneOnOneBookingFlow/creatorPresentation.js";
import { setBackendJwtToken } from "@/utils/backendJwt.js";

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
  bootstrapped: false,
};

const bootstrapState = reactive({ ...DEFAULT_BOOTSTRAP });

function normalizeEventId(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

export function normalizeOneOnOneBookingBootstrap(payload = {}) {
  return {
    creatorId: toNumberOr(payload.creatorId, null),
    fanId: toNumberOr(payload.fanId, null),
    eventId: normalizeEventId(payload.eventId),
    apiBaseUrl: typeof payload.apiBaseUrl === "string" ? payload.apiBaseUrl : "",
    jwtToken: typeof payload.jwtToken === "string" ? payload.jwtToken : "",
    creatorData: normalizeCreatorPresentationInput(payload.creatorData || {
      avatar: payload.creatorAvatar,
      name: payload.creatorName,
      isVerified: payload.creatorVerified,
    }),
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
  setBackendJwtToken(normalized.jwtToken);
  bootstrapState.bootstrapped = normalized.creatorId != null && normalized.fanId != null;
  logFanBookingDebug("bootstrap", "apply:end", {
    state: {
      creatorId: bootstrapState.creatorId,
      fanId: bootstrapState.fanId,
      eventId: bootstrapState.eventId,
      apiBaseUrl: bootstrapState.apiBaseUrl,
      jwtToken: bootstrapState.jwtToken,
      creatorData: bootstrapState.creatorData,
      bootstrapped: bootstrapState.bootstrapped,
    },
  });
  return normalized;
}

export function readOneOnOneBookingBootstrapFromUrl() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const creatorId = toNumberOr(params.get("creatorId"), null);
  const fanId = toNumberOr(params.get("fanId"), null);
  if (creatorId == null || fanId == null) {
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
  });
  logFanBookingDebug("bootstrap", "url:resolved", normalized);
  return normalized;
}

export function useOneOnOneBookingBootstrap() {
  return bootstrapState;
}
