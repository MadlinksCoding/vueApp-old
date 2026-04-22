import { bookingFlowProfileImage } from "./oneOnOneBookingFlowAssets.js";

export const DEFAULT_CREATOR_NAME = "Princess Carrot Pop";

function normalizeText(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return null;
}

function readPath(source, path) {
  return String(path).split(".").reduce((cursor, segment) => (
    cursor == null ? cursor : cursor[segment]
  ), source);
}

function readFirstNormalizedText(sources, paths) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const path of paths) {
      const value = normalizeText(readPath(source, path));
      if (value) return value;
    }
  }
  return null;
}

function readFirstNormalizedBoolean(sources, paths) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const path of paths) {
      const value = normalizeBoolean(readPath(source, path));
      if (value !== null) return value;
    }
  }
  return null;
}

export function normalizeCreatorPresentationInput(value = {}) {
  return {
    avatar: normalizeText(value?.avatar ?? value?.avatarUrl ?? value?.avatar_url),
    name: normalizeText(value?.name ?? value?.display_name ?? value?.displayName ?? value?.username),
    isVerified: normalizeBoolean(value?.isVerified ?? value?.is_premium),
  };
}

export function normalizeCreatorProfilePresentation(user = {}, fallback = {}) {
  const normalizedFallback = normalizeCreatorPresentationInput(fallback || {});
  const profile = normalizeCreatorPresentationInput({
    avatar: user?.avatar,
    name: user?.display_name || user?.displayName || user?.username,
    isVerified: user?.is_premium,
  });

  return {
    avatar: profile.avatar || normalizedFallback.avatar,
    name: profile.name || normalizedFallback.name,
    isVerified: profile.isVerified ?? normalizedFallback.isVerified,
  };
}

export function resolveCreatorPresentation({
  explicitCreatorData = null,
  selectedEvent = null,
  bookingResult = null,
} = {}) {
  const explicit = normalizeCreatorPresentationInput(explicitCreatorData || {});
  const fallbackSources = [
    bookingResult?.item?.eventSnapshot,
    bookingResult?.item,
    bookingResult,
    selectedEvent,
    selectedEvent?.raw,
  ];

  const avatar = explicit.avatar || readFirstNormalizedText(fallbackSources, [
    "creatorAvatarUrl",
    "creatorAvatar",
    "avatarUrl",
    "avatar",
    "profileImageUrl",
    "profileImage",
    "creator.avatarUrl",
    "creator.avatar",
    "creator.profileImageUrl",
    "creator.profileImage",
  ]) || bookingFlowProfileImage;

  const name = explicit.name || readFirstNormalizedText(fallbackSources, [
    "creatorDisplayName",
    "creatorName",
    "displayName",
    "hostDisplayName",
    "hostName",
    "creator.displayName",
    "creator.name",
  ]) || DEFAULT_CREATOR_NAME;

  const isVerified = explicit.isVerified ?? readFirstNormalizedBoolean(fallbackSources, [
    "creatorIsVerified",
    "isVerified",
    "is_premium",
    "verified",
    "creator.isVerified",
    "creator.is_premium",
    "creator.verified",
  ]) ?? false;

  return {
    avatar,
    name,
    isVerified,
  };
}
