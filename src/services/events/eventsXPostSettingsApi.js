import { buildWpApiUrl } from "@/utils/wpApiBaseUrl.js";

export const X_REPOST_ALLOWED_CREATOR_IDS = Object.freeze([566, 793, 1407]);

export function isCreatorAllowedForXRepost(creatorId) {
  return X_REPOST_ALLOWED_CREATOR_IDS.includes(Number(creatorId));
}

export const EVENT_X_POST_ACTIONS = Object.freeze({
  on_schedule_live: Object.freeze({
    enabledField: "on_schedule_live",
    modelField: "xPostLive",
    messageField: "on_schedule_live_message",
    mediaField: "on_schedule_live_media_url",
  }),
  on_booking_received: Object.freeze({
    enabledField: "on_booking_received",
    modelField: "xPostBooked",
    messageField: "on_booking_received_message",
    mediaField: "on_booking_received_media_url",
  }),
  on_in_session: Object.freeze({
    enabledField: "on_in_session",
    modelField: "xPostInSession",
    messageField: "on_in_session_message",
    mediaField: "on_in_session_media_url",
  }),
  on_tipped_session: Object.freeze({
    enabledField: "on_tipped_session",
    modelField: "xPostTipped",
    messageField: "on_tipped_session_message",
    mediaField: "on_tipped_session_media_url",
  }),
  on_purchased_in_session: Object.freeze({
    enabledField: "on_purchased",
    modelField: "xPostPurchase",
    messageField: "on_purchased_message",
    mediaField: "on_purchased_media_url",
  }),
});

function nonEmptyString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readWindowUserData(windowRef) {
  if (!windowRef) return [];

  const values = [];
  try {
    if (windowRef.userData && typeof windowRef.userData === "object") {
      values.push(windowRef.userData);
    }
  } catch (_) {
    // Cross-origin parent access can throw.
  }

  try {
    const parentUserData = windowRef.parent?.userData;
    if (parentUserData && typeof parentUserData === "object" && !values.includes(parentUserData)) {
      values.push(parentUserData);
    }
  } catch (_) {
    // Cross-origin parent access can throw.
  }

  return values;
}

export function resolveWordPressUid(windowRef = typeof window !== "undefined" ? window : null) {
  const keys = ["UID", "uid", "encrypted_uid", "encryptedUid", "userUID", "userUid"];

  for (const userData of readWindowUserData(windowRef)) {
    const nestedCandidates = [userData, userData.user].filter(
      (candidate) => candidate && typeof candidate === "object",
    );

    for (const candidate of nestedCandidates) {
      for (const key of keys) {
        const value = nonEmptyString(candidate[key]);
        if (value) return value;
      }
    }
  }

  return "";
}

function buildRequestIdentity({ creatorId, uid } = {}) {
  const safeCreatorId = Number(creatorId);
  const resolvedUid = nonEmptyString(uid) || resolveWordPressUid();

  return {
    creatorId: Number.isFinite(safeCreatorId) && safeCreatorId > 0 ? safeCreatorId : null,
    uid: resolvedUid,
  };
}

async function parseResponseBody(response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

async function assertSuccessfulResponse(response, fallbackMessage) {
  const body = await parseResponseBody(response);
  if (!response.ok || body?.success === false) {
    const error = new Error(String(body?.message || body?.error || fallbackMessage));
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body || {};
}

function normalizeActionSetting(value = {}) {
  const source = ["event", "default", "missing"].includes(value?.source)
    ? value.source
    : "missing";

  return {
    enabled: Boolean(value?.enabled),
    message: String(value?.message || ""),
    mediaUrl: String(value?.mediaUrl || ""),
    source,
  };
}

export function normalizeEventXPostSettings(payload = {}) {
  const source = payload?.settings && typeof payload.settings === "object"
    ? payload.settings
    : {};
  const settings = {};

  Object.keys(EVENT_X_POST_ACTIONS).forEach((actionKey) => {
    settings[actionKey] = normalizeActionSetting(source[actionKey]);
  });

  return {
    success: payload?.success !== false,
    eventId: String(payload?.eventId || ""),
    settings,
  };
}

export function mergeEventXPostSettingsIntoFormState(formState = {}, response = {}, options = {}) {
  const nextState = { ...formState };
  const normalized = normalizeEventXPostSettings(response);
  const shouldApplyAction = typeof options.shouldApplyAction === "function"
    ? options.shouldApplyAction
    : () => true;

  Object.entries(EVENT_X_POST_ACTIONS).forEach(([actionKey, fields]) => {
    const setting = normalized.settings[actionKey];
    if (!shouldApplyAction(actionKey, setting, fields)) return;

    if (setting.source !== "missing") {
      nextState[fields.enabledField] = setting.enabled;
      nextState[fields.modelField] = setting.enabled;
      nextState[fields.messageField] = setting.message;
      nextState[fields.mediaField] = setting.mediaUrl;
      return;
    }

    nextState[fields.messageField] = "";
    nextState[fields.mediaField] = "";
  });

  return nextState;
}

export function buildEventXPostSettingsPayload(state = {}) {
  const settings = {};

  Object.entries(EVENT_X_POST_ACTIONS).forEach(([actionKey, fields]) => {
    settings[actionKey] = {
      enabled: Boolean(state[fields.enabledField] ?? state[fields.modelField]),
      message: String(state[fields.messageField] || ""),
      mediaUrl: String(state[fields.mediaField] || ""),
    };
  });

  return settings;
}

export async function fetchEventXPostSettings({
  eventId,
  creatorId,
  uid,
  signal,
} = {}) {
  const safeEventId = nonEmptyString(String(eventId || ""));
  if (!safeEventId) {
    throw new Error("eventId is required to load X post settings.");
  }

  const identity = buildRequestIdentity({ creatorId, uid });
  const query = new URLSearchParams();
  if (identity.creatorId) query.set("creator_id", String(identity.creatorId));
  if (identity.uid) query.set("uid", identity.uid);

  const queryString = query.toString();
  const url = `${buildWpApiUrl(`/event/${encodeURIComponent(safeEventId)}/x-post-settings`)}${queryString ? `?${queryString}` : ""}`;
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    signal,
    headers: { Accept: "application/json" },
  });

  return normalizeEventXPostSettings(
    await assertSuccessfulResponse(response, "Could not load X post settings."),
  );
}

export async function saveEventXPostSettings({
  eventId,
  creatorId,
  uid,
  state,
  signal,
} = {}) {
  const safeEventId = nonEmptyString(String(eventId || ""));
  if (!safeEventId) {
    throw new Error("eventId is required to save X post settings.");
  }

  const identity = buildRequestIdentity({ creatorId, uid });
  const requestBody = {
    ...(identity.creatorId ? { creator_id: identity.creatorId } : {}),
    ...(identity.uid ? { uid: identity.uid } : {}),
    settings: buildEventXPostSettingsPayload(state),
  };
  const response = await fetch(
    buildWpApiUrl(`/event/${encodeURIComponent(safeEventId)}/x-post-settings`),
    {
      method: "PUT",
      credentials: "include",
      keepalive: true,
      signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  return normalizeEventXPostSettings(
    await assertSuccessfulResponse(response, "Could not save X post settings."),
  );
}
