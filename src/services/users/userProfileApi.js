import { buildWpApiUrl } from "@/utils/wpApiBaseUrl.js";

export async function fetchUserProfileData(userId, { signal } = {}) {
  if (userId === null || userId === undefined || userId === "") {
    return null;
  }

  const url = `${buildWpApiUrl("/users/get-profile-data")}?id=${encodeURIComponent(userId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile data (HTTP ${response.status}).`);
  }

  const payload = await response.json();
  return payload?.user || null;
}
