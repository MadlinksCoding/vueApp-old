import { fetchUserProfileData } from "@/services/users/userProfileApi.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const profileCache = new Map();
const profileRequests = new Map();

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

export function normalizeBookingNoticeProfile(profile) {
  if (!profile || typeof profile !== "object") return null;

  return {
    displayName: firstString(profile.display_name, profile.displayName, profile.name),
    username: firstString(profile.username, profile.user_login),
    avatar: firstString(profile.avatar, profile.avatarUrl, profile.avatar_url),
  };
}

export function fetchBookingNoticeProfile(userId) {
  const key = userId === null || userId === undefined ? "" : String(userId).trim();
  if (!key) return Promise.resolve(null);

  const cached = profileCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(cached.profile);
  }

  if (profileRequests.has(key)) return profileRequests.get(key);

  const request = fetchUserProfileData(key)
    .then((profile) => {
      const normalized = normalizeBookingNoticeProfile(profile);
      profileCache.set(key, { profile: normalized, fetchedAt: Date.now() });
      return normalized;
    })
    .finally(() => {
      profileRequests.delete(key);
    });

  profileRequests.set(key, request);
  return request;
}

export function clearBookingNoticeProfileCache() {
  profileCache.clear();
  profileRequests.clear();
}
