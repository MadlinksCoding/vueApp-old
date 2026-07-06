import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { asFlowError } from "@/services/chat/chatApiUtils.js";

function getWpBaseUrl() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_WEB_BASE_URL) {
    return import.meta.env.VITE_WEB_BASE_URL;
  }
  return "";
}

export async function fetchNewMessageUsersFlow({ payload, context, api }) {
  const { creatorId, search, section, page, perPage } = payload || {};

  if (!creatorId) {
    return fail({ code: "FETCH_NEW_MESSAGE_USERS_MISSING_CREATOR", message: "creatorId is required." });
  }

  const baseUrl = getWpBaseUrl();
  const headers = context?.requestHeaders || {};

  const params = { creator_id: creatorId };
  if (search !== undefined && search !== "") params.search = search;
  if (section) params.section = section;
  if (page) params.page = page;
  if (perPage) params.per_page = perPage;

  // Add a 5-minute rounded cache buster to the URL
  const fiveMinMs = 5 * 60 * 1000;
  // params._t = Math.floor(Date.now() / fiveMinMs) * fiveMinMs;
  params._t = Date.now(); // Use current timestamp for cache busting

  try {
    const response = await api.get(
      `${baseUrl}/wp-json/api/chat/new-message-users`,
      { params },
      { headers, signal: context?.signal }
    );
    const status = getHttpStatus(response, 200);

    if (response?.ok === false) {
      return fail(
        { code: "FETCH_NEW_MESSAGE_USERS_FAILED", message: response?.error || "Failed to fetch new message users." },
        { flow: "chat.fetchNewMessageUsers", status }
      );
    }

    return ok(response, { flow: "chat.fetchNewMessageUsers", status });
  } catch (error) {
    return asFlowError(error, "FETCH_NEW_MESSAGE_USERS_UNEXPECTED", "An unexpected error occurred while fetching new message users.");
  }
}
