import { fail, ok } from "../../flow-system/flowTypes.js";
import { getHttpStatus } from "../../flow-system/runtime/httpMetaRuntime.js";
import { getBlockApiBaseUrl, asBlockFlowError } from "../blockApiUtils.js";

export async function isUserBlockedFlow({ payload, context, api }) {
  const baseUrl = getBlockApiBaseUrl(context);
  const { from, to, scope } = payload;

  if (!from || !to) {
    return fail({ code: "IS_BLOCKED_MISSING_FIELDS", message: "'from' and 'to' fields are required." });
  }

  try {
    let url = `${baseUrl}/block-users/isUserBlocked?from=${encodeURIComponent(String(from))}&to=${encodeURIComponent(String(to))}`;
    if (scope) {
      url += `&scope=${encodeURIComponent(String(scope))}`;
    }

    const response = await api.get(url);
    const status = getHttpStatus(response, 200);

    if (response?.ok === false || status >= 400) {
      return fail({
        code: "IS_BLOCKED_CHECK_FAILED",
        message: response?.error?.message || "Failed to check block status.",
        details: { status, response }
      });
    }

    // The API returns { blocked: true/false }
    return ok(response?.data || response);
  } catch (error) {
    return asBlockFlowError(error, "IS_BLOCKED_EXCEPTION", "Exception while checking block status.");
  }
}
